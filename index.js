require('dotenv').config();
const { 
  Client, 
  GatewayIntentBits,
} = require('discord.js');
const Parser = require('rss-parser');
const parser = new Parser();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.MessageContent,
  ],
});

const CHANNEL_ID = '1365057818218201161';
const YOUTUBE_CHANNEL_ID = 'UCfL1XtF6Ok4Cj-nX3gKQ1zQ';
const FEED_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${YOUTUBE_CHANNEL_ID}`;

let lastVideoId = '';

client.once('ready', () => {
  console.log(`✅ Zalogowano jako ${client.user.tag}`);
  checkForNewVideos();
  setInterval(checkForNewVideos, 5 * 60 * 1000); // Co 5 minut
});

async function checkForNewVideos() {
  try {
    const feed = await parser.parseURL(FEED_URL);
    const latestVideo = feed.items[0];

    if (latestVideo.id !== lastVideoId) {
      lastVideoId = latestVideo.id;
      const channel = await client.channels.fetch(CHANNEL_ID);
      if (channel) {
        channel.send(`🎬 Nowy odcinek od Pralkaaa! @here\n${latestVideo.title}\n${latestVideo.link}`);
      }
    }
  } catch (error) {
    console.error('❌ Błąd podczas sprawdzania filmu:', error);
  }
}

console.log("[DEBUG] TOKEN Z ENV:", process.env.TOKEN);
client.login(process.env.TOKEN);
