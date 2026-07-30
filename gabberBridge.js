const WebSocket = require('ws');

function sanitizeNick(displayName) {
  return String(displayName || 'bot')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_-]/g, '')
    .replace(/_+/g, '_')
    .replace(/^_+|_+$/g, '') || 'bot';
}

function formatIrcMessage({ username, displayName, content, userId = '0', roomId = '0' }) {
  const nick = sanitizeNick(displayName || username || 'bot');
  const displayNameValue = String(displayName || username || 'bot');
  const id = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  const tags = `@badge-info=;badges=;color=;display-name=${displayNameValue};emotes=;flags=;id=${id};mod=0;room-id=${roomId};subscriber=0;tmi-sent-ts=${Date.now()};turbo=0;user-id=${userId};user-type= `;

  return `${tags}:${nick}!${nick}@${nick}.tmi.twitch.tv PRIVMSG #discord :${content}\r\n`;
}

function startGabberBridge({ port = 6667, discordClient, token }) {
  if (!discordClient) {
    throw new Error('discordClient is required');
  }

  const wss = new WebSocket.Server({ port });
  const clients = new Set();

  wss.on('connection', (ws) => {
    clients.add(ws);

    ws.on('message', (data) => {
      const msg = data.toString();
      if (msg.startsWith('NICK')) {
        ws.send(':tmi.twitch.tv 001 bot :Welcome');
        ws.send(':tmi.twitch.tv 376 bot :End of /MOTD');
      }
      if (msg.startsWith('JOIN')) {
        ws.send(':bot!bot@bot.tmi.twitch.tv JOIN #channel');
      }
    });

    ws.on('close', () => clients.delete(ws));
  });

  discordClient.on('messageCreate', (message) => {
    if (message.author.bot) return;

    const ircMessage = formatIrcMessage({
      username: message.author.username,
      displayName: message.member?.displayName || message.author.displayName || message.author.username,
      content: message.content,
      userId: message.author.id,
      roomId: message.channelId,
    });

    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(ircMessage);
      }
    });
  });

  if (token) {
    discordClient.login(token);
  }

  console.log(`Gabber bridge listening on ws://localhost:${port}`);
  return { wss, clients };
}

module.exports = { startGabberBridge, formatIrcMessage, sanitizeNick };
