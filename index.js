const { Client, GatewayIntentBits, Partials } = require('discord.js');
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
        GatewayIntentBits.GuildMembers,
    ],
    partials: [Partials.Channel],
});

const CHANNEL_ID = '1365057818218201161';
const ROLE_ID = '1300816249588154411';

client.once('ready', () => {
    console.log(`Zalogowano jako ${client.user.tag}`);
});

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;

    // Komenda !film
    if (message.content === '!film' && message.guild) {
        // Sprawdzanie roli
        const member = await message.guild.members.fetch(message.author.id);
        if (!member.roles.cache.has(ROLE_ID)) {
            return message.reply('Nie masz uprawnień do użycia tej komendy.');
        }

        try {
            await message.author.send('Cześć! Napisz, co chcesz dodać na kanał:');
        } catch (error) {
            console.error('Nie mogłem wysłać DM:', error);
            message.reply('Nie mogłem wysłać Ci wiadomości prywatnej. Włącz DM.');
        }
    }

    // Odbieranie wiadomości na DM
    if (!message.guild) {
        try {
            const channel = await client.channels.fetch(CHANNEL_ID);
            if (!channel) return message.author.send('Nie mogłem znaleźć kanału.');

            // Wysyłanie wiadomości na kanał
            const sentMessage = await channel.send(`${message.content}`);

            // Dodawanie reakcji
            await sentMessage.react('❤️');
            await sentMessage.react('👑');
            await sentMessage.react('💪');
            await sentMessage.react('🔥');

            await message.author.send('Twoja wiadomość została wysłana na kanał i dodano reakcje!');
        } catch (error) {
            console.error('Błąd przy wysyłaniu wiadomości:', error);
            message.author.send('Wystąpił problem przy wysyłaniu wiadomości.');
        }
    }
});

// Lista słów bazowych + odmiany
const bannedWords = [
  'kurwa', 'kurwo', 'kurwą', 'kurwami', 'kurwie',
  'idiota', 'idiotka', 'idiotą', 'idioci', 'idiotom', 'idiotami',
  'debil', 'debile', 'debilem', 'debilka',
  'pajac', 'głupek', 'głupiec', 'kretyn', 'kretyni',
  'szmata', 'suka', 'suką', 'suko', 'suki', 'jebać'
];

// Zamienniki podobnych znaków
const replacements = {
  '0': 'o',
  '1': 'i',
  '3': 'e',
  '4': 'a',
  '5': 's',
  '7': 't',
  '@': 'a',
  '$': 's',
  '!': 'i',
  '|': 'i'
};

// Funkcja czyszczenia i normalizacji wiadomości
function normalize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // usuń znaki specjalne
    .split('')
    .map(char => replacements[char] || char) // zamień podobne litery
    .join('');
}

// Funkcja "fuzzy search" - dopasowuje z małą tolerancją na literówki
function isFuzzyMatch(message, word) {
  const normalizedMsg = normalize(message);
  const normalizedWord = normalize(word);

  let matchCount = 0;
  let index = 0;

  for (let i = 0; i < normalizedMsg.length; i++) {
    if (normalizedMsg[i] === normalizedWord[index]) {
      matchCount++;
      index++;
    }
    if (index >= normalizedWord.length) break;
  }

  const similarity = matchCount / normalizedWord.length;
  return similarity >= 0.8; // 80% trafienia — pozwalamy na 1 literówkę w krótkim słowie
}

client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  try {
    for (const word of bannedWords) {
      if (isFuzzyMatch(message.content, word)) {
        await message.delete();
        await message.member.timeout(60_000, 'Używanie obraźliwych słów'); // 1 minuta mute

        console.log(`⛔ ${message.author.tag} dostał mute za użycie słowa podobnego do "${word}"`);
        break; // nie sprawdzaj dalej
      }
    }
  } catch (error) {
    console.error('❌ Błąd podczas usuwania wiadomości lub mutowania:', error);
  }
});

// Token z process.env
client.login(process.env.TOKEN);
