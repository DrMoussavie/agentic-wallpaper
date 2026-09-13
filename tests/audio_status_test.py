import importlib.util
import pathlib
import sqlite3
import tempfile
import unittest
import numpy as np

ROOT = pathlib.Path(__file__).resolve().parent.parent
def module(name, file):
    spec = importlib.util.spec_from_file_location(name, ROOT / "bridge" / file)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod
audio = module("spectrum", "audio-spectrum.py")
statuses = module("statuses", "session-status.py")

class SignalTests(unittest.TestCase):
    def test_silence_and_real_frequency_mapping(self):
        self.assertEqual(max(audio.spectrum(np.zeros((audio.SIZE, 2)))), 0)
        for hz in [80, 440, 1000, 8000, 19000]:
            tone = .1*np.sin(2*np.pi*hz*np.arange(audio.SIZE)/audio.RATE)
            band = int(np.argmax(audio.spectrum(np.column_stack((tone, tone)))))
            self.assertLessEqual(audio.EDGES[band], hz)
            self.assertGreater(audio.EDGES[band+1], hz)
    def test_stereo_phase_cannot_cancel(self):
        tone = .1*np.sin(2*np.pi*1000*np.arange(audio.SIZE)/audio.RATE)
        self.assertEqual(audio.spectrum(np.column_stack((tone, tone))),
                         audio.spectrum(np.column_stack((tone, -tone))))
    def test_metadata_only_and_missing_schema(self):
        with tempfile.TemporaryDirectory() as home:
            self.assertEqual(statuses.read_statuses(home, [{"id":"x","threadId":"x"}]), [])
            with sqlite3.connect(pathlib.Path(home)/"thread_history_1.sqlite") as db:
                db.execute("CREATE TABLE thread_turns(thread_id,rollout_ordinal,status,started_at,completed_at)")
                db.executemany("INSERT INTO thread_turns VALUES(?,?,?,?,?)", [("x",1,"completed",1,2),("x",2,"inProgress",3,None)])
            db.close()
            rows=statuses.read_statuses(home, [{"id":"opaque","threadId":"x"}])
            self.assertEqual(rows,[{"id":"opaque","status":"inProgress","startedAt":3000,"completedAt":0}])

if __name__ == "__main__":
    unittest.main()
