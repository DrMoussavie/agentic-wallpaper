"""WASAPI output -> 48 logarithmic frequency bands. PCM never leaves memory."""
import json
import time
import warnings
import os
import sys
import threading
import numpy as np

RATE, SIZE, BANDS = 48000, 8192, 48
EDGES = np.geomspace(40, 20000, BANDS + 1)
WINDOW = np.hanning(SIZE)
FREQUENCIES = np.fft.rfftfreq(SIZE, 1 / RATE)
RANGES = []
for low, high in zip(EDGES[:-1], EDGES[1:]):
    indices = np.flatnonzero((FREQUENCIES >= low) & (FREQUENCIES < high))
    if not len(indices):
        indices = np.array([np.argmin(abs(FREQUENCIES - np.sqrt(low * high)))])
    RANGES.append(indices)


def spectrum(samples):
    # Power per channel prevents inverted left/right signals cancelling each other.
    fft = np.fft.rfft(samples * WINDOW[:, None], axis=0)
    power = np.mean(abs(fft * (2 / WINDOW.sum())) ** 2, axis=1)
    db = np.array([10 * np.log10(max(1e-12, power[ix].max())) for ix in RANGES])
    return np.clip((db + 65) / 57, 0, 1).round(4).tolist()


def emit(data):
    print(json.dumps(data, separators=(",", ":")), flush=True)


def report(error):
    # stderr reaches the relay log; PCM and device names never do.
    print("audio-spectrum: %s: %s" % (type(error).__name__, error), file=sys.stderr, flush=True)


def capture():
    import soundcard as sc
    from soundcard import mediafoundation
    warnings.filterwarnings("ignore", category=sc.SoundcardRuntimeWarning)
    while True:
        try:
            speaker = sc.default_speaker()
            # soundcard 0.4.6 corrupts the heap when it reads device properties
            # (name, channel count), which get_microphone() does for every device.
            # Build the loopback from the default endpoint id and let WASAPI's
            # shared-mode converter deliver stereo whatever the device layout is.
            loopback = mediafoundation._Microphone(speaker, isloopback=True)
            # Shared mode: does not seize or change the audio device.
            with loopback.recorder(samplerate=RATE, channels=2, blocksize=2400) as recorder:
                samples = None
                last_device_check = time.monotonic()
                while True:
                    block = recorder.record(numframes=2400)
                    if samples is None:
                        samples = np.zeros((SIZE, block.shape[1]))
                    samples[:-len(block)] = samples[len(block):]
                    samples[-len(block):] = block
                    emit({"status": "live", "minHz": 40, "maxHz": 20000,
                          "sampleRate": RATE, "bands": spectrum(samples)})
                    if time.monotonic() - last_device_check > 3:
                        last_device_check = time.monotonic()
                        if sc.default_speaker().id != speaker.id:
                            break
        except (BrokenPipeError, KeyboardInterrupt):
            return
        except Exception as error:
            report(error)
            emit({"status": "unavailable", "bands": []})
            time.sleep(3)


if __name__ == "__main__":
    if "--watch-parent" in sys.argv:
        # EOF closes this helper even if Windows force-stops the Node relay.
        def watch_parent():
            sys.stdin.buffer.read(1)
            os._exit(0)
        threading.Thread(target=watch_parent, daemon=True).start()
    capture()
