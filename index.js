const { Client, GatewayIntentBits, ActivityType } = require('discord.js');
const axios = require('axios');
const xml2js = require('xml2js');

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

// 🛠️ Ustawienia:
const CHANNEL_ID = '1365057818218201161'; // <-- tu wstaw ID kanału na Discordzie
const YOUTUBE_CHANNEL_ID = 'UCmYcvnIQGR-_A4A20jYwgWA'; // Twój Channel ID z YouTube
const CHECK_INTERVAL = 30_000; // 30 sekund

let lastVideoId = null;

client.once('ready', () => {
    console.log(`✅ Zalogowano jako ${client.user.tag}!`);

    client.user.setPresence({
        activities: [{ name: 'Pralka', type: ActivityType.Playing }],
        status: 'online',
    });

    setInterval(checkYoutubeChannel, CHECK_INTERVAL);
});

async function checkYoutubeChannel() {
    try {
        const rssUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;
        const { data } = await axios.get(rssUrl);

        xml2js.parseString(data, (err, result) => {
            if (err) {
                console.error('❌ Błąd przy parsowaniu RSS:', err);
                return;
            }

            const entries = result.feed.entry;
            if (!entries || entries.length === 0) return;

            const latestVideo = entries[0];
            const videoId = latestVideo['yt:videoId'][0];
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

            if (videoId !== lastVideoId) {
                lastVideoId = videoId;
                sendNewVideoMessage(videoUrl);
                console.log(`🎥 Nowy film znaleziony: ${videoUrl}`);
            }
        });

    } catch (error) {
        console.error('❌ Błąd przy pobieraniu danych z YouTube:', error.message);
    }
}

async function sendNewVideoMessage(videoUrl) {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel.isTextBased()) return;

    await channel.send(`@here 🎬 Nowy odcinek już jest! Sprawdź teraz!\n${videoUrl}\nKanał: https://www.youtube.com/@biala_mafioza`);
}

client.login(process.env.TOKEN);
