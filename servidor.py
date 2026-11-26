# Servidor local del prototipo: sirve la carpeta app/ sin caché (siempre la última versión).
import http.server, functools, os, sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 5173
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "app")

class NoCache(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

http.server.ThreadingHTTPServer(("127.0.0.1", PORT), functools.partial(NoCache, directory=ROOT)).serve_forever()
