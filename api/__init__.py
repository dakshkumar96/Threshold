"""The Threshold API (`uvicorn api.main:app` from the repo root).

The API shares code with the offline pipeline in `src/`, so `src/` goes on the
import path here once, for every module in this package.
"""

import sys
from pathlib import Path

_SRC = str(Path(__file__).resolve().parent.parent / "src")
if _SRC not in sys.path:
    sys.path.insert(0, _SRC)
