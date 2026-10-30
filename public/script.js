/* ==========================================================================
   Wedding AI Chatbot - Interactive Logic & Ambient Effects
   ========================================================================== */

const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const sendButton = document.getElementById("send-button");
const chatBox = document.getElementById("chat-box");
const clearBtn = document.getElementById("clear-btn");
const suggestionChips = document.querySelectorAll(".chip");

// Maintain multi-turn conversation history for /api/chat
let conversation = [];

// Format current time HH:MM
function getCurrentTime() {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// Lightweight Markdown Formatter for Wedding AI answers
function formatMarkdown(text) {
  if (!text) return "";

  // 1. Sanitize HTML
  let sanitized = text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

  // 2. Bold: **text** or __text__
  sanitized = sanitized.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  sanitized = sanitized.replace(/__(.*?)__/g, "<strong>$1</strong>");

  // 3. URLs to clickable links
  sanitized = sanitized.replace(
    /(https?:\/\/[^\s]+)/g,
    '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>'
  );

  // 4. Split by lines to handle lists and paragraphs
  const lines = sanitized.split("\n");
  let html = "";
  let inList = false;

  lines.forEach((line) => {
    const trimmed = line.trim();

    // Check for bullet list: * or -
    if (/^[\*\-]\s+(.*)/.test(trimmed)) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      const itemContent = trimmed.replace(/^[\*\-]\s+/, "");
      html += `<li>${itemContent}</li>`;
    }
    // Check for numbered list: 1.
    else if (/^\d+\.\s+(.*)/.test(trimmed)) {
      if (!inList) {
        html += "<ol>";
        inList = true;
      }
      const itemContent = trimmed.replace(/^\d+\.\s+/, "");
      html += `<li>${itemContent}</li>`;
    } else {
      if (inList) {
        html += inList === "ol" ? "</ol>" : "</ul>";
        inList = false;
      }
      if (trimmed.length > 0) {
        html += `<p>${trimmed}</p>`;
      }
    }
  });

  if (inList) {
    html += inList === "ol" ? "</ol>" : "</ul>";
  }

  return html;
}

// Append message element to UI with rich structure
function appendMessage(sender, rawText, isTyping = false) {
  const row = document.createElement("div");
  row.classList.add("message-row", `${sender}-row`);

  const avatar = document.createElement("div");
  avatar.classList.add("avatar", `${sender}-avatar`);
  avatar.innerHTML = sender === "user" ? "👤" : "💍";

  const bubble = document.createElement("div");
  bubble.classList.add("message-bubble", `${sender}-bubble`);

  if (sender === "bot") {
    const header = document.createElement("div");
    header.classList.add("bubble-header");
    header.textContent = "Wedding Assistant";
    bubble.appendChild(header);
  }

  const content = document.createElement("div");
  content.classList.add("bubble-content");

  if (isTyping) {
    content.innerHTML = `
      <div class="typing-indicator">
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
        <span class="typing-dot"></span>
      </div>
    `;
  } else {
    content.innerHTML = sender === "bot" ? formatMarkdown(rawText) : `<p>${rawText}</p>`;
  }
  bubble.appendChild(content);

  const time = document.createElement("span");
  time.classList.add("timestamp");
  time.textContent = getCurrentTime();
  bubble.appendChild(time);

  row.appendChild(avatar);
  row.appendChild(bubble);

  chatBox.appendChild(row);
  chatBox.scrollTop = chatBox.scrollHeight;

  return { row, bubble, content };
}

// Main Submit Handler
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // 1. Add user message
  appendMessage("user", userMessage);
  input.value = "";
  input.disabled = true;
  sendButton.disabled = true;

  // 2. Add to conversation history
  conversation.push({ role: "user", text: userMessage });

  // 3. Show animated typing indicator
  const botMessageObj = appendMessage("bot", "", true);

  try {
    const response = await fetch("/api/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversation }),
    });

    if (!response.ok) {
      throw new Error(`Server returned status: ${response.status}`);
    }

    const data = await response.json();

    if (data && data.result) {
      // Replace typing indicator with formatted AI response
      botMessageObj.content.innerHTML = formatMarkdown(data.result);
      conversation.push({ role: "model", text: data.result });
    } else {
      botMessageObj.content.innerHTML = `<p>Maaf, tidak ada respon yang diterima dari server.</p>`;
      conversation.pop(); // rollback
    }
  } catch (error) {
    console.error("Error communicating with server:", error);
    botMessageObj.content.innerHTML = `<p style="color: #b24d67; font-weight: 500;">Maaf, terjadi gangguan saat menghubungi asisten AI. Silakan coba lagi sebentar lagi ya 😊</p>`;
    conversation.pop(); // rollback
  } finally {
    input.disabled = false;
    sendButton.disabled = false;
    input.focus();
    chatBox.scrollTop = chatBox.scrollHeight;
  }
});

// Clickable suggestion chips
suggestionChips.forEach((chip) => {
  chip.addEventListener("click", () => {
    const query = chip.getAttribute("data-query");
    if (query) {
      input.value = query;
      form.dispatchEvent(new Event("submit"));
    }
  });
});

// Clear conversation button
if (clearBtn) {
  clearBtn.addEventListener("click", () => {
    if (confirm("Mulai percakapan baru dengan Wedding Assistant?")) {
      conversation = [];
      chatBox.innerHTML = `
        <div class="message-row bot-row initial-message">
          <div class="avatar bot-avatar">💍</div>
          <div class="message-bubble bot-bubble">
            <div class="bubble-header">Wedding Assistant</div>
            <div class="bubble-content">
              <p>Halo, selamat datang kembali! ✨ Ada hal lain seputar acara pernikahan yang ingin Anda tanyakan?</p>
            </div>
            <span class="timestamp">${getCurrentTime()}</span>
          </div>
        </div>
      `;
    }
  });
}

/* ==========================================================================
   Ambient Interactive Canvas: Romantic Rose Petals & Golden Sparkles
   ========================================================================== */
const canvas = document.getElementById("ambient-canvas");
const ctx = canvas.getContext("2d");

let width = (canvas.width = window.innerWidth);
let height = (canvas.height = window.innerHeight);

window.addEventListener("resize", () => {
  width = canvas.width = window.innerWidth;
  height = canvas.height = window.innerHeight;
});

class Particle {
  constructor() {
    this.reset();
  }

  reset() {
    this.x = Math.random() * width;
    this.y = -20 - Math.random() * 50;
    this.size = Math.random() * 9 + 5;
    this.speedY = Math.random() * 0.9 + 0.4;
    this.speedX = (Math.random() - 0.5) * 0.8;
    this.rotation = Math.random() * Math.PI * 2;
    this.rotationSpeed = (Math.random() - 0.5) * 0.02;
    this.opacity = Math.random() * 0.5 + 0.3;
    // Type: petal or golden sparkle
    this.isSparkle = Math.random() > 0.65;
    this.color = this.isSparkle
      ? `rgba(212, 175, 55, ${this.opacity})` // gold
      : `rgba(224, 137, 160, ${this.opacity})`; // rose petal
  }

  update() {
    this.y += this.speedY;
    this.x += Math.sin(this.y * 0.015) * 0.5 + this.speedX;
    this.rotation += this.rotationSpeed;

    if (this.y > height + 30) {
      this.reset();
    }
  }

  draw() {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    ctx.fillStyle = this.color;

    if (this.isSparkle) {
      // Golden 4-point sparkle star
      ctx.beginPath();
      const r = this.size * 0.35;
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Romantic organic petal shape
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        this.size / 2,
        -this.size / 2,
        this.size,
        this.size / 3,
        0,
        this.size
      );
      ctx.bezierCurveTo(
        -this.size,
        this.size / 3,
        -this.size / 2,
        -this.size / 2,
        0,
        0
      );
      ctx.fill();
    }

    ctx.restore();
  }
}

const particlesCount = 28;
const particles = Array.from({ length: particlesCount }, () => new Particle());

function animateAmbient() {
  ctx.clearRect(0, 0, width, height);
  for (let i = 0; i < particles.length; i++) {
    particles[i].update();
    particles[i].draw();
  }
  requestAnimationFrame(animateAmbient);
}

animateAmbient();
