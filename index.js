const { Client, GatewayIntentBits, ActivityType, EmbedBuilder } = require('discord.js');
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
const CHANNEL_ID = 'TWÓJ_DISCORD_CHANNEL_ID'; // <-- Podmień na ID kanału
const YOUTUBE_CHANNEL_ID = 'UCmYcvnIQGR-_A4A20jYwgWA'; // <-- ID kanału Biała Mafioza
const CHECK_INTERVAL = 30_000; // 30 sekund

let lastVideoId = null;
let consecutive404 = 0; // Licznik błędów 404 z rzędu

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

            const entries = result?.feed?.entry;
            if (!entries || entries.length === 0) {
                console.log('ℹ️ Brak filmów do sprawdzenia.');
                return;
            }

            const latestVideo = entries[0];
            const videoId = latestVideo['yt:videoId'][0];
            const videoTitle = latestVideo['title'][0];
            const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
            const thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;

            if (videoId !== lastVideoId) {
                lastVideoId = videoId;
                sendNewVideoEmbed(videoTitle, videoUrl, thumbnailUrl);
                updateBotStatus(videoTitle);
                console.log(`🎥 Nowy film znaleziony: ${videoUrl}`);
            } else {
                console.log('ℹ️ Brak nowych filmów.');
            }

            consecutive404 = 0; // Jeśli się udało - resetujemy licznik błędów
        });

    } catch (error) {
        if (error.response && error.response.status === 404) {
            consecutive404++;
            console.log(`⚠️ Kanał RSS jeszcze niedostępny (404). Próba nr ${consecutive404}`);

            if (consecutive404 >= 3) { // Po 3 próbach zmieniamy status
                waitingForYoutubeUpdate();
            }
        } else {
            console.error('❌ Błąd przy pobieraniu danych z YouTube:', error.message);
        }
    }
}

async function sendNewVideoEmbed(title, videoUrl, thumbnailUrl) {
    try {
        const channel = await client.channels.fetch(CHANNEL_ID);
        if (!channel || !channel.isTextBased()) {
            console.error('❌ Podany kanał nie jest tekstowy lub nie znaleziono kanału.');
            return;
        }

        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🎬 Nowy odcinek na kanale Biała Mafioza!')
            .setDescription(`📺 **${title}**\n\n🔗 [Kliknij tutaj, aby obejrzeć!]( ${videoUrl} )`)
            .setImage(thumbnailUrl)
            .setTimestamp()
            .setFooter({ text: 'Youtube Bot Pralka', iconURL: 'https://cdn-icons-png.flaticon.com/512/1384/1384060.png' });

        await channel.send({ content: '@here', embeds: [embed] });
    } catch (error) {
        console.error('❌ Błąd przy wysyłaniu embeda:', error.message);
    }
}

async function updateBotStatus(latestTitle) {
    try {
        await client.user.setPresence({
            activities: [{ name: `Nowy odcinek: ${latestTitle}`, type: ActivityType.Watching }],
            status: 'online',
        });
        console.log(`🛠️ Status zmieniony na "Nowy odcinek: ${latestTitle}"`);
    } catch (error) {
        console.error('❌ Błąd przy aktualizacji statusu:', error.message);
    }
}

async function waitingForYoutubeUpdate() {
    try {
        await client.user.setPresence({
            activities: [{ name: 'Czekam na aktualizację YouTube...', type: ActivityType.Watching }],
            status: 'idle',
        });
        console.log('⏳ Zmieniono status: Czekam na aktualizację YouTube...');
    } catch (error) {
        console.error('❌ Błąd przy aktualizacji statusu oczekiwania:', error.message);
    }
}

client.login(process.env.TOKEN);
