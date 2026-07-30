const { Client, GatewayIntentBits } = require('discord.js');
const WebSocket = require('ws');

// Fake Twitch IRC server
const wss = new WebSocket.Server({ port: 6667 });
const clients = new Set();

wss.on('connection', (ws) => {
  clients.add(ws);
  
  // Respond to Twitch IRC handshake
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

// Discord bot
const discord = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

discord.on('messageCreate', (message) => {
  if (message.author.bot) return;
  
  // Format as Twitch IRC PRIVMSG
  const ircMessage = `:${message.author.username}!${message.author.username}@${message.author.username}.tmi.twitch.tv PRIVMSG #discord :${message.content}\r\n`;
  
  // Send to all connected game clients
  clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(ircMessage);
    }
  });
});

discord.login('YOUR_DISCORD_BOT_TOKEN');
console.log('Fake Twitch IRC server running on ws://localhost:6667');