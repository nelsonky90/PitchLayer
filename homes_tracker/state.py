import json
from pathlib import Path


def load(state_file: str) -> dict:
    path = Path(state_file)
    if not path.exists():
        return {"last_rowid": 0}
    with open(path) as f:
        return json.load(f)


def save(state_file: str, data: dict) -> None:
    path = Path(state_file)
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w") as f:
        json.dump(data, f, indent=2)
