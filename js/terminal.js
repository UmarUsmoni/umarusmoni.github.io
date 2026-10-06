/**
 * terminal.js — Interactive Terminal Simulator
 *
 * Converts a static terminal card into a functional command-line simulator.
 * Supports typing, history, neofetch ASCII art, a matrix code override,
 * and embedding video reels.
 */

'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const terminal = document.querySelector('.terminal-block');
  if (!terminal) return;

  // Web Audio Context Click Synthesizer (GPU-friendly mechanical sound generator)
  let audioCtx = null;
  function playClickSound(freqScale = 1.0) {
    if (!window.terminalSoundActive) return;
    try {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();

      osc.connect(gain);
      gain.connect(audioCtx.destination);

      osc.type = Math.random() > 0.5 ? 'triangle' : 'sine';
      
      // Randomize pitch slightly to sound like natural keyboard keys
      const freq = (1300 + Math.random() * 500) / freqScale;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      gain.gain.setValueAtTime(freqScale > 1.0 ? 0.025 : 0.04, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.015);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.015);
    } catch (e) {
      console.warn("Audio Context error", e);
    }
  }

  // Expose playClickSound globally for hover events on the Dock
  window.playClickSound = playClickSound;
  window.terminalSoundActive = true;

  // Build the interactive DOM structure inside the terminal block
  terminal.innerHTML = `
    <button class="terminal-sound-btn" title="Toggle sound effects" aria-label="Toggle sound effects" style="position: absolute; top: 12px; right: 12px; background: rgba(5,5,5,0.6); border: 1px solid rgba(0,255,136,0.5); border-radius: 4px; color: var(--accent-primary); cursor: pointer; padding: 4px 8px; font-family: var(--font-mono); font-size: 10px; display: flex; align-items: center; gap: 4px; z-index: 20; transition: all 0.3s ease; user-select: none;">
      <span>🔊 Sound On</span>
    </button>
    <div class="terminal-output">
      <div class="terminal-line">umar@portfolio:~$ welcome</div>
      <div class="terminal-line text-muted">Type <span class="text-accent">help</span> for a list of available commands.</div>
      <br>
    </div>
    <div class="terminal-prompt-line">
      <span class="terminal-prompt">umar@portfolio:~$</span>
      <input type="text" class="terminal-input" autofocus autocomplete="off" spellcheck="false" aria-label="Terminal Input" />
    </div>
    <canvas class="matrix-canvas" style="display: none; position: absolute; top: 0; left: 0; width: 100%; height: 100%; border-radius: inherit; z-index: 10; pointer-events: none;"></canvas>
  `;

  const outputContainer = terminal.querySelector('.terminal-output');
  const terminalInput = terminal.querySelector('.terminal-input');
  const matrixCanvas = terminal.querySelector('.matrix-canvas');
  const soundBtn = terminal.querySelector('.terminal-sound-btn');

  soundBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    window.terminalSoundActive = !window.terminalSoundActive;
    soundBtn.querySelector('span').textContent = window.terminalSoundActive ? '🔊 Sound On' : '🔇 Sound Off';
    soundBtn.style.borderColor = window.terminalSoundActive ? 'rgba(0,255,136,0.5)' : 'rgba(255,255,255,0.15)';
    soundBtn.style.color = window.terminalSoundActive ? 'var(--accent-primary)' : 'var(--text-secondary)';
    if (window.terminalSoundActive) {
      playClickSound();
    }
    terminalInput.focus();
  });

  soundBtn.addEventListener('mouseenter', () => {
    soundBtn.style.background = 'rgba(0,255,136,0.08)';
    if (window.terminalSoundActive) {
      soundBtn.style.boxShadow = '0 0 8px rgba(0,255,136,0.3)';
    }
  });
  soundBtn.addEventListener('mouseleave', () => {
    soundBtn.style.background = 'rgba(5,5,5,0.6)';
    soundBtn.style.boxShadow = 'none';
  });

  const commandHistory = [];
  let historyIndex = -1;

  // Focus input when clicking anywhere inside the terminal block
  terminal.addEventListener('click', () => {
    terminalInput.focus();
  });

  // Scroll to bottom when focused (crucial on mobile when virtual keyboard pops up)
  terminalInput.addEventListener('focus', () => {
    setTimeout(() => {
      terminal.scrollTop = terminal.scrollHeight;
    }, 150);
  });

  // Handle keys for execute & history cycling
  terminalInput.addEventListener('keydown', (e) => {
    playClickSound();

    if (e.key === 'Enter') {
      const rawValue = terminalInput.value;
      const commandText = rawValue.trim();
      
      if (commandText !== '') {
        commandHistory.push(rawValue);
        historyIndex = commandHistory.length;
      }
      
      terminalInput.value = '';
      executeCommand(commandText, rawValue);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        if (historyIndex > 0) {
          historyIndex--;
        }
        terminalInput.value = commandHistory[historyIndex];
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        if (historyIndex < commandHistory.length - 1) {
          historyIndex++;
          terminalInput.value = commandHistory[historyIndex];
        } else {
          historyIndex = commandHistory.length;
          terminalInput.value = '';
        }
      }
    }
  });

  // Commands definition
  const COMMANDS = {
    help: () => `
Available commands:
  <span class="text-accent">about</span>     - Learn more about my background
  <span class="text-accent">skills</span>    - List my technical skillset
  <span class="text-accent">projects</span>  - Show my projects and Obsidian plugin
  <span class="text-accent">certs</span>     - List verified DeepLearning.AI certifications
  <span class="text-accent">hash</span>      - Compute SHA-256 hash in real time (e.g. hash hello)
  <span class="text-accent">stats</span>     - Display security telemetry & system stats
  <span class="text-accent">theme</span>     - Change accent color (mint, cyan, purple, orange)
  <span class="text-accent">whoami</span>    - Display current session info
  <span class="text-accent">ping</span>      - Test connection latency
  <span class="text-accent">social</span>    - Print active social profiles
  <span class="text-accent">neofetch</span>  - Display system specs & custom ASCII art
  <span class="text-accent">scan</span>      - Perform cybersecurity audit of the site
  <span class="text-accent">video</span>     - Embed and watch the Reels video (alias: <span class="text-accent">reels</span>)
  <span class="text-accent">matrix</span>    - Initiate system override (digital rain)
  <span class="text-accent">clear</span>     - Clear the terminal screen
    `,
    about: () => `
<span class="text-accent">Biography:</span>
I'm Umar Usmoni — a driven cybersecurity student with a passion for building secure and intelligent software.
My journey focuses on AI automation, penetration testing (Kali Linux), script development (Python, Bash), and media production.
    `,
    skills: () => `
<span class="text-accent">Active Skills:</span>
  - Cybersecurity & Pentesting (Kali Linux, networking, vulnerabilities)
  - AI & Automation (AI agents development, prompt engineering)
  - Languages (Python, Bash scripting, system commands)
  - Operating Systems (Linux administration, Kali, Debian, shell tools)
  - Creative (Video editing, formatting, automation pipelines)
    `,
    projects: () => `
<span class="text-accent">Main Projects:</span>
  - <span class="text-accent">Telegram-Obsidian Sync</span> (Obsidian Plugin / Python Daemon)
    GitHub: <a href="https://github.com/UmarUsmomi/telegram-obsidian-sync" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary); text-decoration: underline;">github.com/UmarUsmomi/telegram-obsidian-sync</a>
  - <span class="text-accent">SentinelHash</span> (Client-Side WebCrypto Cryptographic Hasher)
  - <span class="text-accent">CyberRecon</span> (Transport Layer & HTTP Header Security Inspector)
    `,
    certs: () => `
<span class="text-accent">Verified Certifications (DeepLearning.AI):</span>
  1. <span style="color: var(--accent-primary); font-weight: bold;">Generative AI for Software Development</span> (Professional Certificate)
     ID: 3e27d8c4-ae9e-417c-94ac-602d03a86792 (Issued: March 30, 2026)
  2. <span style="color: var(--accent-teal);">Team Software Engineering with AI</span>
     ID: 5b0e90e1-aa45-4a9d-9354-7106708a2adc (Issued: March 23, 2026)
  3. <span style="color: var(--accent-teal);">AI-Powered Software and System Design</span>
     ID: a8ecff7f-3a26-44f1-8648-7cd3beafe96b (Issued: March 30, 2026)
  4. <span style="color: var(--accent-teal);">Introduction to Generative AI for Software Development</span>
     ID: 1a440eab-b001-4b22-8557-dd37a0abdbfd (Issued: March 11, 2026)
  Recipient: <span class="text-accent">Umar Usmoni Usmonzoda</span>
    `,
    stats: () => `
<span class="text-accent">Security &amp; System Telemetry:</span>
  - Security Architecture: <span style="color: var(--accent-primary); font-weight: bold;">Zero Trust / 100% Client-Side</span>
  - Content Security:      <span style="color: var(--accent-primary);">Enforced CSP Whitelist</span>
  - Transport Layer:       <span style="color: var(--accent-primary);">TLS 1.3 / AES-256-GCM / PFS</span>
  - Cryptographic Engine:  <span style="color: var(--accent-primary);">Native SubtleCrypto SHA-256/384/512</span>
  - System Uptime:         <span style="color: var(--accent-teal);">99.99% Virtual Host</span>
  - Certificates:          <span style="color: var(--accent-primary);">4 Verified Credentials</span>
    `,
    whoami: () => `
guest@umarusmoni.github.io (Security Rank: Student / AI Automation Architect)
Status: Active, Vibe-Coding
    `,
    ping: () => `
PING umarusmoni.github.io (185.199.108.153) 56(84) bytes of data.
64 bytes from 185.199.108.153: icmp_seq=1 ttl=56 time=28.4 ms
64 bytes from 185.199.108.153: icmp_seq=2 ttl=56 time=27.1 ms
64 bytes from 185.199.108.153: icmp_seq=3 ttl=56 time=29.3 ms
--- umarusmoni.github.io ping statistics ---
3 packets transmitted, 3 received, 0% packet loss, time 2004ms
rtt min/avg/max/mdev = 27.1/28.2/29.3/0.91 ms
    `,
    social: () => `
<span class="text-accent">Active Channels:</span>
  - Telegram:  <a href="https://t.me/cloudety" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary); text-decoration: underline;">t.me/cloudety</a>
  - GitHub:    <a href="https://github.com/UmarUsmomi" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary); text-decoration: underline;">github.com/UmarUsmomi</a>
  - LinkedIn:  <a href="https://www.linkedin.com/in/umar-usmoni-b3730b402" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary); text-decoration: underline;">linkedin/in/umar-usmoni-b3730b402</a>
  - TikTok:    <a href="https://www.tiktok.com/@gravity751" target="_blank" rel="noopener noreferrer" style="color: var(--accent-primary); text-decoration: underline;">tiktok.com/@gravity751</a>
    `,
    neofetch: () => `
<pre class="neofetch-art" style="font-family: 'JetBrains Mono', monospace; line-height: 1.2; margin: 0; display: inline-block; vertical-align: top; color: var(--accent-primary);">
  /\\ \\_/\\
 / /\\ u u\\
 \\/_/   __\\     <span style="color: var(--text-primary);">umar@portfolio</span>
   |\\_/\\_/|     <span style="color: var(--text-secondary);">--------------</span>
   \\_____/      <span style="color: var(--text-primary);">OS:</span> Kali GNU/Linux (WSL)
                <span style="color: var(--text-primary);">Shell:</span> bash 5.2.15
                <span style="color: var(--text-primary);">Theme:</span> Neon-Mint Cyberpunk
                <span style="color: var(--text-primary);">CPU:</span> AI-Agent-Core (Optimized)
                <span style="color: var(--text-primary);">Memory:</span> 64 GB Virtual Pool
                <span style="color: var(--text-primary);">Vibe:</span> Vibe-Coding Active [OK]
</pre>
    `
  };

  // Command executor
  async function executeCommand(commandText, rawValue) {
    // Print input line in history
    const inputLine = document.createElement('div');
    inputLine.className = 'terminal-line';
    inputLine.innerHTML = `<span class="terminal-prompt">umar@portfolio:~$</span> ${escapeHTML(rawValue)}`;
    outputContainer.appendChild(inputLine);

    const trimmed = commandText.trim();
    if (trimmed === '') return;

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    if (cmd === 'clear') {
      outputContainer.innerHTML = '';
      return;
    }

    if (cmd === 'matrix') {
      runMatrixEffect();
      return;
    }

    if (cmd === 'video' || cmd === 'reels') {
      embedVideo();
      return;
    }

    if (cmd === 'scan') {
      runSecurityScan();
      return;
    }

    if (cmd === 'hash') {
      const outputLine = document.createElement('div');
      outputLine.className = 'terminal-line';
      if (!args) {
        outputLine.innerHTML = `Usage: <span class="text-accent">hash &lt;text&gt;</span> — Computes client-side SHA-256 hash.`;
      } else {
        try {
          const enc = new TextEncoder();
          const buf = await window.crypto.subtle.digest('SHA-256', enc.encode(args));
          const hex = Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
          outputLine.innerHTML = `SHA-256("${escapeHTML(args)}"):<br><span style="color: var(--accent-primary); word-break: break-all;">${hex}</span>`;
        } catch (e) {
          outputLine.innerHTML = `<span class="text-danger">Hash computation error: ${e.message}</span>`;
        }
      }
      outputContainer.appendChild(outputLine);
      outputContainer.appendChild(document.createElement('br'));
      terminal.scrollTop = terminal.scrollHeight;
      return;
    }

    if (cmd === 'theme') {
      const outputLine = document.createElement('div');
      outputLine.className = 'terminal-line';
      const validThemes = {
        mint: '#00ff88',
        cyan: '#00e5ff',
        purple: '#a855f7',
        orange: '#ff9100'
      };
      const choice = args.toLowerCase();
      if (validThemes[choice]) {
        document.documentElement.style.setProperty('--accent-primary', validThemes[choice]);
        outputLine.innerHTML = `Terminal &amp; site accent updated to <span style="color: ${validThemes[choice]}; font-weight: bold;">${choice.toUpperCase()}</span>.`;
      } else {
        outputLine.innerHTML = `Available themes: ${Object.keys(validThemes).map((t) => `<span class="text-accent">${t}</span>`).join(', ')}<br>Usage: <span class="text-accent">theme &lt;name&gt;</span>`;
      }
      outputContainer.appendChild(outputLine);
      outputContainer.appendChild(document.createElement('br'));
      terminal.scrollTop = terminal.scrollHeight;
      return;
    }

    const outputLine = document.createElement('div');
    outputLine.className = 'terminal-line';

    if (COMMANDS[cmd]) {
      outputLine.innerHTML = COMMANDS[cmd]();
    } else {
      outputLine.innerHTML = `<span class="text-danger">bash: ${escapeHTML(commandText)}: command not found.</span> Type <span class="text-accent">help</span> for help.`;
    }

    outputContainer.appendChild(outputLine);
    outputContainer.appendChild(document.createElement('br'));
    
    // Scroll terminal to bottom
    terminal.scrollTop = terminal.scrollHeight;
  }

  // Escape HTML helper
  function escapeHTML(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // Embed Reels Video player
  function embedVideo() {
    const videoLine = document.createElement('div');
    videoLine.className = 'terminal-line';
    videoLine.innerHTML = `
      <div style="color: var(--accent-primary); margin-bottom: 5px;">[Opening media: influentty - 7634092410351521057.mp4]</div>
      <div style="width: 100%; max-width: 320px; margin: 10px auto; border: 1px solid var(--accent-primary); border-radius: 12px; overflow: hidden; background: #000; box-shadow: 0 0 20px rgba(0,255,136,0.25);">
        <video src="assets/video/influentty.mp4" controls autoplay playsinline style="width: 100%; display: block; max-height: 540px;"></video>
      </div>
    `;
    outputContainer.appendChild(videoLine);
    outputContainer.appendChild(document.createElement('br'));
    terminal.scrollTop = terminal.scrollHeight;
  }

  // Matrix Digital Rain effect inside the card
  let matrixInterval = null;
  function runMatrixEffect() {
    // Hide output and prompt lines
    outputContainer.style.opacity = '0.05';
    terminal.querySelector('.terminal-prompt-line').style.opacity = '0.05';
    matrixCanvas.style.display = 'block';

    const ctx = matrixCanvas.getContext('2d');
    const rect = terminal.getBoundingClientRect();
    
    matrixCanvas.width = rect.width;
    matrixCanvas.height = rect.height;

    const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ<>_@#$+-*/';
    const charArr = chars.split('');
    
    const fontSize = 12;
    const columns = matrixCanvas.width / fontSize;
    const drops = [];
    for (let i = 0; i < columns; i++) {
      drops[i] = Math.random() * -100; // random staggered starting positions
    }

    function drawMatrix() {
      ctx.fillStyle = 'rgba(5, 5, 5, 0.08)'; // transparent black to create trail
      ctx.fillRect(0, 0, matrixCanvas.width, matrixCanvas.height);

      ctx.fillStyle = '#00ff88';
      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = charArr[Math.floor(Math.random() * charArr.length)];
        const x = i * fontSize;
        const y = drops[i] * fontSize;

        ctx.fillText(text, x, y);

        if (y > matrixCanvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    }

    matrixInterval = setInterval(drawMatrix, 33);

    // Stop after 4.5 seconds
    setTimeout(() => {
      clearInterval(matrixInterval);
      ctx.clearRect(0, 0, matrixCanvas.width, matrixCanvas.height);
      matrixCanvas.style.display = 'none';

      // Restore terminal output
      outputContainer.style.opacity = '1';
      terminal.querySelector('.terminal-prompt-line').style.opacity = '1';

      // Add override success message
      const successLine = document.createElement('div');
      successLine.className = 'terminal-line';
      successLine.innerHTML = `
        <span style="color: var(--accent-primary); font-weight: bold;">[!] SYSTEM DECRYPTED & OVERRIDDEN SUCCESSFULLY</span><br>
        <span class="text-muted">Virtual host unlocked. Connection stable.</span>
      `;
      outputContainer.appendChild(successLine);
      outputContainer.appendChild(document.createElement('br'));
      terminal.scrollTop = terminal.scrollHeight;
      terminalInput.focus();
    }, 4500);
  }

  function runSecurityScan() {
    terminalInput.disabled = true;
    terminalInput.style.opacity = '0.3';

    const scanSteps = [
      { text: '<span style="color: var(--accent-primary);">[+]</span> Initializing local cybersecurity diagnostics...', delay: 150 },
      { text: '<span style="color: var(--accent-primary);">[+]</span> Target host resolved: <span class="text-accent">umarusmoni.github.io</span>', delay: 450 },
      { text: '<span style="color: var(--accent-primary);">[+]</span> Launching vulnerability scanners...', delay: 350 },
      { text: '<span class="text-muted">[.]</span> Port scanning: [22/tcp, 80/tcp, 443/tcp open, filtered: 341]', delay: 600 },
      { text: '<span class="text-muted">[.]</span> Auditing transport encryption protocols...', delay: 450 },
      { text: '<span style="color: var(--accent-teal);">[+]</span> TLS v1.3 detected. Strong SSL ciphers verified: AES_256_GCM.', delay: 350 },
      { text: '<span class="text-muted">[.]</span> Inspecting Obsidian-Telegram Sync Daemon...', delay: 600 },
      { text: '<span style="color: var(--accent-primary);">[+]</span> Daemon state: <span style="color: var(--accent-primary); font-weight: bold;">ONLINE</span> | Integrity: <span style="color: var(--accent-primary);">SECURE (SHA-256 matched)</span>', delay: 450 },
      { text: '<span class="text-muted">[.]</span> Auditing local firewall configuration...', delay: 450 },
      { text: '<span style="color: var(--accent-primary);">[+]</span> UFW Status: ACTIVE | Anti-gravity shields: 100% stable', delay: 350 },
      { text: '<span style="color: var(--accent-primary); font-weight: bold;">[!] SCAN COMPLETE: 0 vulnerabilities found. System fully secure.</span>', delay: 600 },
    ];

    let stepIndex = 0;
    
    function printStep() {
      if (stepIndex < scanSteps.length) {
        const step = scanSteps[stepIndex];
        const line = document.createElement('div');
        line.className = 'terminal-line';
        line.innerHTML = step.text;
        outputContainer.appendChild(line);
        terminal.scrollTop = terminal.scrollHeight;
        stepIndex++;
        setTimeout(printStep, step.delay);
      } else {
        outputContainer.appendChild(document.createElement('br'));
        terminal.scrollTop = terminal.scrollHeight;
        terminalInput.disabled = false;
        terminalInput.style.opacity = '1';
        terminalInput.focus();
      }
    }

    setTimeout(printStep, 200);
  }
});
