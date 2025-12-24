const { Client , Events, GatewayIntentBits, Collection, } = require('discord.js');

module.exports = {
    name: Events.MessageCreate,
    once: false,
    execute(client) {
    
    console.log(Message.content)
	if (!Message?.author.bot) {
		Message.author.send('yo yo dwag')
	}

    },
};