let currentViewMode = 'tech'; 
let cachedData = null;

function openTab(evt, tabName) {
    const tabContent = document.querySelectorAll(".tab-content");
    tabContent.forEach(tab => tab.classList.remove("active"));
    
    const tabBtns = document.querySelectorAll(".tab-btn");
    tabBtns.forEach(btn => btn.classList.remove("active"));

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");

    if (window.logToTerminal) {
        window.logToTerminal(`NAVIGATING TO [${tabName.toUpperCase()}]... SUCCESS.`);
    }
}

function updateClock() {
    const now = new Date();
    const timeElement = document.getElementById('status-time');
    if (timeElement) {
        timeElement.innerText = now.toLocaleTimeString('en-GB', { hour12: false });
    }
}

function setViewMode(mode) {
    currentViewMode = mode;
    
    document.querySelectorAll('.toggle-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`btn-${mode}`);
    if (activeBtn) activeBtn.classList.add('active');
    
    renderExperience();
    
    if (window.logToTerminal) {
        window.logToTerminal(`VIEW_MODE_CHANGED: [${mode.toUpperCase()}]`);
    }
}

function renderExperience() {
    const log = document.getElementById('experience-log');
    if (!cachedData || !log) return;

    const highlightsKey = currentViewMode === 'tech' ? 'highlights_tech' : 'highlights_biz';
    
    log.innerHTML = `
        <div class="view-toggle-container">
            <span style="opacity: 0.5; font-family: 'JetBrains Mono'; font-size: 0.7rem;">PERSPECTIVE:</span>
            <div class="toggle-group">
                <button id="btn-tech" class="toggle-btn ${currentViewMode === 'tech' ? 'active' : ''}" onclick="setViewMode('tech')">TECHNICAL</button>
                <button id="btn-biz" class="toggle-btn ${currentViewMode === 'biz' ? 'active' : ''}" onclick="setViewMode('biz')">BUSINESS</button>
            </div>
        </div>
        <h2>// EXPERIENCE_HISTORY</h2>
        ${cachedData.work_experience.map(job => `
            <div class="experience-item">
                <div class="item-header">
                    <span class="position-title">${job.position}</span>
                    <span class="item-date">${job.start_date} — ${job.end_date}</span>
                </div>
                <div class="company-name">${job.company}</div>
                <ul class="highlights-list">
                    ${(job[highlightsKey] || []).map(h => `<li>${h}</li>`).join('')}
                </ul>
                <div class="tech-stack">
                    ${(job.tech_stack || []).map(t => `<span class="tech-tag">${t}</span>`).join('')}
                </div>
            </div>
        `).join('')}
    `;
}

function initTerminal() {
    const input = document.getElementById('terminal-input');
    const history = document.getElementById('terminal-history');
    if (!input || !history) return;

    const commands = {
        'help': 'Available: exp, edu, clear',
        'status': `System: STABLE. Session: ACTIVE. Location: ${cachedData.contact.location.toUpperCase()}.`,
        'clear': 'CLEAR'
    };

    window.logToTerminal = (msg) => {
        history.innerHTML += `<div style="color: var(--accent); opacity: 0.7;">[SYS]: ${msg}</div>`;
        const body = document.getElementById('terminal-body');
        if (body) body.scrollTop = body.scrollHeight;
    };

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const cmd = input.value.toLowerCase().trim();
            const response = commands[cmd] || `Error: [${cmd}] unrecognized.`;

            if (cmd === 'clear') {
                history.innerHTML = '';
            } else {
                history.innerHTML += `<div><span class="prompt">guest@portfolio:~$</span> ${cmd}</div>`;
                history.innerHTML += `<div style="color: var(--text-dim); margin-bottom: 10px;">> ${response}</div>`;
                
                if (cmd === 'exp') document.querySelector('[onclick*="experience"]').click();
                if (cmd === 'edu') document.querySelector('[onclick*="education"]').click();
            }
            input.value = '';
            const body = document.getElementById('terminal-body');
            if (body) body.scrollTop = body.scrollHeight;
        }
    });
}

async function loadPortfolio() {
    try {
        const response = await fetch('portfolio.json');
        if (!response.ok) throw new Error("portfolio.json not found");
        cachedData = await response.json();

        // 1. Hero Identity (Name & Summary)
        document.getElementById('hero-identity').innerHTML = `
            <h1>${cachedData.name}</h1>
            <div class="label">${cachedData.label}</div>
            <p style="color: var(--text-dim); font-size: 0.95rem; line-height: 1.6;">${cachedData.summary}</p>
        `;

        // 2. Social Links
        document.getElementById('social-nav').innerHTML = cachedData.social_links.map(link => `
            <a href="${link.url}" target="_blank" title="${link.label}" style="margin-right: 15px; color: var(--text-dim);">
                <i data-feather="${link.icon || 'link'}" style="width:18px"></i>
            </a>
        `).join('');

        // 3. About: Current Focus
        const current = cachedData.work_experience[0];
        document.getElementById('current-focus').innerHTML = `
            <h2>// CURRENT_FOCUS</h2>
            <div class="position-title">${current.position}</div>
            <div class="company-name">${current.company}</div>
            <ul class="highlights-list" style="margin-top: 15px;">
                ${(current.highlights_biz || []).map(h => `<li>${h}</li>`).join('')}
            </ul>
        `;

        // 4. About: Technical Matrix (Grid)
        document.getElementById('skills-matrix').innerHTML = `
            <h2>// TECHNICAL_MATRIX</h2>
            <div class="skills-grid-layout">
                ${cachedData.skills.map(s => `
                    <div class="skill-category-block">
                        <div class="skill-category-title">${s.category}</div>
                        <ul class="skill-list-items">
                            ${s.items.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                `).join('')}
            </div>
        `;

        // 5. Experience Tab
        renderExperience();

        // 6. Education Tab
        document.getElementById('education-log').innerHTML = `
            <h2>// ACADEMIC_RECORDS</h2>
            ${cachedData.education.map(edu => `
                <div class="experience-item" style="border:none; margin:0; padding-bottom: 20px;">
                    <div class="item-header">
                        <span class="position-title">${edu.institution}</span>
                        <span class="item-date">${edu.graduation_date}</span>
                    </div>
                    <div class="company-name">${edu.degree}</div>
                </div>
            `).join('')}
        `;

        // Footer Data
        document.getElementById('status-location').innerText = cachedData.contact.location.toUpperCase();
        document.getElementById('session-id').innerText = Math.random().toString(36).substr(2, 9).toUpperCase();
        document.getElementById('year').innerText = new Date().getFullYear();

        // Initialization
        setInterval(updateClock, 1000);
        updateClock();
        initTerminal();
        feather.replace();

    } catch (err) {
        console.error("FATAL_ERROR:", err);
        document.body.innerHTML = `<div style="color:#ff0033; padding:40px; font-family:monospace; background:#000; height:100vh;">
            [CRITICAL_FAILURE]: ${err.message}<br>Check if portfolio.json exists and is valid.
        </div>`;
    }
}

loadPortfolio();