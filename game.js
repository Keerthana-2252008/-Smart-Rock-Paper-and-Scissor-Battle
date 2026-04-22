// ── Animated Canvas Background ──
const canvas = document.getElementById('bg');
const ctx    = canvas.getContext('2d');
let W, H, particles = [];

function resize() {
  W = canvas.width  = window.innerWidth;
  H = canvas.height = window.innerHeight;
}
resize();
window.addEventListener('resize', resize);

const COLS = ['#FF6B6B','#4ECDC4','#FFE66D','#A8E6CF','#C9B1FF','#FF8B94'];
for (let i = 0; i < 22; i++) {
  particles.push({
    x: Math.random() * 1000,
    y: Math.random() * 1000,
    r: 30 + Math.random() * 90,
    dx: (Math.random() - 0.5) * 0.4,
    dy: (Math.random() - 0.5) * 0.4,
    color: COLS[i % COLS.length],
    alpha: 0.06 + Math.random() * 0.08
  });
}

function drawBg() {
  ctx.clearRect(0, 0, W, H);
  particles.forEach(p => {
    p.x += p.dx; p.y += p.dy;
    if (p.x < -p.r) p.x = W + p.r;
    if (p.x > W + p.r) p.x = -p.r;
    if (p.y < -p.r) p.y = H + p.r;
    if (p.y > H + p.r) p.y = -p.r;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.globalAlpha = p.alpha;
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  requestAnimationFrame(drawBg);
}
drawBg();

// ── Score Persistence (localStorage) ──
function loadScores() {
  return JSON.parse(localStorage.getItem('rps_scores') || '{}');
}
function saveScores(scores) {
  localStorage.setItem('rps_scores', JSON.stringify(scores));
}

// ── Screen Manager ──
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.add('hidden'));
  document.getElementById(id).classList.remove('hidden');
  if (id === 'screenBoard') renderBoard();
}

// ── Game State ──
const EMOJI   = { rock:'✊', paper:'✋', scissors:'✌️' };
const BEATS   = { rock:'scissors', scissors:'paper', paper:'rock' };
const OPTIONS = ['rock','paper','scissors'];

let currentPlayer = '';
let session = { wins:0, losses:0, draws:0 };

function startGame() {
  const name = document.getElementById('nameInput').value.trim();
  if (!name) {
    document.getElementById('nameInput').style.borderColor = 'var(--rock)';
    setTimeout(() => document.getElementById('nameInput').style.borderColor = '', 1000);
    return;
  }
  currentPlayer = name;
  session = { wins:0, losses:0, draws:0 };

  document.getElementById('currentPlayerTag').textContent = '👤 ' + name;
  document.getElementById('sessWins').textContent   = 0;
  document.getElementById('sessLosses').textContent = 0;
  document.getElementById('sessDraws').textContent  = 0;
  document.getElementById('youEmoji').textContent   = '❓';
  document.getElementById('cpuEmoji').textContent   = '🤖';
  document.getElementById('youName').textContent    = '—';
  document.getElementById('cpuName').textContent    = '—';

  const strip = document.getElementById('resultStrip');
  strip.textContent = 'Choose your weapon!';
  strip.className   = 'result-strip DRAW show';

  showScreen('screenGame');
}

function goHome() {
  document.getElementById('nameInput').value = '';
  showScreen('screenName');
}

// ── Core Play Function ──
function play(playerChoice) {
  const cpuChoice = OPTIONS[Math.floor(Math.random() * 3)];

  document.getElementById('cpuEmoji').textContent = '🤔';
  document.getElementById('cpuName').textContent  = '...';

  setTimeout(() => {
    document.getElementById('youEmoji').textContent = EMOJI[playerChoice];
    document.getElementById('youName').textContent  = cap(playerChoice);
    document.getElementById('cpuEmoji').textContent = EMOJI[cpuChoice];
    document.getElementById('cpuName').textContent  = cap(cpuChoice);

    const scores = loadScores();
    if (!scores[currentPlayer]) scores[currentPlayer] = { wins:0, losses:0, draws:0 };

    let msg, cls, sessKey, scoreKey;

    if (playerChoice === cpuChoice) {
      msg = "🤝 It's a Draw!"; cls = 'DRAW'; sessKey = 'draws'; scoreKey = 'draws';
    } else if (BEATS[playerChoice] === cpuChoice) {
      msg = '🎉 You Win!'; cls = 'WIN'; sessKey = 'wins'; scoreKey = 'wins';
      spawnConfetti();
    } else {
      msg = '💀 You Lose!'; cls = 'LOSE'; sessKey = 'losses'; scoreKey = 'losses';
    }

    session[sessKey]++;
    scores[currentPlayer][scoreKey]++;
    saveScores(scores);

    pop('sessWins',   session.wins);
    pop('sessLosses', session.losses);
    pop('sessDraws',  session.draws);

    const strip = document.getElementById('resultStrip');
    strip.className = 'result-strip';
    strip.textContent = msg;
    void strip.offsetWidth;
    strip.className = `result-strip show ${cls}`;
  }, 380);
}

function pop(id, val) {
  const el = document.getElementById(id);
  el.textContent = val;
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
}

// ── Scoreboard ──
function renderBoard() {
  const scores  = loadScores();
  const table   = document.getElementById('boardTable');
  const entries = Object.entries(scores);

  if (!entries.length) {
    table.innerHTML = '<div class="board-empty">No scores yet — play some rounds!</div>';
    return;
  }

  // Sort by wins desc
  entries.sort((a,b) => b[1].wins - a[1].wins);

  const rankIcon = ['🥇','🥈','🥉'];
  const rankCls  = ['gold','silver','bronze'];

  let html = `
    <div class="board-row header">
      <div></div>
      <div>Player</div>
      <div class="stat">Wins</div>
      <div class="stat">Losses</div>
      <div class="stat">Draws</div>
      <div class="stat">Games</div>
    </div>`;

  entries.forEach(([name, s], i) => {
    const total = s.wins + s.losses + s.draws;
    const rk    = i < 3 ? rankIcon[i] : i + 1;
    const rc    = i < 3 ? rankCls[i]  : '';
    html += `
      <div class="board-row">
        <div class="rank ${rc}">${rk}</div>
        <div class="pname">${name}</div>
        <div class="stat w">${s.wins}</div>
        <div class="stat l">${s.losses}</div>
        <div class="stat d">${s.draws}</div>
        <div class="stat g">${total}</div>
      </div>`;
  });

  table.innerHTML = html;
}

function resetAll() {
  if (confirm('Reset ALL player scores? This cannot be undone.')) {
    localStorage.removeItem('rps_scores');
    renderBoard();
  }
}

// ── Confetti ──
function spawnConfetti() {
  const wrap = document.getElementById('confetti');
  const cols = ['#FF6B6B','#4ECDC4','#FFE66D','#A8E6CF','#FF8B94','#C9B1FF','#fff'];
  for (let i = 0; i < 50; i++) {
    const c = document.createElement('div');
    c.className = 'cp';
    const size = 7 + Math.random() * 9;
    c.style.cssText = `
      left:${Math.random()*100}%;
      background:${cols[Math.floor(Math.random()*cols.length)]};
      width:${size}px; height:${size}px;
      border-radius:${Math.random()>0.5?'50%':'3px'};
      animation-delay:${Math.random()*0.5}s;
      animation-duration:${1.2+Math.random()*0.8}s;
    `;
    wrap.appendChild(c);
    setTimeout(() => c.remove(), 2800);
  }
}

function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// Enter key support
document.getElementById('nameInput').addEventListener('keydown', e => {
  if (e.key === 'Enter') startGame();
});