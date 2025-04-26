const { Client, GatewayIntentBits } = require('discord.js');
const fetch = require('node-fetch');
const xml2js = require('xml2js');
const config = require('./config.json');
require('dotenv').config();

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${config.youtubeChannelId}`;
let lastVideoId = null;

async function checkYouTube() {
    try {
        const res = await fetch(RSS_URL);
        const text = await res.text();

        const parsed = await xml2js.parseStringPromise(text);
        const latestVideo = parsed.feed.entry?.[0];

        if (!latestVideo) return;

        const videoId = latestVideo['yt:videoId'][0];
        const videoLink = `https://www.youtube.com/watch?v=${videoId}`;

        if (videoId !== lastVideoId) {
            lastVideoId = videoId;

            const channel = await client.channels.fetch(config.channelId);
            if (channel?.isTextBased()) {
                channel.send(`Nowy odcinek @here ${videoLink}`);
            }
        }
    } catch (err) {
        console.error('Błąd przy sprawdzaniu YouTube:', err);
    }
}

client.once('ready', () => {
    console.log(`Zalogowano jako ${client.user.tag}`);
    checkYouTube();
    setInterval(checkYouTube, 60 * 1000); // co minutę
});

console.log("[DEBUG] TOKEN Z ENV:", process.env.TOKEN);
client.login(process.env.TOKEN);
