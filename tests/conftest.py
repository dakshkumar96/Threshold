"""Shared test setup. It runs before any test module is imported.

`prepare_environment` puts `src/` and the repo root on the path and sets a safe
set of environment variables, so a developer's real `.env` keys are never used.
"""

from tests.golden.harness import prepare_environment

prepare_environment()
