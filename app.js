// ============================================================
// F*CKS NEWS NOTICREO — App Logic
// ============================================================

// ─── Episode Data (en producción esto vendría de un backend) ──
const CURRENT_EPISODE = {
  number: "EP. 201",
  date: "Abril 2026",
  titular_mago: "Nueva Zelanda: Descubren que las ovejas tienen más derechos que los colombianos",
  titular_sanchez: "Expertos aseguran que la leche Kiwi cura la tusa y el desempleo instantáneamente",
  estado: "activo" // "activo" | "cerrado"
};

// ─── Vote State ────────────────────────────────────────────
const STORAGE_KEY = `fcksnews_battle_${CURRENT_EPISODE.number.replace(/\s/g,'')}`;
let votes = { mago: 247, sanchez: 198 }; // Base votes for realism
let userVote = null;
let isVotingOpen = CURRENT_EPISODE.estado === "activo";

function initVotes() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    const data = JSON.parse(saved);
    votes = data.votes;
    userVote = data.userVote;
  }
  
  // Update Episode UI
  document.getElementById('ep-number').textContent = CURRENT_EPISODE.number;
  document.getElementById('ep-date').textContent = CURRENT_EPISODE.date;
  document.getElementById('mago-titular').textContent = `"${CURRENT_EPISODE.titular_mago}"`;
  document.getElementById('sanchez-titular').textContent = `"${CURRENT_EPISODE.titular_sanchez}"`;

  renderVotes();
  if (userVote) lockVoting(userVote);
  if (isVotingOpen) startLiveSimulation();
}

function vote(character) {
  if (userVote || !isVotingOpen) return;

  votes[character]++;
  userVote = character;

  // Persist
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ votes, userVote }));

  // Update UI
  renderVotes();
  lockVoting(character);
  showCelebration(character);
  showToast(character === 'mago' ? '⚡ ¡Votaste por El Mago!' : '⚡ ¡Votaste por Sánchez!', 'success');
}

function renderVotes() {
  const total = votes.mago + votes.sanchez;
  const magoPct = total > 0 ? Math.round((votes.mago / total) * 100) : 50;
  const sanchezPct = total > 0 ? 100 - magoPct : 50;

  // Percentages
  document.getElementById('mago-pct').textContent = `${magoPct}%`;
  document.getElementById('sanchez-pct').textContent = `${sanchezPct}%`;

  // Vote counts
  document.getElementById('mago-count').textContent = `${votes.mago.toLocaleString()} votos`;
  document.getElementById('sanchez-count').textContent = `${votes.sanchez.toLocaleString()} votos`;

  // Progress bar
  document.getElementById('bar-mago').style.width = `${magoPct}%`;
  document.getElementById('bar-sanchez').style.width = `${sanchezPct}%`;

  // Total
  document.getElementById('total-votes').textContent = `${total.toLocaleString()} votos totales`;
}

function lockVoting(winner) {
  document.getElementById('btn-mago').disabled = true;
  document.getElementById('btn-sanchez').disabled = true;

  const winnerCard = document.getElementById(`card-${winner}`);
  winnerCard.classList.add('voted-winner');
  document.getElementById(`badge-${winner}`).style.display = 'block';
}

// ─── Live Simulation ────────────────────────────────────────
function startLiveSimulation() {
  setInterval(() => {
    if (!isVotingOpen) return;
    const rand = Math.random();
    const increment = Math.floor(Math.random() * 4) + 1;
    if (rand < 0.52) {
      votes.mago += increment;
    } else {
      votes.sanchez += increment;
    }
    renderVotes();
  }, 4000);
}

// ─── Celebration (Confetti) ─────────────────────────────────
function showCelebration(character) {
  const canvas = document.getElementById('confetti');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const color1 = character === 'mago' ? '#CC0000' : '#003399';
  const color2 = character === 'mago' ? '#ff4444' : '#0055ff';
  const colors = [color1, color2, '#FFD700', '#ffffff'];

  let particles = Array.from({ length: 120 }, () => ({
    x: Math.random() * canvas.width,
    y: -10,
    vx: (Math.random() - 0.5) * 6,
    vy: Math.random() * 3 + 2,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    rotationV: (Math.random() - 0.5) * 10,
    alpha: 1
  }));

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rotation * Math.PI / 180);
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.rotationV;
      p.vy += 0.08;
      if (p.y > canvas.height * 0.75) p.alpha -= 0.02;
    });

    particles = particles.filter(p => p.alpha > 0);
    if (particles.length > 0) requestAnimationFrame(draw);
    else ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  draw();
}

// ─── Toast ──────────────────────────────────────────────────
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `toast ${type} show`;
  setTimeout(() => { toast.className = `toast ${type}`; }, 3500);
}

// ─── News Form ──────────────────────────────────────────────
function initNoticiaForm() {
  const form = document.getElementById('noticia-form');
  const successEl = document.getElementById('form-success');
  const STORAGE_KEY_VOTE = 'fcksnews_daily_vote_date';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Check if already voted today
    const today = new Date().toDateString();
    const lastVoteDate = localStorage.getItem(STORAGE_KEY_VOTE);

    if (lastVoteDate === today) {
      showToast('🚫 Ya votaste por un fan el día de hoy. ¡Vuelve mañana!', 'error');
      return;
    }

    const btn = form.querySelector('.form-submit');
    btn.textContent = 'REGISTRANDO VOTO...';
    btn.disabled = true;

    // Simulated send
    await new Promise(r => setTimeout(r, 1200));

    // Save vote date
    localStorage.setItem(STORAGE_KEY_VOTE, today);

    form.style.display = 'none';
    successEl.classList.add('show');
    showToast('🗳️ ¡Tu voto ha sido registrado correctamente!', 'success');
  });
}

// ─── Splash Animation ───────────────────────────────────────
function initSplash() {
  const splash = document.getElementById('splash');
  const app = document.getElementById('app');
  const flash = document.getElementById('flash-overlay');

  // TRIGGER EXPLOSION MOMENT (Sincronizado con CSS keyframes)
  // El logo llega al zoom máximo a los ~2.5s
  setTimeout(() => {
    // Flash visual
    flash.classList.add('flash-active');
    // Vibración de pantalla
    document.body.classList.add('shake');
  }, 2500);

  // After animation completes, show main app
  setTimeout(() => {
    splash.style.transition = 'opacity 0.2s ease';
    splash.style.opacity = '0';
    setTimeout(() => {
      splash.style.display = 'none';
      document.body.classList.remove('shake');
      app.classList.add('visible');
      initVotes();
      initNoticiaForm();
    }, 200);
  }, 3200);
}

// ─── Navbar Scroll ──────────────────────────────────────────
function initNavbar() {
  const navbar = document.getElementById('navbar');
  window.addEventListener('scroll', () => {
    if (window.scrollY > 50) {
      navbar.style.background = 'rgba(5, 5, 15, 0.97)';
    } else {
      navbar.style.background = 'rgba(5, 5, 15, 0.85)';
    }
  });

  // Active link on scroll
  const sections = document.querySelectorAll('section[id]');
  const links = document.querySelectorAll('.nav-links a[data-target]');

  window.addEventListener('scroll', () => {
    let current = '';
    sections.forEach(section => {
      const top = section.offsetTop - 100;
      if (window.scrollY >= top) current = section.id;
    });
    links.forEach(link => {
      link.classList.toggle('active', link.dataset.target === current);
    });
  });
}

// ─── Intersection Observer (reveal on scroll) ───────────────
function initRevealAnimations() {
  const els = document.querySelectorAll('.contender-card, .module-card, .qr-section, .results-container');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(30px)';
    el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(el);
  });
}

// ─── Boot ────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  initSplash();
  initNavbar();
  setTimeout(initRevealAnimations, 3500);
});
