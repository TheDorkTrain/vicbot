const { Client, GatewayIntentBits, Collection } = require('discord.js');
const path = require('node:path');
const { startGabberBridge } = require('./gabberBridge');
const { loadCommands, randomNumber, getRandomGif } = require('./utils/botHelpers');

const { token, twitchUsername, twitchOAuth, twitchChannel, allowedDiscordChannels } = require('./config.json');
const vicMuse = require('./data/vicmuse.json');
const vicRoll = require('./data/vicroll.json');
const vicTalk1 = require('./data/victalk1.json');
const vicTalk2 = require('./data/victalk2.json');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();
loadCommands(client);

const readyEvent = require('./events/ready');
const interactionEvent = require('./events/interactionCreate');

client.on(readyEvent.name, (...args) => readyEvent.execute(...args));
client.on(interactionEvent.name, (...args) => interactionEvent.execute(...args));

startGabberBridge({
  discordClient: client,
  twitchUsername,
  twitchOAuth,
  channel: twitchChannel,
  allowedChannels: allowedDiscordChannels,
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;

  const channel = client.channels.cache.get(message.channelId);
  if (!channel) return;

  const chance = randomNumber(1, 8);
  const emojiChance = randomNumber(1, 8);
  const words = message.content.split(/\s+/).filter(Boolean);
  let quotedWords = '';

  if (words.length > 0) {
    const numWords = Math.min(randomNumber(2, 4), words.length);
    const selectedWords = [];
    const availableWords = [...words];

    for (let i = 0; i < numWords; i++) {
      const randomIndex = randomNumber(0, availableWords.length - 1);
      selectedWords.push(availableWords[randomIndex]);
      availableWords.splice(randomIndex, 1);
    }

    quotedWords = `"${selectedWords.join(' ')}"`;
  }

  if (!message.author.bot && emojiChance >= 4) {
    const emojis = ['🫀', '🔥', '🤖', '🦑', '💩', '🍆', '😎', '🤎', '1212817898469466142', '988172041943392256', '984203212104028201', '984201425095630899', '984201497485135913', '984203787214401626', '1212815778592596058'];
    message.react(emojis[randomNumber(0, emojis.length - 1)]);
  }

  if (!message.author.bot && message.content === 'ROLL FOR ME VIC') {
    const roll = randomNumber(1, 20);
    const rollPhrase = randomNumber(0, vicRoll.roll.length - 1);
    channel.send(`${vicRoll.roll[rollPhrase]} You Rolled a: ${roll}`);
    return;
  }

  let responseChance = chance + (message.content.toLowerCase().includes('vic') ? 3 : 0);

  if (!message.author.bot && responseChance === 8) {
    const sort = randomNumber(1, 10);
    const museRandom = randomNumber(0, vicMuse.muse.length - 1);
    const part1Random = randomNumber(0, vicTalk1.part1.length - 1);
    const part2Random = randomNumber(0, vicTalk2.part2.length - 1);

    if (sort >= 4) {
      channel.send(vicMuse.muse[museRandom]);
    } else if (sort <= 7 && sort >= 5) {
      channel.send(`${vicTalk1.part1[part1Random]} ${vicTalk2.part2[part2Random]}`);
    } else if (sort <= 9 && sort >= 8) {
      const randomGif = getRandomGif(path.join(__dirname, 'gifs'));
      if (randomGif) channel.send({ files: [randomGif] });
    } else if (sort >= 10) {
      channel.send(`${quotedWords} ${vicTalk2.part2[part2Random]}`);
    }
  }
});

console.log('We all have a story to tell');
client.login(token);
