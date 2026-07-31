const fs = require('node:fs');
const path = require('node:path');

function randomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFolders = fs.readdirSync(commandsPath);

  for (const folder of commandFolders) {
    const folderPath = path.join(commandsPath, folder);
    if (!fs.statSync(folderPath).isDirectory()) continue;

    const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith('.js'));
    for (const file of commandFiles) {
      const filePath = path.join(folderPath, file);
      const command = require(filePath);
      if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
      }
    }
  }
}

function getRandomGif(gifsFolder) {
  const gifFiles = fs.readdirSync(gifsFolder).filter((file) => {
    const ext = path.extname(file).toLowerCase();
    return ext === '.gif' || ext === '.png' || ext === '.jpg' || ext === '.jpeg';
  });

  if (gifFiles.length === 0) return null;
  return path.join(gifsFolder, gifFiles[randomNumber(0, gifFiles.length - 1)]);
}

module.exports = { randomNumber, loadCommands, getRandomGif };
