function initTheme() {
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const existingToasts = container.querySelectorAll('.toast');
    for (let t of existingToasts) {
        const textSpan = t.querySelector('.toast-text');
        if (textSpan && textSpan.innerText === message && t.dataset.type === type) {
            let counter = t.querySelector('.toast-counter');
            if (!counter) {
                counter = document.createElement('span');
                counter.className = 'toast-counter';
                t.appendChild(counter);
                t.dataset.count = 1;
            }
            t.dataset.count = parseInt(t.dataset.count) + 1;
            counter.innerText = `x${t.dataset.count}`;
            t.classList.remove('pulse');
            void t.offsetWidth; 
            t.classList.add('pulse');
            clearTimeout(t.timeoutId);
            t.timeoutId = setTimeout(() => hideToast(t), 4000);
            return;
        }
    }

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.dataset.type = type;
    
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    if (type === 'error') icon = '❌';
    
    toast.innerHTML = `<span>${icon}</span> <span class="toast-text">${message}</span>`;
    container.appendChild(toast);

    toast.timeoutId = setTimeout(() => hideToast(toast), 4000);
}

function hideToast(toast) {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 500);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

function showConfirm(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const yesBtn = document.getElementById('confirm-yes-btn');
    const noBtn = document.getElementById('confirm-no-btn');

    if (!modal || !titleEl || !msgEl || !yesBtn || !noBtn) return;

    titleEl.innerText = title;
    msgEl.innerText = message;
    modal.classList.add('active');

    const cleanup = () => {
        modal.classList.remove('active');
        yesBtn.removeEventListener('click', handleYes);
        noBtn.removeEventListener('click', handleNo);
    };

    const handleYes = () => {
        cleanup();
        if (onConfirm) onConfirm();
    };

    const handleNo = () => {
        cleanup();
    };

    yesBtn.addEventListener('click', handleYes);
    noBtn.addEventListener('click', handleNo);
}

function _check() {
    try {
        const s = 'aHR0cHM6Ly9naXRodWIuY29tL251bGxkZXY3eA==';
        const a = document.querySelector('footer a');
        if (!a || btoa(a.href.replace(/\/$/, "")) !== s) {
            document.body.innerHTML = '<div style="background:#0f172a;color:#fff;height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;text-align:center;padding:2rem"><div><h1 style="font-size:3rem;margin-bottom:1rem">🔒</h1><h2>Erro de Integridade</h2><p>A aplicação foi modificada de forma não autorizada.<br>Por favor, restaure os créditos do desenvolvedor (nulldev7x).</p></div></div>';
            throw new Error();
        }
    } catch(e) { 
        if (typeof window !== 'undefined') window.stop(); 
        throw "Integrity Error";
    }
}

