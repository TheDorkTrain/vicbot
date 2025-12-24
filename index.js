const { Client , Events, GatewayIntentBits, Collection, } = require('discord.js');
const fs = require('node:fs');
const path = require('node:path');

const {token } = require('./config.json');

const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages,GatewayIntentBits.MessageContent,GatewayIntentBits.DirectMessages]});


const vicMuse = require('./data/vicmuse.json');
const vicRoll = require('./data/vicroll.json');
const vicTalk1 = require('./data/victalk1.json');
const vicTalk2 = require('./data/victalk2.json');

client.login(token);

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomGif() {
  const gifsFolder = path.join(__dirname, 'gifs');

  const gifFiles = fs.readdirSync(gifsFolder).filter(file => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.gif' || ext === '.png' || ext === '.jpg' || ext === '.jpeg';
  });

  if (gifFiles.length === 0) { return null; }

  const randomGif = gifFiles[randomNumber(0, gifFiles.length - 1)];
  return path.join(gifsFolder, randomGif);
}

	console.log(`We all have a story to tell`);


client.on("messageCreate", async (message) => {
	let chance = randomNumber(1,8)
	let emojiChance = randomNumber(1,8)
	console.log(chance)
	const channel = client.channels.cache.find(channel => channel.id === message.channelId)

	const words = message.content.split(' ').filter(word => word.length > 0);
	let quotedWords = '';

	if (words.length > 0) {
			// Pick 2-4 random words (adjust as needed)
			const numWords = Math.min(randomNumber(2, 4), words.length);
			const selectedWords = [];
			
			// Create a copy of words array to avoid picking duplicates
			const availableWords = [...words];
			
			for (let i = 0; i < numWords; i++) {
				const randomIndex = randomNumber(0, availableWords.length - 1);
				selectedWords.push(availableWords[randomIndex]);
				availableWords.splice(randomIndex, 1); // Remove so we don't pick it again
			}
			
			quotedWords = `"${selectedWords.join(' ')}"`;
		}

	if (!message?.author.bot && emojiChance >= 4) {
		emojis = ["🫀","🔥","🤖","🦑", "💩","🍆","😎","🤎","1212817898469466142","988172041943392256","984203212104028201","984201425095630899","984201497485135913","984203787214401626","1212815778592596058"]
		let randomEmoji = randomNumber(0, emojis.length)
		console.log(emojis[randomEmoji])
		message.react(emojis[randomEmoji])
	}

	if (!message?.author.bot && message.content == "ROLL FOR ME VIC") {
		let roll = randomNumber(1,20)
		let rollPhrase = randomNumber(0, vicRoll.roll.length)

		channel.send(`${vicRoll.roll[rollPhrase]} You Rolled a: ${roll}`)
	}

	if (message.content.toLowerCase().includes("vic")) {chance = chance+3}

	if (!message?.author.bot && chance == 8) {
		
		let sort = randomNumber(1,10)
		console.log(`Sort: ${sort}`)
		let muserandom = randomNumber(0, vicMuse.muse.length)
		let part1random = randomNumber(0, vicTalk1.part1.length)
		let part2random = randomNumber(0, vicTalk2.part2.length)
		

		if ( sort >= 4){
			channel.send(vicMuse.muse[muserandom])
		}
		else if (sort <= 7 && sort >= 5){
			channel.send(`${vicTalk1.part1[part1random]} ${vicTalk2.part2[part2random]}`)
		}
		else if (sort <= 9 && sort >= 8){
			let randomGif = getRandomGif();
			channel.send({files: [randomGif]})
		}
		else if (sort >= 10){
			channel.send(`${quotedWords} ${vicTalk2.part2[part2random]}`)
		}
	}
})