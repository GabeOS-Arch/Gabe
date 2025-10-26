# Gabe — Your Discord Pal

**Gabe** is a multipurpose Discord bot built for chaos *and* control — blending moderation tools, fun utilities, and community-driven features, all powered by open-source goodness.

> ⚙️ “Because sometimes, you just need a bot that can roast your friends *and* ban the trolls.”

---

## ✨ Features

### Miscellaneous
- `/avatar` Shows off your (or anyone’s) profile picture
- `/8ball`  Find your true purpose.
- `/yomama` SO STUPID that she laughs EVEN if the API fails.

### Moderation
- `/ban`, `/kick`, `/mute`, `/warn`  Standard tools for when your communist Discord server falls
- `/lockdown`, `/unlock` This does this inside of channels/
- `/slowmode`  Enforces chill vibes on chaotic channels

### Utility
- `/ping` Pong! Check the bot's ping + websocket ping

---

## Getting Started

### Prerequisites
- Node.js **v20+**
- Discord Bot Token ([get it here](https://discord.com/developers/applications))
- Gemini API key (OPTIONAL. yes)
- Some caffeine ☕

### Installation

```bash
git clone https://github.com/GabeOS-Arch/Gabe.git
cd Gabe
npm install
```

### Running the Bot

```bash
npm start
```

If you've added NEW commands, run 

``` bash 
npm run deploy
```



---

## 🔧 Configuration

Make sure you fill in the .env.example with the correct details. If you don't want Gemini, you don't need to fill it out. Just remove the value.

Optionally, add 

```env
DISCORD_GUILD_ID=
```

if you want to run it in a server.

That’s it. You’re ready to go.

---

## Contributing

Contributions are *always* welcome — just don't relentlessly add "hi" to the README. 

1. Fork the repo.
2. Create a new branch (`git checkout -b misc/example`)
3. Commit your changes (`git commit -m "Added something, don't know what it is"`)
4. PUUUUUUUUUUUUSH and then open a PR here

---

## 🪪 License

**Gabe** is open-source software licensed under the **GNU General Public License v3.0**.
This means:

* You can freely modify and redistribute it ✅
* You *must* keep it open-source and credit the original project 🫡

See the [license](https://github.com/GabeOS-Arch/Gabe/LICENSE) file for details.

---

## 💬 Credits & Contact

Created with ❤️ by [Gabe](https://github.com/thesomewhatyou)

> “If it breaks, that’s a feature. If it's entirely broken, well, you have access to it” – GabeOS Dev Team
