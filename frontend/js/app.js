const API_BASE = 'http://localhost:8082/api';

let selectedRoles = [];
let currentRole = null;
let mcqQuestions = [];
let userAnswers = {};
let resumeAnalysisJson = '';

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadRoles();
    setupEventListeners();
});

function setupEventListeners() {
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('file-input');
    const btnAnalyze = document.getElementById('btn-analyze');
    const btnRestart = document.getElementById('btn-restart');
    const fileRemove = document.getElementById('file-remove');

    uploadZone?.addEventListener('click', () => fileInput?.click());
    uploadZone?.addEventListener('dragover', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#a855f7';
    });
    uploadZone?.addEventListener('dragleave', () => {
        uploadZone.style.borderColor = '#6366f1';
    });
    uploadZone?.addEventListener('drop', (e) => {
        e.preventDefault();
        uploadZone.style.borderColor = '#6366f1';
        if (e.dataTransfer.files.length) {
            fileInput.files = e.dataTransfer.files;
            showFileName(e.dataTransfer.files[0].name);
        }
    });

    fileInput?.addEventListener('change', (e) => {
        if (e.target.files.length) {
            showFileName(e.target.files[0].name);
        }
    });

    fileRemove?.addEventListener('click', () => {
        fileInput.value = '';
        document.getElementById('file-info').style.display = 'none';
        document.getElementById('upload-zone').style.display = 'block';
    });

    btnAnalyze?.addEventListener('click', analyzeResume);
    btnRestart?.addEventListener('click', restart);
}

function showFileName(name) {
    document.getElementById('file-name').textContent = name;
    document.getElementById('file-info').style.display = 'flex';
    document.getElementById('upload-zone').style.display = 'none';
    updateAnalyzeButtonState();
}

function updateAnalyzeButtonState() {
    const hasFile = document.getElementById('file-input').files.length > 0;
    const hasRoles = selectedRoles.length > 0;
    const btn = document.getElementById('btn-analyze');
    if (btn) btn.disabled = !(hasFile && hasRoles);
}

async function loadRoles() {
    try {
        const res = await fetch(`${API_BASE}/roles`);
        const roles = await res.json();
        const grid = document.getElementById('roles-grid');
        if (!grid) return;

        grid.innerHTML = '';
        for (const [key, label] of Object.entries(roles)) {
            const btn = document.createElement('button');
            btn.className = 'role-btn';
            btn.textContent = label;
            btn.addEventListener('click', () => {
                btn.classList.toggle('active');
                if (btn.classList.contains('active')) {
                    selectedRoles.push(key);
                } else {
                    selectedRoles = selectedRoles.filter(r => r !== key);
                }
                updateAnalyzeButtonState();
            });
            grid.appendChild(btn);
        }
    } catch (error) {
        console.error('Error loading roles:', error);
    }
}

async function analyzeResume() {
    const file = document.getElementById('file-input').files[0];
    if (!file || selectedRoles.length === 0) return;

    switchScreen('screen-processing');
    updateProcessingMessage('Analyzing Your Resume...', 'Extracting skills and experience');

    const formData = new FormData();
    formData.append('file', file);
    selectedRoles.forEach(role => formData.append('roles', role));

    try {
        const res = await fetch(`${API_BASE}/analyze`, {
            method: 'POST',
            body: formData
        });
        const data = await res.json();

        if (data.error) {
            alert('Error: ' + data.error);
            switchScreen('screen-upload');
            return;
        }

        resumeAnalysisJson = data.resumeAnalysisJson || JSON.stringify(data.resumeAnalysis);
        showVerdict(data.verdict);
    } catch (error) {
        console.error('Error:', error);
        alert('Analysis failed: ' + error.message);
        switchScreen('screen-upload');
    }
}

function updateProcessingMessage(title, subtitle) {
    const titleEl = document.getElementById('processing-title');
    const subtitleEl = document.getElementById('processing-subtitle');
    if (titleEl) titleEl.textContent = title;
    if (subtitleEl) subtitleEl.textContent = subtitle;
}

function showVerdict(verdict) {
    switchScreen('screen-verdict');

    const verdictBadge = document.getElementById('verdict-badge');
    const verdictIcon = document.getElementById('verdict-icon');
    const verdictText = document.getElementById('verdict-text');
    const verdictConfidence = document.getElementById('verdict-confidence');

    const pass = verdict?.verdict === 'PASS';
    verdictIcon.textContent = pass ? '✓' : '✗';
    verdictIcon.style.color = pass ? '#10b981' : '#ef4444';
    verdictText.textContent = pass ? 'Great Fit!' : 'Needs Work';
    verdictConfidence.textContent = `Confidence: ${verdict?.confidence || 0}%`;

    const verdictDetails = document.getElementById('verdict-details');
    verdictDetails.innerHTML = '';

    if (verdict?.roleVerdicts) {
        Object.entries(verdict.roleVerdicts).forEach(([role, data]) => {
            const card = document.createElement('div');
            card.className = 'verdict-detail-card glass-card';
            card.innerHTML = `
                <h3>${role}</h3>
                <p>${data.verdict === 'PASS' ? '✓' : '✗'} ${data.verdict}</p>
                <p class="confidence">Confidence: ${data.confidence}%</p>
            `;
            verdictDetails.appendChild(card);
        });
    }

    document.getElementById('btn-take-quiz').addEventListener('click', () => loadQuiz(selectedRoles[0]));
}

async function loadQuiz(role) {
    switchScreen('screen-mcq');
    updateProcessingMessage('Loading Quiz...', `Preparing questions for ${role}`);

    try {
        const res = await fetch(`${API_BASE}/mcq/${role}`);
        mcqQuestions = await res.json();
        currentRole = role;
        userAnswers[role] = [];
        showQuestion(0);
    } catch (error) {
        console.error('Error loading quiz:', error);
        alert('Failed to load quiz questions');
    }
}

function showQuestion(index) {
    if (index >= mcqQuestions.length) {
        submitQuiz();
        return;
    }

    const q = mcqQuestions[index];
    const progress = ((index + 1) / mcqQuestions.length) * 100;

    document.getElementById('mcq-progress-fill').style.width = progress + '%';
    document.getElementById('mcq-counter').textContent = `Question ${index + 1} / ${mcqQuestions.length}`;
    document.getElementById('mcq-role-badge').textContent = currentRole;
    document.getElementById('mcq-difficulty').textContent = q.difficulty || 'Medium';
    document.getElementById('mcq-question').textContent = q.question;

    const optionsDiv = document.getElementById('mcq-options');
    optionsDiv.innerHTML = '';

    (q.options || []).forEach((opt, i) => {
        const label = document.createElement('label');
        label.className = 'mcq-option';
        label.innerHTML = `
            <input type="radio" name="answer" value="${i}" required>
            <span>${opt}</span>
        `;
        optionsDiv.appendChild(label);
    });

    document.getElementById('btn-mcq-next').disabled = true;
    document.querySelectorAll('input[name="answer"]').forEach(input => {
        input.addEventListener('change', () => {
            document.getElementById('btn-mcq-next').disabled = false;
            document.getElementById('btn-mcq-next').onclick = () => {
                userAnswers[currentRole][index] = parseInt(input.value);
                showQuestion(index + 1);
            };
        });
    });
}

async function submitQuiz() {
    switchScreen('screen-processing');
    updateProcessingMessage('Evaluating Your Answers...', 'Analyzing performance');

    try {
        const res = await fetch(`${API_BASE}/assess`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                answers: userAnswers,
                resumeAnalysisJson: resumeAnalysisJson
            })
        });

        const data = await res.json();
        showResults(data);
    } catch (error) {
        console.error('Error:', error);
        alert('Assessment failed: ' + error.message);
    }
}

function showResults(data) {
    switchScreen('screen-results');

    const assessment = data.assessment || {};
    const readiness = assessment.readinessPercent || assessment.readiness || 50;

    // Update gauge
    const gaugeNumber = document.getElementById('gauge-number');
    if (gaugeNumber) gaugeNumber.textContent = Math.round(readiness);

    const gaugeFill = document.getElementById('gauge-fill');
    if (gaugeFill) {
        const circumference = 2 * Math.PI * 85;
        const offset = circumference - (readiness / 100) * circumference;
        gaugeFill.style.strokeDashoffset = offset;
    }

    // Update observations
    const observationsList = document.getElementById('observations-list');
    if (observationsList) {
        observationsList.innerHTML = '';
        const observations = assessment.observations || [];
        if (observations.length === 0) {
            observationsList.innerHTML = '<li>Analysis complete. Check suggestions for next steps.</li>';
        } else {
            observations.forEach(obs => {
                const li = document.createElement('li');
                li.textContent = obs;
                observationsList.appendChild(li);
            });
        }
    }

    // Update suggestions
    const suggestionsList = document.getElementById('suggestions-list');
    if (suggestionsList) {
        suggestionsList.innerHTML = '';
        const suggestions = assessment.suggestions || [];
        if (suggestions.length === 0) {
            suggestionsList.innerHTML = '<li>Continue building your technical skills and experience.</li>';
        } else {
            suggestions.forEach(sug => {
                const li = document.createElement('li');
                li.textContent = sug;
                suggestionsList.appendChild(li);
            });
        }
    }

    // Update role-wise readiness
    const roleReadinessGrid = document.getElementById('role-readiness-grid');
    if (roleReadinessGrid) {
        roleReadinessGrid.innerHTML = '';
        const roleReadiness = assessment.roleReadiness || {};

        if (Object.keys(roleReadiness).length === 0) {
            // Generate default readiness based on scores
            selectedRoles.forEach(role => {
                const card = document.createElement('div');
                card.className = 'role-readiness-item';
                card.innerHTML = `
                    <div class="role-name">${role}</div>
                    <div class="role-bar">
                        <div class="role-fill" style="width: ${readiness}%"></div>
                    </div>
                    <div class="role-percent">${Math.round(readiness)}%</div>
                `;
                roleReadinessGrid.appendChild(card);
            });
        } else {
            Object.entries(roleReadiness).forEach(([role, note]) => {
                const card = document.createElement('div');
                card.className = 'role-readiness-item';
                const match = note.match(/(\d+)%/);
                const percent = match ? parseInt(match[1]) : 50;
                card.innerHTML = `
                    <div class="role-name">${role}</div>
                    <div class="role-bar">
                        <div class="role-fill" style="width: ${percent}%"></div>
                    </div>
                    <div class="role-percent">${percent}%</div>
                    <div class="role-note">${note}</div>
                `;
                roleReadinessGrid.appendChild(card);
            });
        }
    }

    // Update MCQ scores
    const mcqScoresGrid = document.getElementById('mcq-scores-grid');
    if (mcqScoresGrid && data.mcqResults) {
        mcqScoresGrid.innerHTML = '';
        const scores = data.mcqResults.scores || {};
        Object.entries(scores).forEach(([role, score]) => {
            const card = document.createElement('div');
            card.className = 'mcq-score-item';
            card.innerHTML = `
                <div class="score-role">${role}</div>
                <div class="score-value">${score}%</div>
                <div class="score-bar">
                    <div class="score-fill" style="width: ${score}%"></div>
                </div>
            `;
            mcqScoresGrid.appendChild(card);
        });
    }
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
}

function restart() {
    selectedRoles = [];
    userAnswers = {};
    mcqQuestions = [];
    resumeAnalysisJson = '';

    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';

    document.getElementById('file-info').style.display = 'none';
    document.getElementById('upload-zone').style.display = 'block';

    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));

    switchScreen('screen-upload');
    updateAnalyzeButtonState();
}
