import discord
import feedparser
import asyncio

TOKEN = "TWÓJ_TOKEN_BOTA"
CHANNEL_ID = 123456789012345678  # ID kanału tekstowego na Discordzie

RSS_URL = "https://www.youtube.com/feeds/videos.xml?channel_id=UC7De6kAVoF4cTCb-wE6BWRA"

intents = discord.Intents.default()
client = discord.Client(intents=intents)

last_video_id = None

async def check_youtube():
    global last_video_id
    await client.wait_until_ready()
    channel = client.get_channel(CHANNEL_ID)

    while not client.is_closed():
        feed = feedparser.parse(RSS_URL)
        if not feed.entries:
            await asyncio.sleep(300)
            continue

        latest_video = feed.entries[0]
        video_id = latest_video.yt_videoid
        video_url = f"https://www.youtusbe.com/watch?v={video_id}"

        if video_id != last_video_id:
            last_video_id = video_id
            await channel.send(f"@here 📢 Nowy film od Pralkaaa!\n🎬 {video_url}")

        await asyncio.sleep(300)  # sprawdzaj co 5 minut

@client.event
async def on_ready():
    print(f"Zalogowano jako {client.user}")

client.loop.create_task(check_youtube())
client.run(TOKEN)
