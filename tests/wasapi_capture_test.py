"""Regression for non-silent WASAPI buffers, without playing or capturing sound."""
import sys
import unittest
from types import SimpleNamespace

import numpy as np


@unittest.skipUnless(sys.platform == "win32", "WASAPI is Windows-only")
class WasapiBufferTests(unittest.TestCase):
    def test_non_silent_binary_buffer_with_installed_numpy(self):
        from soundcard import mediafoundation as backend
        raw = backend._ffi.new("float[]", [.125, -.25, .5, -.75])
        released = []
        recorder = SimpleNamespace(
            channelmap=[0, 1], _is_first_frame=False, _idle_start_time=None,
            _capture_available_frames=lambda: 2,
            _capture_buffer=lambda: (raw, 2, 0),
            _capture_release=lambda n: released.append(n),
        )
        # Execute the actual SoundCard conversion path, not a replacement FFT.
        values = backend._Recorder._record_chunk(recorder)
        np.testing.assert_array_equal(values, np.array([.125, -.25, .5, -.75], dtype=np.float32))
        self.assertEqual(released, [2])
        raw[0] = 0
        self.assertEqual(values[0], .125, "The array must own its data after WASAPI releases the buffer")


if __name__ == "__main__":
    unittest.main()
