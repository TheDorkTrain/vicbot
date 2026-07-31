const { SlashCommandBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gabberdash')
    .setDescription('Show the Twitch bridge status and forwarding rules'),
  async execute(interaction) {
    const helpText = [
      'GabberDash bridge status',
      '',
      'This bot forwards messages from the allowed Discord channel to the configured Twitch channel.',
      '',
      'Current behavior:',
      '- Messages are only forwarded from the allowed Discord channel(s).',
      '- The message content is sent to Twitch chat.',
      '- Twitch commands are not prefixed with a Discord name.',
    ].join('\n');

    await interaction.reply({ content: helpText, ephemeral: true });
  },
};
