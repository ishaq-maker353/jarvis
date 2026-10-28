# J.A.R.V.I.S. — Live Voice Assistant

এই folder-এ reference project-এর cyber HUD voice UI থেকে তৈরি একটি clean Windows project আছে। API key, `.env`, Python `venv`, `node_modules`, এবং আগের user settings ZIP-এ রাখা হয়নি।

## কী আছে

- LiveKit WebRTC-তে microphone voice conversation, live transcription, chat, camera ও screen-share UI
- Ollama provider: local `qwen3.5:4b` (বা `ollama list`-এ থাকা অন্য chat model)
- Google Gemini Live ও OpenAI Realtime বিকল্প
- বাংলা-first system prompt; assistant-এর creator পরিচয় Ishaq Dev
- Settings page-এ provider/model/language/voice ও LiveKit configuration
- API key-গুলো local `Jarvis_code/.env`-এ থাকে; browser GET response-এ key value ফেরত দেওয়া হয় না

Ollama mode-এ **LLM model** আপনার local Ollama-তে চলে। Voice-to-text, speech output এবং WebRTC room hosting/token-এর জন্য LiveKit Cloud / LiveKit Inference লাগে; তাই voice session পুরোপুরি offline নয় এবং LiveKit usage বা quota প্রযোজ্য হতে পারে।

এই build-এ Windows-এর যেকোনো app/file চালানো, arbitrary command execution, কিংবা WhatsApp Web-এ স্বয়ংক্রিয় message পড়া/পাঠানোর tool যুক্ত নেই। Screen share মানে শুধু browser session-এর screen stream করা; assistant নিজে Windows desktop control করে না।

## আগে যা লাগবে

1. Windows-এ Python 3.11, 3.12 বা 3.13, Node.js 20 বা নতুন এবং `pnpm` ইনস্টল করুন।
2. Ollama ইনস্টল ও চালু রাখুন। PowerShell-এ model যাচাই করুন:

   ```powershell
   ollama list
   ollama pull qwen3.5:4b
   ```

   Model আগে থেকে থাকলে `pull` বাদ দিতে পারেন।
3. LiveKit Cloud project তৈরি করে তার WebSocket URL, API key এবং secret নিন। Secrets কাউকে পাঠাবেন না।

## Install ও চালু

1. ZIP extract করুন।
2. `install.bat` double-click করুন। এটি Python virtual environment তৈরি করে dependencies বসাবে; admin rights লাগে না।
3. `run-jarvis.bat` চালান। Browser-এ `http://localhost:3000/setup` খুলবে।
4. Ollama mode নির্বাচন করে model-এ `qwen3.5:4b`, Ollama URL-এ `http://localhost:11434/v1`, language-এ বাংলা দিন।
5. LiveKit URL/key/secret বসিয়ে Save করুন।
6. App page-এ **Talk to Jarvis** চাপুন এবং browser-এ microphone access দিন।

নতুন setup page না খুললে সরাসরি `http://localhost:3000/setup` খুলুন। Voice agent কোনো LiveKit connection ছাড়া শুরু হবে না। Model name-এর spelling অবশ্যই `ollama list`-এর সঙ্গে মিলতে হবে।

### Troubleshooting

- `Port 3000 is in use` দেখালে terminal-এ Next.js যে port/URL দেখায় সেটি খুলুন (যেমন `http://localhost:3001/setup`)। পুরনো JARVIS server বন্ধ করলে নতুনটি আবার `3000` ব্যবহার করতে পারবে।
- `Cannot find native binding` / `@tailwindcss/oxide` দেখালে URL-এ কোনো অতিরিক্ত চিহ্ন ছাড়া `http://localhost:3001/setup` খুলুন। চলমান `pnpm dev` বন্ধ করতে `Ctrl+C` চাপুন; `Terminate batch job (Y/N)?` এ `Y` দিন। তারপর `agent-starter-react` থেকে `pnpm install` এবং `pnpm dev` চালান।
- `Module not found` বা Radix UI dependency error থাকলে server বন্ধ করুন, `agent-starter-react` folder-এ PowerShell খুলে `pnpm install` চালান, তারপর `pnpm dev` দিয়ে restart করুন।
- Next.js 15.5.2-তে `next dev` (কোনো bundler flag ছাড়া) Webpack ব্যবহার করে; Turbopack-এর `10054` / PostCSS subprocess panic এড়াতে dev script-এ `--turbopack` বা `--webpack` যোগ করবেন না। `pnpm dev` অবশ্যই `agent-starter-react` folder থেকে চালান, অথবা `run-jarvis.bat` ব্যবহার করুন।

## API key ও config

- API keys: `Jarvis_code/.env` (gitignore করা; ZIP-এ নেই)।
- Assistant profile: `user_config.json` (সেটআপে তৈরি; gitignore করা)।
- Ollama secrets/API key লাগে না। Google/OpenAI ব্যবহার করলে Settings-এ সংশ্লিষ্ট provider key দিন।
- Settings-এ saved key-এর value দেখানো হয় না; ফাঁকা রাখলে saved key অক্ষত থাকে। Settings পরিবর্তনের পর backend/app পুনরায় চালু করুন।
- `LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET` LiveKit voice connection-এর জন্য সব provider-এই আবশ্যক।

## Folders

- `agent-starter-react/`: Next.js + React voice interface
- `Jarvis_code/`: Python LiveKit voice agent
- `LICENSE`: upstream LiveKit starter-এর MIT license notice

## Attribution

UI/source architecture LiveKit-এর MIT-licensed React Agent Starter থেকে অভিযোজিত। Original MIT notice `LICENSE` ফাইলে রাখা হয়েছে।



