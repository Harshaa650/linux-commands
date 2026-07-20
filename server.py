import os
import requests
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory

# Load variables from .env
load_dotenv()

app = Flask(__name__, static_folder="static", static_url_path="")

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://localhost:11434").rstrip("/")
OLLAMA_MODEL = os.getenv("OLLAMA_MODEL", "llama3")

MODEL = OLLAMA_MODEL

SYSTEM_PROMPT = """
You are Linux AI Assistant.

Your job is to teach Linux commands in a structured way.

For every command provide:

1. One-line summary
2. Syntax
3. Important options
4. Practical examples
5. Common mistakes
6. Tips
7. Related commands

Always respond in Markdown.
Use code blocks for commands.
Never hallucinate command options.
"""


@app.route("/")
def index():
    return send_from_directory(app.static_folder, "index.html")


@app.route("/api/chat", methods=["POST"])
def chat():

    data = request.get_json(silent=True) or {}

    user_message = (data.get("message") or "").strip()

    if not user_message:
        return jsonify({"error": "Message cannot be empty"}), 400

    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/chat",
            json={
                "model": MODEL,
                "messages": [
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": user_message},
                ],
                "temperature": 0.2,
                "max_tokens": 1024,
            },
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()

        if "choices" in data and data["choices"]:
            reply = data["choices"][0].get("message", {}).get("content")
        else:
            reply = data.get("output") or data.get("result")

        if not reply:
            raise ValueError("No assistant reply was returned by Ollama.")

        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("Starting Linux AI Assistant...")
    print(f"Model: {MODEL}")
    print("Server: http://localhost:5000")

    app.run(debug=True, port=5000)