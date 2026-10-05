"""A stand-in for Clerk. A small local web server publishes signing keys, and tokens are signed to match."""

from __future__ import annotations

import json
import threading
import time
from http.server import BaseHTTPRequestHandler, HTTPServer
from typing import Any

import jwt
from cryptography.hazmat.primitives.asymmetric import rsa
from jwt.algorithms import RSAAlgorithm


class FakeClerk:
    """Publishes one signing key at /.well-known/jwks.json and signs tokens with it."""

    def __init__(self, kid: str = "test-key") -> None:
        self.kid = kid
        self.key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
        self.requests: list[str] = []
        jwk = json.loads(RSAAlgorithm.to_jwk(self.key.public_key()))
        jwk.update({"kid": kid, "use": "sig", "alg": "RS256"})
        body = json.dumps({"keys": [jwk]}).encode()
        requests = self.requests

        class Handler(BaseHTTPRequestHandler):
            def do_GET(self) -> None:
                requests.append(self.path)
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(body)))
                self.end_headers()
                self.wfile.write(body)

            def log_message(self, *args: Any) -> None:
                pass

        self._server = HTTPServer(("127.0.0.1", 0), Handler)
        self._thread = threading.Thread(target=self._server.serve_forever, daemon=True)
        self._thread.start()

    @property
    def issuer(self) -> str:
        return f"http://127.0.0.1:{self._server.server_address[1]}"

    def token(self, **overrides: Any) -> str:
        """A correctly signed token. Pass a claim as None to leave it out."""
        now = int(time.time())
        claims: dict[str, Any] = {
            "iss": self.issuer,
            "sub": "user_real",
            "iat": now,
            "exp": now + 3600,
        }
        claims.update(overrides)
        claims = {name: value for name, value in claims.items() if value is not None}
        return jwt.encode(claims, self.key, algorithm="RS256", headers={"kid": self.kid})

    def close(self) -> None:
        self._server.shutdown()
        self._server.server_close()
