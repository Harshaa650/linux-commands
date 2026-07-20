# Linux Command Reference — AI Assistant

A three-pane web app:
- **Left** — category sidebar
- **Middle** — Linux command reference cards (click any card to ask the AI about it)
- **Right** — a chatbot panel powered by a **local Ollama model**, which explains commands (or anything else you type) in detail

```
linux-ai-assistant/
├── README.md
├── requirements.txt
├── server.py                 # Flask backend: serves the frontend + proxies chat to Ollama
└── static/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        ├── commands.js       # all command reference data
        └── app.js            # renders the UI + chat logic
```

## 1. Install Ollama

Download and install Ollama from **https://ollama.com/download** for your OS.

Then pull a model (llama3 is a solid default — swap for something smaller like
`phi3` or `qwen2.5:3b` if your machine is limited on RAM/CPU):

```bash
ollama pull llama3
```

Start the Ollama server (it may already be running as a background service after install):

```bash
ollama serve
```

Leave this running — it listens on `http://localhost:11434` by default.

## 2. Install Python dependencies

From inside the `linux-ai-assistant` folder:

```bash
python -m venv venv
source venv/bin/activate      # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 3. Run the app

```bash
python server.py
```

Open your browser at **http://localhost:5000**

## Configuration

Both are optional environment variables (defaults shown):

```bash
export OLLAMA_URL="http://localhost:11434"
export OLLAMA_MODEL="llama3"
```

On Windows (PowerShell):

```powershell
$env:OLLAMA_URL="http://localhost:11434"
$env:OLLAMA_MODEL="llama3"
```

Set `OLLAMA_MODEL` to whatever you've pulled, e.g. `mistral`, `phi3`, `gemma2`, `qwen2.5:7b`, etc.

## How it works

- The browser never talks to Ollama directly — it calls `POST /api/chat` on the Flask
  server, which forwards the message to Ollama's `/api/chat` endpoint and relays the
  reply back. This avoids CORS headaches entirely.
- Clicking a command card sends a pre-written prompt like *"Explain the Linux command
  'grep' in detail…"* to the assistant.
- Typing your own question in the chat box works the same way — ask about any command,
  compare two commands, ask for a one-liner, etc.

## Troubleshooting

- **"Couldn't connect to Ollama"** — make sure `ollama serve` is running and
  `OLLAMA_URL` matches where it's listening.
- **Slow first response** — the first request loads the model into memory; it's faster
  after that.
- **Empty/odd replies** — try a different model (`OLLAMA_MODEL`) or re-pull it with
  `ollama pull <model>`.
