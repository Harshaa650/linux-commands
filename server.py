import os
from dotenv import load_dotenv
from flask import Flask, request, jsonify, send_from_directory
from openai import OpenAI

# Load variables from .env
load_dotenv()

app = Flask(__name__, static_folder="static", static_url_path="")

# NVIDIA API Configuration
NVIDIA_API_KEY = os.getenv("NVIDIA_API_KEY")

if not NVIDIA_API_KEY:
    raise RuntimeError(
        "NVIDIA_API_KEY not found. Please add it to your .env file."
    )

client = OpenAI(
    base_url="https://integrate.api.nvidia.com/v1",
    api_key=NVIDIA_API_KEY,
)

MODEL = "meta/llama-3.1-8b-instruct"

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
        response = client.chat.completions.create(
            model=MODEL,
            messages=[
                {
                    "role": "system",
                    "content": SYSTEM_PROMPT,
                },
                {
                    "role": "user",
                    "content": user_message,
                },
            ],
            temperature=0.2,
            max_tokens=1024,
        )

        reply = response.choices[0].message.content

        return jsonify({"reply": reply})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == "__main__":
    print("Starting Linux AI Assistant...")
    print(f"Model: {MODEL}")
    print("Server: http://localhost:5000")

    app.run(debug=True, port=5000)