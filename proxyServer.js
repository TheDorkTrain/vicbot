const http = require('http');
const WebSocket = require('ws');
const { EventEmitter } = require('events');

class ChatProxy extends EventEmitter {
  constructor({ port = 3000, host = '127.0.0.1', sourcePath = '/live/discord', provider = 'tiktok' } = {}) {
    super();
    this.port = port;
    this.host = host;
    this.clients = new Set();
    this.httpServer = null;
    this.wsServer = null;
    this.sourcePath = sourcePath;
    this.provider = provider;
  }

  start() {
    this.httpServer = http.createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, service: 'vicbot-chat-proxy', source: `http://${this.host}:${this.port}${this.sourcePath}` }));
        return;
      }

      if (req.url === this.sourcePath || req.url === `${this.sourcePath}/`) {
        const source = `http://${this.host}:${this.port}${this.sourcePath}`;
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <title>${this.provider} Live</title>
    <meta property="og:type" content="video.other" />
    <meta property="og:title" content="Vicbot Discord Chat" />
    <meta property="og:description" content="Proxy source for Discord chat" />
    <meta property="og:url" content="${source}" />
    <meta property="og:image" content="https://p16-sign-va.tiktokcdn.com/img/musically-maliva-obj/placeholder~tplv-obj.webp" />
    <meta name="twitter:card" content="player" />
    <meta name="twitter:title" content="Vicbot Discord Chat" />
    <meta name="twitter:image" content="https://p16-sign-va.tiktokcdn.com/img/musically-maliva-obj/placeholder~tplv-obj.webp" />
  </head>
  <body>
    <h1>Vicbot Discord Chat Source</h1>
    <p>This page is served locally for source compatibility.</p>
    <script>
      window.__vicbot_source__ = { provider: '${this.provider}', source: '${source}', chat: true };
      window.__tiktok_player__ = { status: 'ok', id: 'discord' };
    </script>
  </body>
</html>`);
        return;
      }

      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'not found' }));
    });

    this.wsServer = new WebSocket.Server({ server: this.httpServer });

    this.wsServer.on('connection', (socket) => {
      this.clients.add(socket);
      socket.send(JSON.stringify({ type: 'welcome', message: 'connected' }));

      socket.on('message', (data) => {
        try {
          const payload = JSON.parse(data.toString());
          this.emit('message', payload);
        } catch (err) {
          this.emit('message', { raw: data.toString() });
        }
      });

      socket.on('close', () => this.clients.delete(socket));
    });

    this.httpServer.listen(this.port, this.host, () => {
      console.log(`Go live at: http://${this.host}:${this.port}${this.sourcePath}`);
    });

    return this;
  }

  broadcast(message) {
    const payload = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(payload);
      }
    }
  }

  stop() {
    this.clients.clear();
    if (this.wsServer) this.wsServer.close();
    if (this.httpServer) this.httpServer.close();
  }
}

module.exports = { ChatProxy };
