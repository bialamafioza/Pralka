const { Client, GatewayIntentBits, ActivityType } = require('discord.js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // To pozwala czytać treść wiadomości
    ],
});

client.once('ready', () => {
    console.log(`Zalogowano jako ${client.user.tag}!`);

    client.user.setPresence({
        activities: [{ name: 'Pralka', type: ActivityType.Playing }],
        status: 'online',
    });
});

client.on('messageCreate', (message) => {
    // Ignoruj wiadomości od botów
    if (message.author.bot) return;

    if (message.content === '!ping') {
        message.reply('Pong!');
    }
});

client.login(process.env.TOKEN);
