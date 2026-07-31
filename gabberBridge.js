const { Client } = require('tmi.js');

function normalizeChannel(channel) {
  const name = String(channel || '#thedorktrain').trim();
  return name.startsWith('#') ? name : `#${name}`;
}

function formatTwitchChatMessage({ content, channel = '#thedorktrain' }) {
  return `PRIVMSG ${normalizeChannel(channel)} :${content}`;
}

function shouldForwardMessage(message, allowedChannels = []) {
  if (!message || message.author?.bot) return false;
  if (allowedChannels.length === 0) return true;
  return allowedChannels.includes(message.channelId) || allowedChannels.includes(message.channel?.name);
}

function startGabberBridge({ discordClient, twitchUsername, twitchOAuth, channel = '#thedorktrain', allowedChannels = [] }) {
  if (!discordClient) {
    throw new Error('discordClient is required');
  }

  const targetChannel = normalizeChannel(channel);
  const twitchClient = new Client({
    options: { debug: false },
    connection: { secure: true, reconnect: true },
    identity: {
      username: twitchUsername,
      password: twitchOAuth,
    },
    channels: [targetChannel],
  });

  twitchClient.connect().catch((error) => {
    console.error('Failed to connect to Twitch chat:', error);
  });

  discordClient.on('messageCreate', (message) => {
    if (!shouldForwardMessage(message, allowedChannels)) return;

    const payload = formatTwitchChatMessage({
      content: message.content,
      channel: targetChannel,
    });

    twitchClient.say(targetChannel, message.content);
    console.log(`[twitch-bridge] ${payload}`);
  });

  console.log(`Twitch bridge ready for ${targetChannel}`);
  return { twitchClient, targetChannel };
}

module.exports = { startGabberBridge, formatTwitchChatMessage, normalizeChannel, shouldForwardMessage };
