"""Read Codex turn status columns only. No messages, prompts or SQL writes."""
import json
import os
import pathlib
import sqlite3
import sys
from contextlib import closing


def read_statuses(home, identities):
    database = pathlib.Path(home).resolve() / "thread_history_1.sqlite"
    if not database.is_file():
        return []
    result = []
    # Read-only connection sees the current WAL; an absent/schema-changed DB fails closed.
    with closing(sqlite3.connect(database.as_uri() + "?mode=ro", uri=True, timeout=0.15)) as db:
        db.execute("PRAGMA query_only=ON")
        for entry in identities[:64]:
            row = db.execute(
                "SELECT status, started_at, completed_at FROM thread_turns "
                "WHERE thread_id=? ORDER BY rollout_ordinal DESC LIMIT 1",
                (entry["threadId"],),
            ).fetchone()
            if row:
                result.append({"id": entry["id"], "status": row[0],
                               "startedAt": (row[1] or 0)*1000,
                               "completedAt": (row[2] or 0)*1000})
    return result


if __name__ == "__main__":
    try:
        payload = json.loads(sys.stdin.read(32768))
        home = os.environ.get("CODEX_HOME", str(pathlib.Path.home()/".codex"))
        print(json.dumps(read_statuses(home, payload)))
    except Exception:
        print("[]")
