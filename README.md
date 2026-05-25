# 🎮 Chatogus Extreme

**Link:** [https://rudione.github.io/chatogoose](https://rudione.github.io/chatgoose)

An interactive game for Twitch streamers — guess who wrote what in chat.

---

## 📁 Project Structure
`chatogus/`
* ├── `index.html` — main page
* ├── `style.css` — all styles
* ├── `i18n.js` — localization (RU / EN / UA)
* └── `js/`
    * ├── `tmi.js` — Twitch IRC client
    * ├── `confetti.js` — confetti effect
    * ├── `sound.js` — audio engine (Web Audio API)
    * ├── `storage.js` — localStorage utilities
    * ├── `emotes.js` — 7TV / global emotes loader
    * ├── `events.js` — event overlay (raids, subs, bits)
    * ├── `words.js` — word bank and fake generator
    * ├── `media.js` — YouTube / Spotify / Twitch clip helpers
    * ├── `settings.js` — settings loading and persistence
    * ├── `ui.js` — UI components and helpers
    * ├── `modes.js` — all 12 game modes
    * └── `app.js` — main game controller

---

## 🎯 Game Modes

| Mode | Description |
| :--- | :--- |
| 🎯 **Classic** | Guess who sent the message |
| 🤔 **Real or Fake** | One word may be replaced (2.5% chance nothing was changed) |
| 🔤 **Missing Word** | Guess the hidden word from the message |
| 💬 **What Did They Say?** | Pick the real message from that user |
| 🛡️ **Mod or Viewer** | Figure out the sender's role |
| 🖼️ **Who Sent It?** | Guess who posted the link/media |
| 📦 **Emote or Word?** | Guess whether the ending was a 7TV emote, regular emote, or text |
| 🧘 **Same Author** | Find another message written by the same person |
| 🔠 **First Word** | Guess how the message started |
| 👥 **Two Out of Four** | Find two messages from the same author |
| 🦄 **7TV Emote** | Guess which 7TV emote appeared in the message |
| 🔗 **Emoji Chain** | Words are hidden with 🟦, only one emoji stays visible — guess the author |

---

## 🚀 Run Locally

Open `index.html` in your browser (a local server is required because of CORS):

```bash
npx serve .
# or
python3 -m http.server 8080
