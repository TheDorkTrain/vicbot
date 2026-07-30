const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gabberdash')
    .setDescription('Show instructions for the GabberDash bridge'),
  async execute(interaction) {
    const helpText = [
      'GabberDash bridge help',
      '',
      'Use this tool to relay Discord chat into a Twitch-style packet format for your desktop app.',
      '',
      'How it works:',
      '- Messages sent in Discord are forwarded as Twitch-ish IRC PRIVMSG packets.',
      '- The bridge uses your Discord display name as the chat nick.',
      '- Your desktop app can listen on ws://localhost:6667 for those messages.',
      '',
      'Example:',
      '- Type a message in Discord and it will be emitted to the bridge.',
      '- If your app is listening, it should receive a packet similar to a Twitch chat event.',
    ].join('\n');

    await interaction.reply({ content: helpText, ephemeral: true });
  },
};
