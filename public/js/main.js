document.addEventListener('DOMContentLoaded', () => {
    if (typeof _check === 'function') _check();
    if (typeof initTheme === 'function') initTheme();

    checkAuth();
    loadTasks();
    loadStats();

    const bindClick = (id, fn) => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('click', fn);
    };

    bindClick('add-task-btn', addTask);
    bindClick('logout-btn', logout);
    bindClick('close-modal-btn', closeModal);
    bindClick('save-edit-btn', saveEdit);
    bindClick('theme-toggle', typeof toggleTheme === 'function' ? toggleTheme : () => {});

    const searchInput = document.getElementById('task-search');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => filterTasksLocally(e.target.value));
    }

    const toggleBtn = document.getElementById('toggle-form-btn');
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            const container = document.getElementById('new-task-container');
            if (container) {
                container.classList.toggle('active');
                toggleBtn.innerHTML = container.classList.contains('active') ? 
                    '<span>×</span> Fechar' : '<span>+</span> Nova Tarefa';
            }
        });
    }

    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            loadTasks(e.currentTarget.dataset.filter);
        });
    });
});

async function checkAuth() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    if (!data.loggedIn) {
        window.location.href = 'login.html';
    } else {
        const display = document.getElementById('username-display');
        if (display) display.innerText = data.username;
    }
}

async function logout() {
    const res = await fetch('/api/auth/logout', { method: 'POST' });
    if (res.ok) {
        showToast('Até logo!', 'success');
        setTimeout(() => { window.location.href = 'login.html'; }, 800);
    }
}

async function loadTasks(filter = 'all') {
    const res = await fetch(`/api/tasks?filter=${filter}`);
    const tasks = await res.json();
    const list = document.getElementById('task-list');
    if (!list) return;
    list.innerHTML = '';

    if (tasks.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">📂</div>
                <h3>Nenhuma tarefa por aqui</h3>
                <p>Crie sua primeira tarefa para começar a organizar sua rotina.</p>
            </div>
        `;
        return;
    }

    tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = `task-item card ${task.completed ? 'completed' : ''}`;
        item.innerHTML = `
            <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask(${task.id}, this.checked)">
            <div class="task-text">
                <h4>${task.title}</h4>
                <p>${task.description || ''}</p>
            </div>
            <div class="task-actions">
                <button class="btn-icon" onclick="openEditModal(${task.id}, '${task.title}', '${task.description || ''}')">✏️</button>
                <button class="btn-icon" onclick="deleteTask(${task.id})">🗑️</button>
            </div>
        `;
        list.appendChild(item);
    });
}

async function loadStats() {
    const res = await fetch('/api/stats');
    const data = await res.json();
    const total = document.getElementById('stat-total');
    const pending = document.getElementById('stat-pending');
    const completed = document.getElementById('stat-completed');
    if (total) total.innerText = data.total;
    if (pending) pending.innerText = data.pending;
    if (completed) completed.innerText = data.completed;
}

async function addTask() {
    const titleEl = document.getElementById('task-title');
    const descEl = document.getElementById('task-desc');
    if (!titleEl || !descEl) return;
    
    const title = titleEl.value;
    const description = descEl.value;

    if (!title) {
        return showToast('O título é obrigatório', 'error');
    }

    const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
    });

    if (res.ok) {
        showToast('Tarefa criada com sucesso!', 'success');
        titleEl.value = '';
        descEl.value = '';
        
        const container = document.getElementById('new-task-container');
        if (container) container.classList.remove('active');
        const toggleBtn = document.getElementById('toggle-form-btn');
        if (toggleBtn) toggleBtn.innerHTML = '<span>+</span> Nova Tarefa';
        
        loadTasks();
        loadStats();
    } else {
        showToast('Erro ao criar tarefa', 'error');
    }
}

async function toggleTask(id, completed) {
    await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed: completed ? 1 : 0 })
    });
    showToast(completed ? 'Tarefa concluída!' : 'Tarefa pendente', 'info');
    const activeFilter = document.querySelector('.filter-btn.active');
    loadTasks(activeFilter ? activeFilter.dataset.filter : 'all');
    loadStats();
}

async function deleteTask(id) {
    showConfirm('Excluir?', 'Tem certeza que deseja apagar esta tarefa?', async () => {
        const res = await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
        if (res.ok) {
            showToast('Tarefa excluída', 'info');
            loadTasks();
            loadStats();
        }
    });
}

function openEditModal(id, title, desc) {
    const modal = document.getElementById('edit-modal');
    if (!modal) return;
    document.getElementById('edit-task-id').value = id;
    document.getElementById('edit-task-title').value = title;
    document.getElementById('edit-task-desc').value = desc;
    modal.classList.add('active');
}

function closeModal() {
    const modal = document.getElementById('edit-modal');
    if (modal) modal.classList.remove('active');
}

async function saveEdit() {
    const id = document.getElementById('edit-task-id').value;
    const title = document.getElementById('edit-task-title').value;
    const description = document.getElementById('edit-task-desc').value;

    const res = await fetch(`/api/tasks/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description })
    });

    if (res.ok) {
        showToast('Tarefa atualizada!', 'success');
        closeModal();
        loadTasks();
    }
}

function filterTasksLocally(query) {
    const items = document.querySelectorAll('.task-item');
    const searchTerm = query.toLowerCase();

    items.forEach(item => {
        const title = item.querySelector('h4').innerText.toLowerCase();
        const desc = item.querySelector('p').innerText.toLowerCase();
        if (title.includes(searchTerm) || desc.includes(searchTerm)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}
