// ---------- Render sidebar + command cards from COMMANDS_DATA ----------
const categoryNav = document.getElementById('categoryNav');
const commandSections = document.getElementById('commandSections');

COMMANDS_DATA.forEach((cat, i) => {
  // Sidebar link
  const link = document.createElement('a');
  link.href = '#' + cat.id;
  link.textContent = cat.label;
  link.dataset.target = cat.id;
  categoryNav.appendChild(link);

  // Section
  const section = document.createElement('section');
  section.className = 'category-section';
  section.id = cat.id;

  const h2 = document.createElement('h2');
  h2.textContent = cat.title;
  section.appendChild(h2);

  cat.items.forEach(([name, used, does]) => {
    const card = document.createElement('div');
    card.className = 'command-card';
    card.innerHTML = `
      <p class="cmd-name">${name}</p>
      <p class="cmd-desc"><b>Used:</b> ${used} <b>Does:</b> ${does}</p>
      <span class="ask-hint">Click to ask the AI assistant for a detailed explanation →</span>
    `;
    card.addEventListener('click', () => askAboutCommand(name));
    section.appendChild(card);
  });

  commandSections.appendChild(section);
});

// Highlight active sidebar link while scrolling
const navLinks = Array.from(categoryNav.querySelectorAll('a'));
const sections = Array.from(document.querySelectorAll('.category-section'));
const mainEl = document.querySelector('.main');

mainEl.addEventListener('scroll', () => {
  let currentId = sections[0].id;
  for (const sec of sections) {
    if (sec.getBoundingClientRect().top - mainEl.getBoundingClientRect().top < 80) {
      currentId = sec.id;
    }
  }
  navLinks.forEach(a => a.classList.toggle('active', a.dataset.target === currentId));
});

// ---------- Chat logic ----------
const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const chatInput = document.getElementById('chatInput');
const chatSend = document.getElementById('chatSend');
const chatStatus = document.getElementById('chatStatus');
const newchatBtn = document.getElementById('newchatBtn');

function addMessage(text, role) {
  const div = document.createElement('div');
  div.className = 'msg ' + role;
  div.innerHTML = formatMarkdown(text);
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  return div;
}

// Minimal markdown-ish formatter: code fences, inline code, bold, newlines
function formatMarkdown(text) {
  const escape = s => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  let out = escape(text);
  out = out.replace(/```([\s\S]*?)```/g, (m, code) => `<pre>${code.trim()}</pre>`);
  out = out.replace(/`([^`]+)`/g, '<code>$1</code>');
  out = out.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  out = out.replace(/\n/g, '<br>');
  return out;
}

async function sendToAssistant(userText) {
  addMessage(userText, 'user');
  chatInput.value = '';
  chatSend.disabled = true;
  chatStatus.textContent = '';
  const thinkingEl = addMessage('Thinking…', 'thinking');

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userText })
    });

    const data = await res.json();
    thinkingEl.remove();

    if (!res.ok) {
      addMessage(data.error || 'Something went wrong talking to the model.', 'error');
      return;
    }
    addMessage(data.reply, 'assistant');
  } catch (err) {
    thinkingEl.remove();
    addMessage(
      "Couldn't reach the backend server. Make sure server.py is running (python server.py) " +
      "and Ollama is running (ollama serve).",
      'error'
    );
  } finally {
    chatSend.disabled = false;
    chatInput.focus();
  }
}

function askAboutCommand(name) {
  sendToAssistant(`Explain the Linux command "${name}" in detail — what it does, its most useful options/flags, and 2-3 practical examples.`);
}

function newChat() {
  chatMessages.innerHTML = '';
  chatStatus.textContent = '';
  addMessage('Hello! Click a command below, or type one in, to get a detailed explanation with syntax and examples.', 'assistant');
  chatInput.value = '';
  chatInput.focus();
}

if (newchatBtn) {
  newchatBtn.addEventListener('click', (e) => {
    e.preventDefault();
    newChat();
  });
}

chatForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = chatInput.value.trim();
  if (!text) return;
  sendToAssistant(text);
});
