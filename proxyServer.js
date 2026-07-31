const http = require('http');
const WebSocket = require('ws');
const { EventEmitter } = require('events');

class ChatProxy extends EventEmitter {
  constructor({ port = 3000, host = '127.0.0.1', sourcePath = '/live/discord', provider = 'youtube' } = {}) {
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
        res.end(JSON.stringify({ ok: true, service: 'vicbot-chat-proxy', source: `https://${this.provider}.example/${this.sourcePath.replace(/^\//, '')}` }));
        return;
      }

      if (req.url === this.sourcePath || req.url === `${this.sourcePath}/`) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          ok: true,
          source: `https://${this.provider}.example/${this.sourcePath.replace(/^\//, '')}`,
          provider: this.provider,
          message: 'fake livestream source endpoint',
        }));
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
      console.log(`Chat proxy listening on http://${this.host}:${this.port}`);
      console.log(`Provider-style source endpoint: https://${this.provider}.example/${this.sourcePath.replace(/^\//, '')}`);
      console.log(`Host endpoint: http://${this.host}:${this.port}${this.sourcePath}`);
      console.log(`WebSocket endpoint: ws://${this.host}:${this.port}`);
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
