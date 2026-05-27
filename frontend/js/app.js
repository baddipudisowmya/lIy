const API_BASE = 'http://localhost:8082/api';

let selectedRoles = [];
let currentRole = null;
let selectedExperience = '';
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
    const experienceSelect = document.getElementById('experience-level');

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

    experienceSelect?.addEventListener('change', (e) => {
        selectedExperience = e.target.value;
        updateAnalyzeButtonState();
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
    const hasExperience = selectedExperience !== '';
    const btn = document.getElementById('btn-analyze');
    if (btn) btn.disabled = !(hasFile && hasRoles && hasExperience);
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
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                // Remove active class from all buttons (radio behavior)
                document.querySelectorAll('.role-btn').forEach(b => b.classList.remove('active'));
                // Add active class only to clicked button
                btn.classList.add('active');
                // Set selectedRoles to contain only this role
                selectedRoles = [key];
                console.log('Selected roles:', selectedRoles);
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
    if (!file || selectedRoles.length === 0 || !selectedExperience) return;

    switchScreen('screen-processing');
    updateProcessingMessage('Analyzing Your Resume...', `Experience Level: ${selectedExperience} years`);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('experience', selectedExperience);
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

    const verdictIcon = document.getElementById('verdict-icon');
    const verdictText = document.getElementById('verdict-text');
    const verdictConfidence = document.getElementById('verdict-confidence');

    const pass = verdict?.roleVerdicts ? Object.values(verdict.roleVerdicts).some(v => v.pass) : false;
    verdictIcon.textContent = pass ? '✓' : '✗';
    verdictIcon.style.color = pass ? '#10b981' : '#ef4444';
    verdictText.textContent = pass ? 'Great Fit!' : 'Needs Work';

    // Calculate average confidence
    let avgConfidence = 0;
    if (verdict?.roleVerdicts) {
        const confidences = Object.values(verdict.roleVerdicts).map(v => v.confidence || 0);
        avgConfidence = Math.round(confidences.reduce((a, b) => a + b, 0) / confidences.length);
    }
    verdictConfidence.textContent = `Confidence: ${avgConfidence}%`;

    // Determine if high match (≥70%)
    const roleData = verdict?.roleVerdicts?.[selectedRoles[0]];
    const matchScore = roleData?.confidence || avgConfidence;

    const verdictDetails = document.getElementById('verdict-details');
    verdictDetails.innerHTML = '';

    if (matchScore >= 70) {
        // HIGH MATCH - Show interview prep content
        const card = document.createElement('div');
        card.className = 'verdict-detail-card glass-card high-match';

        let strengthsList = '';
        if (roleData?.keyStrengths && Array.isArray(roleData.keyStrengths)) {
            strengthsList = roleData.keyStrengths.map(s => `<li><span class="checkmark">✓</span> ${s}</li>`).join('');
        }

        let gapsList = '';
        if (roleData?.keyGaps && Array.isArray(roleData.keyGaps)) {
            gapsList = roleData.keyGaps.slice(0, 6).map(g => `<li><span class="target">🎯</span> ${g}</li>`).join('');
        }

        card.innerHTML = `
            <div class="card-header">
                <h3>${selectedRoles[0].toUpperCase()}</h3>
                <div class="status ${roleData.pass ? 'pass' : 'fail'}">
                    ${roleData.pass ? '✓ PASS' : '✗ NEEDS WORK'} - ${roleData.confidence}% confidence
                </div>
            </div>
            ${roleData.summary ? `<div class="summary-section"><p class="summary">${roleData.summary}</p></div>` : ''}
            <div class="strengths-weaknesses-container">
                <div class="strengths-section">
                    <h4>✓ What You're Doing Well</h4>
                    ${strengthsList ? `<ul class="strengths-list">${strengthsList}</ul>` : '<p class="no-items">No strengths listed</p>'}
                </div>
                <div class="weaknesses-section">
                    <h4>🎯 Focus Areas Before Interview</h4>
                    ${gapsList ? `<ul class="weaknesses-list">${gapsList}</ul>` : '<p class="no-items">No gaps listed</p>'}
                </div>
            </div>
        `;
        verdictDetails.appendChild(card);
    } else {
        // LOW MATCH - Show growth-focused feedback
        const card = document.createElement('div');
        card.className = 'verdict-detail-card glass-card low-match';

        let strengthsList = '';
        if (roleData?.keyStrengths && Array.isArray(roleData.keyStrengths)) {
            strengthsList = roleData.keyStrengths.map(s => `<li><span class="checkmark">✓</span> ${s}</li>`).join('');
        }

        let growthAreasList = '';
        if (roleData?.keyGaps && Array.isArray(roleData.keyGaps)) {
            growthAreasList = roleData.keyGaps.slice(0, 6).map(g => `<li><span class="growth">📈</span> ${g}</li>`).join('');
        }

        // Score display with encouraging message
        let scoreColor = matchScore >= 50 ? '#f59e0b' : '#ef4444';
        let encouragingMessage = '';
        if (matchScore >= 60) {
            encouragingMessage = `You're building a strong foundation for this role. With focused improvement in a few key areas, you can significantly increase your interview readiness. We have a personalized roadmap to guide your growth.`;
        } else if (matchScore >= 50) {
            encouragingMessage = `You have solid fundamentals and great potential! This role aligns with your interests. By developing the recommended skills, you'll be well-prepared for interview success.`;
        } else {
            encouragingMessage = `You're at the beginning of your journey toward this role. Don't be discouraged – every expert started here. With dedicated learning using our personalized roadmap, you can build the skills needed.`;
        }

        card.innerHTML = `
            <div class="growth-header">
                <div class="growth-score">
                    <div class="score-circle" style="border-color: ${scoreColor};">
                        <span class="score-value">${matchScore}%</span>
                        <span class="score-label">Match Score</span>
                    </div>
                </div>
                <div class="growth-title">
                    <h3>${selectedRoles[0].toUpperCase()}</h3>
                    <p class="growth-message">${encouragingMessage}</p>
                </div>
            </div>

            <div class="growth-sections">
                <div class="growth-section">
                    <h4 class="growth-section-title">✓ Your Strengths</h4>
                    ${strengthsList ? `<ul class="growth-list">${strengthsList}</ul>` : '<p class="no-items">Great job on building these skills!</p>'}
                </div>

                <div class="growth-section">
                    <h4 class="growth-section-title">📈 Growth Areas</h4>
                    <p class="growth-explanation">These are areas where focused learning will make the biggest impact:</p>
                    ${growthAreasList ? `<ul class="growth-list">${growthAreasList}</ul>` : '<p class="no-items">Keep building on your existing skills!</p>'}
                </div>
            </div>

            <div class="recommended-skills">
                <h4 class="skills-title">💡 Recommended Skills to Improve</h4>
                <div class="skills-grid" id="skills-grid-${selectedRoles[0]}">
                    <!-- Populated dynamically -->
                </div>
            </div>
        `;
        verdictDetails.appendChild(card);

        // Populate recommended skills
        populateRecommendedSkills(selectedRoles[0]);
    }

    // Setup button
    const btn = document.getElementById('btn-take-quiz');
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    if (matchScore >= 70) {
        const btnText = newBtn.querySelector('.btn-text');
        if (btnText) btnText.textContent = 'Prepare for Interview';
        newBtn.addEventListener('click', () => {
            showInterviewPrep(selectedRoles[0]);
        });
    } else {
        const btnText = newBtn.querySelector('.btn-text');
        if (btnText) btnText.textContent = '🛣️ View Your Growth Roadmap';
        newBtn.addEventListener('click', () => {
            showPersonalizedRoadmap(selectedRoles[0], matchScore, verdict);
        });
    }
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

// Recommended Skills Database
const recommendedSkillsDB = {
    sde: [
        { skill: 'System Design & Architecture', priority: 'High', level: 'Intermediate', resources: 'Grok System Design, LeetCode System Design' },
        { skill: 'Data Structures & Algorithms', priority: 'High', level: 'Core', resources: 'LeetCode, HackerRank, GeeksforGeeks' },
        { skill: 'Distributed Systems', priority: 'High', level: 'Advanced', resources: 'Designing Data-Intensive Applications book' },
        { skill: 'Database Design (SQL & NoSQL)', priority: 'High', level: 'Intermediate', resources: 'Database courses on Udemy, PostgreSQL docs' },
        { skill: 'Microservices Architecture', priority: 'Medium', level: 'Intermediate', resources: 'Microservices patterns course' },
        { skill: 'Cloud Platforms (AWS/GCP/Azure)', priority: 'Medium', level: 'Intermediate', resources: 'Official cloud documentation, Udemy' },
    ],
    fde: [
        { skill: 'JavaScript ES6+ & Advanced Concepts', priority: 'High', level: 'Core', resources: 'JavaScript.info, You Don\'t Know JS' },
        { skill: 'React Framework & Hooks', priority: 'High', level: 'Core', resources: 'React official docs, Scrimba courses' },
        { skill: 'State Management (Redux/Context)', priority: 'High', level: 'Intermediate', resources: 'Redux docs, Context API tutorial' },
        { skill: 'CSS & Responsive Design', priority: 'High', level: 'Core', resources: 'CSS Tricks, Flexbox/Grid tutorials' },
        { skill: 'Web Performance Optimization', priority: 'Medium', level: 'Advanced', resources: 'Web.dev, performance optimization guide' },
        { skill: 'Testing (Jest, React Testing Library)', priority: 'Medium', level: 'Intermediate', resources: 'Jest docs, Testing Playground' },
    ],
    backend_dev: [
        { skill: 'REST API Design & Development', priority: 'High', level: 'Core', resources: 'REST API best practices guide' },
        { skill: 'Database Design (SQL)', priority: 'High', level: 'Core', resources: 'SQL tutorials, database design course' },
        { skill: 'Authentication & Authorization', priority: 'High', level: 'Intermediate', resources: 'OAuth2, JWT tutorials' },
        { skill: 'Server Frameworks (Express, Spring Boot)', priority: 'High', level: 'Core', resources: 'Official framework documentation' },
        { skill: 'Caching Strategies & Redis', priority: 'Medium', level: 'Intermediate', resources: 'Redis documentation, caching patterns' },
        { skill: 'API Testing & Documentation (Postman, Swagger)', priority: 'Medium', level: 'Intermediate', resources: 'Postman learning center, Swagger docs' },
    ],
    data_scientist: [
        { skill: 'Python for Data Science', priority: 'High', level: 'Core', resources: 'DataCamp, Kaggle, Python docs' },
        { skill: 'Statistics & Probability', priority: 'High', level: 'Core', resources: 'StatQuest with Josh Starmer (YouTube)' },
        { skill: 'Machine Learning Algorithms', priority: 'High', level: 'Intermediate', resources: 'Scikit-learn docs, Coursera ML course' },
        { skill: 'Data Visualization (Matplotlib, Seaborn)', priority: 'High', level: 'Core', resources: 'Matplotlib/Seaborn tutorials' },
        { skill: 'SQL for Data Analysis', priority: 'High', level: 'Core', resources: 'SQL tutorial, Mode Analytics' },
        { skill: 'Deep Learning & Neural Networks', priority: 'Medium', level: 'Advanced', resources: 'Fast.ai, Andrew Ng courses' },
    ],
    devops: [
        { skill: 'Docker & Containerization', priority: 'High', level: 'Core', resources: 'Docker official tutorial, Play with Docker' },
        { skill: 'Kubernetes Orchestration', priority: 'High', level: 'Intermediate', resources: 'Kubernetes official docs, KodeKloud' },
        { skill: 'CI/CD Pipelines', priority: 'High', level: 'Core', resources: 'Jenkins, GitLab CI tutorials' },
        { skill: 'Infrastructure as Code (Terraform)', priority: 'High', level: 'Intermediate', resources: 'Terraform docs, HashiCorp learning' },
        { skill: 'Cloud Platforms (AWS)', priority: 'High', level: 'Intermediate', resources: 'AWS documentation and certifications' },
        { skill: 'Monitoring & Logging (ELK, Prometheus)', priority: 'Medium', level: 'Intermediate', resources: 'Prometheus docs, ELK stack tutorial' },
    ],
    ml_engineer: [
        { skill: 'Deep Learning Frameworks (TensorFlow/PyTorch)', priority: 'High', level: 'Core', resources: 'Official documentation, Fast.ai' },
        { skill: 'Neural Networks & Architectures (CNN, RNN)', priority: 'High', level: 'Intermediate', resources: 'Stanford CS231N, CS224N courses' },
        { skill: 'Feature Engineering & Preprocessing', priority: 'High', level: 'Intermediate', resources: 'Kaggle competitions, scikit-learn' },
        { skill: 'Model Evaluation & Metrics', priority: 'High', level: 'Core', resources: 'Scikit-learn docs, ML courses' },
        { skill: 'Computer Vision & NLP', priority: 'Medium', level: 'Advanced', resources: 'OpenCV, NLTK, Hugging Face' },
        { skill: 'Model Deployment & Production', priority: 'Medium', level: 'Advanced', resources: 'MLflow, TensorFlow Serving' },
    ],
    mobile_dev: [
        { skill: 'Platform-Specific Languages (Swift/Kotlin)', priority: 'High', level: 'Core', resources: 'Official Apple/Android docs' },
        { skill: 'UI/UX & Mobile Design Patterns', priority: 'High', level: 'Core', resources: 'Material Design, Human Interface Guidelines' },
        { skill: 'Native App Development', priority: 'High', level: 'Intermediate', resources: 'Xcode, Android Studio tutorials' },
        { skill: 'APIs & Networking', priority: 'High', level: 'Core', resources: 'Networking in Swift/Kotlin tutorials' },
        { skill: 'Local Data Storage (SQLite, CoreData)', priority: 'Medium', level: 'Intermediate', resources: 'Database tutorials' },
        { skill: 'Cross-Platform Frameworks (React Native/Flutter)', priority: 'Medium', level: 'Intermediate', resources: 'Official framework docs' },
    ],
    cloud_architect: [
        { skill: 'Cloud Architecture Patterns', priority: 'High', level: 'Advanced', resources: 'AWS Well-Architected Framework' },
        { skill: 'Scalability & High Availability', priority: 'High', level: 'Advanced', resources: 'Architecture design courses' },
        { skill: 'Cloud Security & Compliance', priority: 'High', level: 'Intermediate', resources: 'Cloud security frameworks' },
        { skill: 'Multi-Cloud Strategy', priority: 'High', level: 'Advanced', resources: 'AWS, Azure, GCP documentation' },
        { skill: 'Cost Optimization', priority: 'Medium', level: 'Intermediate', resources: 'Cloud cost management tools' },
        { skill: 'Disaster Recovery & Business Continuity', priority: 'Medium', level: 'Advanced', resources: 'DR planning guides' },
    ],
    cybersecurity: [
        { skill: 'Network Security & Protocols', priority: 'High', level: 'Intermediate', resources: 'CompTIA Security+' },
        { skill: 'Penetration Testing & Ethical Hacking', priority: 'High', level: 'Advanced', resources: 'CEH course, HackTheBox' },
        { skill: 'Vulnerability Assessment & Management', priority: 'High', level: 'Intermediate', resources: 'OWASP, vulnerability scanning tools' },
        { skill: 'Cryptography & Encryption', priority: 'High', level: 'Intermediate', resources: 'Cryptography courses' },
        { skill: 'Incident Response & Forensics', priority: 'Medium', level: 'Advanced', resources: 'Incident response playbooks' },
        { skill: 'Compliance & Regulations (GDPR, HIPAA)', priority: 'Medium', level: 'Intermediate', resources: 'Compliance frameworks' },
    ],
    test_dev: [
        { skill: 'Test Automation Frameworks', priority: 'High', level: 'Core', resources: 'Selenium, Cypress, Appium docs' },
        { skill: 'Testing Methodologies & QA Processes', priority: 'High', level: 'Core', resources: 'QA courses, ISTQB certification' },
        { skill: 'Continuous Testing & CI/CD Integration', priority: 'High', level: 'Intermediate', resources: 'CI/CD automation guides' },
        { skill: 'Performance & Load Testing', priority: 'High', level: 'Intermediate', resources: 'JMeter, LoadRunner tutorials' },
        { skill: 'Test Data Management', priority: 'Medium', level: 'Intermediate', resources: 'Database and test data strategies' },
        { skill: 'API & Backend Testing', priority: 'Medium', level: 'Intermediate', resources: 'Postman, REST API testing' },
    ],
};

function populateRecommendedSkills(role) {
    const skillsGrid = document.getElementById(`skills-grid-${role}`);
    if (!skillsGrid) return;

    const skills = recommendedSkillsDB[role] || [];
    skillsGrid.innerHTML = '';

    skills.forEach(item => {
        const skillCard = document.createElement('div');
        skillCard.className = `skill-card priority-${item.priority.toLowerCase()}`;
        skillCard.innerHTML = `
            <div class="skill-header">
                <h5 class="skill-name">${item.skill}</h5>
                <span class="skill-priority">${item.priority}</span>
            </div>
            <p class="skill-level">Level: ${item.level}</p>
            <p class="skill-resources">📚 ${item.resources}</p>
        `;
        skillsGrid.appendChild(skillCard);
    });
}

function switchScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    const screen = document.getElementById(screenId);
    if (screen) screen.classList.add('active');
}

function restart() {
    selectedRoles = [];
    selectedExperience = '';
    userAnswers = {};
    mcqQuestions = [];
    resumeAnalysisJson = '';

    const fileInput = document.getElementById('file-input');
    if (fileInput) fileInput.value = '';

    const experienceSelect = document.getElementById('experience-level');
    if (experienceSelect) experienceSelect.value = '';

    document.getElementById('file-info').style.display = 'none';
    document.getElementById('upload-zone').style.display = 'block';

    document.querySelectorAll('.role-btn').forEach(btn => btn.classList.remove('active'));

    switchScreen('screen-upload');
    updateAnalyzeButtonState();
}

// Learning Roadmap Database
const learningRoadmapDB = {
    sde: {
        week1: { title: 'Core Concepts & Foundations', topics: ['Big O Notation & Complexity Analysis', 'Essential Data Structures (Arrays, Linked Lists, Stacks, Queues)', 'Hash Tables & Hashing', 'Introduction to System Design Basics'] },
        week2: { title: 'Intermediate Algorithms & Design', topics: ['Tree & Graph Fundamentals', 'Sorting & Searching Algorithms', 'Dynamic Programming Introduction', 'OOP Principles Deep Dive'] },
        week3: { title: 'System Design & Architecture', topics: ['Scalable System Design', 'Database Design (Relational & NoSQL)', 'API Design & RESTful Architecture', 'Caching Strategies'] },
        week4: { title: 'Practice & Preparation', topics: ['LeetCode Medium Problems (20-30)', 'Mock System Design Interviews', 'Code Review & Best Practices', 'Interview Day Preparation'] },
    },
    fde: {
        week1: { title: 'JavaScript Fundamentals', topics: ['ES6+ Syntax & Features', 'Closures, Scope & Hoisting', 'Promises & Async/Await', 'DOM Manipulation Mastery'] },
        week2: { title: 'React Core & Advanced', topics: ['React Components & Hooks', 'State Management Patterns', 'Component Lifecycle', 'Performance Optimization'] },
        week3: { title: 'Styling & Responsive Design', topics: ['CSS Flexbox & Grid', 'Responsive Design Principles', 'CSS-in-JS Solutions', 'Accessibility (a11y) Basics'] },
        week4: { title: 'Testing & Interview Prep', topics: ['Jest & React Testing Library', 'Browser DevTools Mastery', 'Build Tools (Webpack/Vite)', 'Mock Interview Projects'] },
    },
    backend_dev: {
        week1: { title: 'REST API Fundamentals', topics: ['HTTP Methods & Status Codes', 'API Design Principles', 'Request/Response Handling', 'Error Handling Patterns'] },
        week2: { title: 'Database & Data Modeling', topics: ['SQL Query Optimization', 'Index Design & Tuning', 'Database Normalization', 'N+1 Query Problem Solutions'] },
        week3: { title: 'Authentication & Scalability', topics: ['JWT & OAuth2 Implementation', 'Caching Strategies (Redis)', 'Load Balancing Basics', 'Microservices Introduction'] },
        week4: { title: 'Practical Projects & Testing', topics: ['Build 2-3 Complete APIs', 'API Documentation (Swagger)', 'Integration Testing', 'Deployment & Monitoring'] },
    },
    data_scientist: {
        week1: { title: 'Python & Data Fundamentals', topics: ['Python Data Structures', 'NumPy & Pandas Mastery', 'Data Cleaning & Preprocessing', 'Exploratory Data Analysis (EDA)'] },
        week2: { title: 'Statistics & Probability', topics: ['Descriptive Statistics', 'Probability Distributions', 'Hypothesis Testing', 'Statistical Inference'] },
        week3: { title: 'Machine Learning Algorithms', topics: ['Regression Models', 'Classification Algorithms', 'Model Evaluation Metrics', 'Feature Engineering Techniques'] },
        week4: { title: 'Projects & Presentations', topics: ['Build 2 ML Projects', 'Data Visualization Mastery', 'Model Interpretation', 'Case Study Practice'] },
    },
    devops: {
        week1: { title: 'Docker & Containers', topics: ['Docker Concepts & Images', 'Container Networking', 'Docker Compose', 'Container Registry & Best Practices'] },
        week2: { title: 'Kubernetes Basics', topics: ['K8s Architecture & Concepts', 'Pods, Deployments, Services', 'ConfigMaps & Secrets', 'Persistent Volumes'] },
        week3: { title: 'CI/CD & Infrastructure', topics: ['Jenkins/GitLab CI Setup', 'Infrastructure as Code (Terraform)', 'AWS Fundamentals', 'Monitoring & Logging'] },
        week4: { title: 'Real-world Scenarios', topics: ['Build Complete CI/CD Pipeline', 'Deploy to Kubernetes', 'Setup Monitoring Stack', 'Disaster Recovery Planning'] },
    },
    ml_engineer: {
        week1: { title: 'Deep Learning Frameworks', topics: ['TensorFlow/PyTorch Setup', 'Tensor Operations', 'Neural Network Building', 'Training Basics'] },
        week2: { title: 'Neural Architectures', topics: ['Convolutional Neural Networks (CNN)', 'Recurrent Neural Networks (RNN)', 'Transformer Basics', 'Architecture Selection'] },
        week3: { title: 'Model Optimization & Deployment', topics: ['Hyperparameter Tuning', 'Model Compression & Quantization', 'Model Serving', 'Production Pipelines'] },
        week4: { title: 'Projects & Practice', topics: ['Build 2-3 ML Models', 'Computer Vision Project', 'NLP Project', 'Model Deployment Practice'] },
    },
    mobile_dev: {
        week1: { title: 'Mobile Fundamentals', topics: ['Platform Overview (iOS/Android)', 'UI Components & Layouts', 'Lifecycle Management', 'Navigation Patterns'] },
        week2: { title: 'Data & Networking', topics: ['Local Data Storage', 'API Integration & Networking', 'JSON Parsing', 'Error Handling'] },
        week3: { title: 'Advanced Topics', topics: ['Background Tasks', 'Push Notifications', 'Sensors & Location', 'Performance Optimization'] },
        week4: { title: 'Build & Polish', topics: ['Build 2 Complete Apps', 'App Store Submission', 'Testing & Debugging', 'Interview Projects'] },
    },
    cloud_architect: {
        week1: { title: 'Cloud Fundamentals', topics: ['Cloud Service Models', 'AWS/Azure/GCP Overview', 'Networking in the Cloud', 'Security Fundamentals'] },
        week2: { title: 'Architecture Patterns', topics: ['Scalability & Load Balancing', 'High Availability Design', 'Disaster Recovery', 'Multi-Tier Architecture'] },
        week3: { title: 'Advanced Design', topics: ['Microservices Architecture', 'Cost Optimization', 'Security & Compliance', 'Database Architecture'] },
        week4: { title: 'Certification & Projects', topics: ['Cloud Architecture Certification Prep', 'Design 3-4 Complex Systems', 'Case Study Reviews', 'Interview Scenarios'] },
    },
    cybersecurity: {
        week1: { title: 'Security Fundamentals', topics: ['Network Security Basics', 'Encryption & Cryptography', 'Authentication & Authorization', 'Common Vulnerabilities (OWASP Top 10)'] },
        week2: { title: 'Offensive Security', topics: ['Penetration Testing Methodology', 'Vulnerability Scanning', 'Exploit Development Basics', 'Social Engineering Awareness'] },
        week3: { title: 'Defense & Incident Response', topics: ['Incident Response Procedures', 'Forensics & Log Analysis', 'Compliance & Regulations', 'Security Monitoring'] },
        week4: { title: 'Practical Experience', topics: ['HackTheBox Challenges', 'TryHackMe Labs', 'Capture The Flag Events', 'Security Certifications (CEH, OSCP)'] },
    },
    test_dev: {
        week1: { title: 'Testing Fundamentals', topics: ['Testing Types & Methodologies', 'Test Case Design', 'Manual Testing Practices', 'QA Best Practices'] },
        week2: { title: 'Test Automation', topics: ['Selenium WebDriver Basics', 'Test Framework Setup', 'Locators & Element Interaction', 'Test Organization & Patterns'] },
        week3: { title: 'Advanced Automation', topics: ['Data-Driven Testing', 'Cross-browser Testing', 'Performance Testing', 'API Testing & Postman'] },
        week4: { title: 'CI Integration & Projects', topics: ['CI/CD Integration', 'Build 3 Automation Test Suites', 'BDD Framework (Cucumber)', 'Interview Test Scenarios'] },
    },
};

// Certification Courses Database
const certificationCoursesDB = {
    sde: ['System Design Interview Master Course', 'Complete Coding Interview Course', 'LeetCode Premium Subscription'],
    fde: ['React - The Complete Guide', 'The Advanced Web Developer Bootcamp', 'Frontend System Design Course'],
    backend_dev: ['The Complete Node.js Developer Course', 'Spring Boot & Microservices', 'RESTful API Design Masterclass'],
    data_scientist: ['Machine Learning A-Z', 'Deep Learning Specialization', 'Data Science Professional Certificate'],
    devops: ['Docker & Kubernetes Complete Course', 'The Ultimate DevOps Bootcamp', 'AWS Solutions Architect Professional'],
    ml_engineer: ['Deep Learning Specialization', 'Fast.AI Practical Deep Learning', 'Applied Machine Learning with Python'],
    mobile_dev: ['iOS App Development Bootcamp', 'Android Development Master Course', 'React Native Complete Course'],
    cloud_architect: ['AWS Solutions Architect Professional', 'Azure Solutions Architect Expert', 'Google Cloud Professional Architect'],
    cybersecurity: ['Ethical Hacking & Penetration Testing', 'CompTIA Security+ Certification', 'CEH (Certified Ethical Hacker) Prep'],
    test_dev: ['The Complete Selenium WebDriver Course', 'QA & Software Testing Bootcamp', 'Test Automation University'],
};

// Interview Preparation Questions Database
const interviewQuestionsDB = {
    sde: {
        'Technical Fundamentals': [
            'Explain the difference between polymorphism and inheritance.',
            'What is the time complexity of binary search and how does it work?',
            'Describe the SOLID principles and provide examples of each.',
            'What is the difference between SQL and NoSQL databases?',
        ],
        'Coding/Problem Solving': [
            'Design a function to reverse a string without using built-in methods.',
            'Solve the "Two Sum" problem - find two numbers that add up to a target.',
            'Implement a LinkedList with insert, delete, and search operations.',
            'Write a function to detect if a binary tree is balanced.',
        ],
        'System Design': [
            'Design a URL shortening service like bit.ly.',
            'How would you design a load balancer for a web application?',
            'Explain microservices architecture and its advantages.',
            'Design a distributed cache system.',
        ],
        'HR/Behavioral': [
            'Tell me about a time when you had to debug a complex issue.',
            'Describe your experience with code reviews and how you handle feedback.',
            'How do you stay updated with new technologies?',
            'Tell me about a conflict you had with a team member and how you resolved it.',
        ]
    },
    fde: {
        'Technical Fundamentals': [
            'Explain the difference between let, const, and var in JavaScript.',
            'What is the Virtual DOM and how does React use it?',
            'Explain event delegation and why it\'s useful.',
            'What are higher-order components (HOC) and render props?',
        ],
        'Coding/Problem Solving': [
            'Build a todo list component with add, edit, and delete functionality.',
            'Implement a search feature with debouncing.',
            'Create a custom hook for managing form state.',
            'Write code to fetch data and handle loading/error states.',
        ],
        'UI/UX Principles': [
            'How would you optimize a slow-loading website?',
            'Explain responsive design and mobile-first approach.',
            'What accessibility features should a modern web app have?',
            'How do you handle browser compatibility issues?',
        ],
        'HR/Behavioral': [
            'Walk us through your design approach for a new feature.',
            'Describe a time when you improved user experience significantly.',
            'How do you collaborate with designers and backend developers?',
            'Tell me about your experience with testing frameworks.',
        ]
    },
    backend_dev: {
        'Technical Fundamentals': [
            'Explain the difference between REST and GraphQL APIs.',
            'What is database indexing and why is it important?',
            'Describe ACID properties in database transactions.',
            'How do you handle authentication and authorization?',
        ],
        'Coding/Problem Solving': [
            'Design a RESTful API for a blog application.',
            'Implement a caching strategy to optimize database queries.',
            'Write code to handle concurrent requests safely.',
            'Create a pagination system for large datasets.',
        ],
        'Architecture & Scalability': [
            'How would you scale a backend system to handle 1M requests/day?',
            'Explain message queues and their use cases.',
            'What is horizontal vs vertical scaling?',
            'Design a rate limiting system.',
        ],
        'HR/Behavioral': [
            'Describe your experience with deploying applications to production.',
            'How do you approach writing maintainable code?',
            'Tell me about a time you optimized a slow database query.',
            'How do you handle technical debt in your projects?',
        ]
    },
    data_scientist: {
        'Technical Fundamentals': [
            'Explain the bias-variance tradeoff in machine learning.',
            'What is cross-validation and why is it important?',
            'Describe the difference between supervised and unsupervised learning.',
            'What are the steps in a typical data science project?',
        ],
        'Coding/Problem Solving': [
            'Write code to clean and preprocess a dataset.',
            'Implement a simple linear regression model from scratch.',
            'Build a classification model using scikit-learn.',
            'Write code to perform exploratory data analysis (EDA).',
        ],
        'Statistical Analysis': [
            'Explain hypothesis testing and p-values.',
            'What are the assumptions of linear regression?',
            'How do you handle missing data and outliers?',
            'Describe feature scaling and normalization techniques.',
        ],
        'HR/Behavioral': [
            'Tell me about a data analysis project you\'re proud of.',
            'How do you communicate data insights to non-technical stakeholders?',
            'Describe your experience with big data tools like Spark.',
            'How do you stay updated with ML research?',
        ]
    },
    devops: {
        'Technical Fundamentals': [
            'Explain containerization and how Docker works.',
            'What is Kubernetes orchestration?',
            'Describe CI/CD pipelines and their benefits.',
            'What is Infrastructure as Code (IaC)?',
        ],
        'Coding/Problem Solving': [
            'Write a Dockerfile for a Python application.',
            'Create a Jenkins pipeline for automated testing and deployment.',
            'Design a monitoring and alerting system.',
            'Implement a rolling deployment strategy.',
        ],
        'Cloud & Infrastructure': [
            'Compare AWS, Azure, and GCP services.',
            'How would you set up auto-scaling for a web application?',
            'Explain different storage options in cloud platforms.',
            'Design a disaster recovery plan.',
        ],
        'HR/Behavioral': [
            'Tell me about a production incident you handled.',
            'How do you approach infrastructure automation?',
            'Describe your experience with version control systems.',
            'How do you ensure system reliability and uptime?',
        ]
    },
    test_dev: {
        'Technical Fundamentals': [
            'What is the difference between unit, integration, and end-to-end testing?',
            'Explain test-driven development (TDD) and its benefits.',
            'What are test fixtures and mocks?',
            'Describe the testing pyramid.',
        ],
        'Coding/Problem Solving': [
            'Write unit tests for a given function.',
            'Create end-to-end tests for a web application using Selenium.',
            'Implement a test suite using pytest or JUnit.',
            'Write performance and load tests.',
        ],
        'QA & Testing Strategy': [
            'How do you approach test case design?',
            'What is boundary value analysis?',
            'Explain exploratory testing vs scripted testing.',
            'How do you handle flaky tests?',
        ],
        'HR/Behavioral': [
            'Tell me about a critical bug you found.',
            'How do you collaborate with developers?',
            'Describe your experience with test automation frameworks.',
            'How do you balance test coverage and time constraints?',
        ]
    },
    ml_engineer: {
        'Technical Fundamentals': [
            'Explain gradient descent and backpropagation.',
            'What is overfitting and how do you prevent it?',
            'Describe different activation functions and their use cases.',
            'What is transfer learning?',
        ],
        'Coding/Problem Solving': [
            'Build a neural network from scratch using NumPy.',
            'Implement a CNN for image classification.',
            'Create an NLP model for text classification.',
            'Write code to fine-tune a pre-trained model.',
        ],
        'Model Deployment': [
            'How would you deploy an ML model to production?',
            'Explain model versioning and monitoring.',
            'What is model drift and how do you detect it?',
            'How do you optimize models for inference speed?',
        ],
        'HR/Behavioral': [
            'Tell me about an ML project you built.',
            'How do you approach feature engineering?',
            'Describe your experience with deep learning frameworks.',
            'How do you handle imbalanced datasets?',
        ]
    },
    mobile_dev: {
        'Technical Fundamentals': [
            'Explain the app lifecycle on iOS and Android.',
            'What is the difference between native and cross-platform development?',
            'Describe memory management in mobile apps.',
            'What are best practices for mobile app security?',
        ],
        'Coding/Problem Solving': [
            'Build a UI component for a weather app.',
            'Implement local data persistence using SQLite.',
            'Write code to handle network requests and offline scenarios.',
            'Create a location-based feature.',
        ],
        'Performance & UX': [
            'How do you optimize app startup time?',
            'Explain battery optimization techniques.',
            'What is responsive design for mobile?',
            'How do you handle different screen sizes?',
        ],
        'HR/Behavioral': [
            'Tell me about your mobile app project.',
            'How do you approach testing on devices?',
            'Describe your experience with version control and CI/CD.',
            'How do you stay updated with mobile frameworks?',
        ]
    },
    cloud_architect: {
        'Technical Fundamentals': [
            'Explain different cloud service models (IaaS, PaaS, SaaS).',
            'What is a Virtual Private Cloud (VPC)?',
            'Describe cloud security best practices.',
            'What are the trade-offs between availability and cost?',
        ],
        'Architecture & Design': [
            'Design a scalable e-commerce platform on AWS.',
            'Create a multi-region disaster recovery solution.',
            'Design a real-time data processing pipeline.',
            'Architect a secure API gateway.',
        ],
        'Cost & Optimization': [
            'How would you optimize cloud spending?',
            'Explain reserved instances vs on-demand pricing.',
            'What is auto-scaling and how do you configure it?',
            'How do you monitor and forecast cloud costs?',
        ],
        'HR/Behavioral': [
            'Tell me about a large-scale migration project.',
            'How do you approach architectural decisions?',
            'Describe your experience with cloud governance.',
            'How do you balance innovation with cost?',
        ]
    },
    cybersecurity: {
        'Technical Fundamentals': [
            'Explain the OSI model and network security.',
            'What are common vulnerability types (SQL injection, XSS, CSRF)?',
            'Describe encryption algorithms and their use cases.',
            'What is a digital signature and how does it work?',
        ],
        'Security Assessment': [
            'Explain penetration testing methodology.',
            'What is vulnerability scanning and remediation?',
            'Describe common attack vectors and defenses.',
            'How do you approach security auditing?',
        ],
        'Incident Response': [
            'What is your incident response process?',
            'How do you investigate security breaches?',
            'Explain forensics and evidence handling.',
            'What is threat intelligence and how is it used?',
        ],
        'HR/Behavioral': [
            'Tell me about a security incident you handled.',
            'How do you stay updated with emerging threats?',
            'Describe your experience with security tools.',
            'How do you approach security awareness training?',
        ]
    }
};

function showInterviewPrep(role) {
    // Hide verdict details and button
    document.getElementById('verdict-details').style.display = 'none';
    document.getElementById('btn-take-quiz').style.display = 'none';

    // Create interview prep container if it doesn't exist
    let prepContainer = document.getElementById('interview-prep-container');
    if (!prepContainer) {
        prepContainer = document.createElement('div');
        prepContainer.id = 'interview-prep-container';
        document.getElementById('verdict-reveal').parentElement.appendChild(prepContainer);
    }

    // Build interview prep content - ONLY QUESTIONS
    let prepHTML = `
        <div class="interview-prep-inline glass-card">
            <div class="prep-header">
                <h2 class="prep-title">Interview Questions</h2>
                <p class="prep-subtitle">Targeted questions for ${role.toUpperCase()}</p>
            </div>

            <div class="interview-questions-container-inline">
                <div class="questions-categories-inline" id="questions-categories-inline">
    `;

    // Add interview questions
    const questions = interviewQuestionsDB[role] || interviewQuestionsDB.sde;
    Object.entries(questions).forEach(([category, categoryQuestions]) => {
        prepHTML += `
                    <div class="question-category glass-card">
                        <h4 class="category-title">${category}</h4>
                        <ul class="category-questions">
        `;
        categoryQuestions.forEach(question => {
            prepHTML += `<li>${question}</li>`;
        });
        prepHTML += `
                        </ul>
                    </div>
        `;
    });

    prepHTML += `
                </div>
            </div>

            <div class="prep-actions">
                <button id="btn-back-to-verdict" class="btn-secondary">
                    <span class="btn-text">← Back to Verdict</span>
                </button>
                <button id="btn-restart-prep" class="btn-secondary">
                    <span class="btn-text">Try Another Resume</span>
                </button>
            </div>
        </div>
    `;

    prepContainer.innerHTML = prepHTML;

    // Setup button listeners
    document.getElementById('btn-back-to-verdict').addEventListener('click', () => {
        prepContainer.style.display = 'none';
        document.getElementById('verdict-details').style.display = 'block';
        document.getElementById('btn-take-quiz').style.display = 'block';
    });

    document.getElementById('btn-restart-prep').addEventListener('click', restart);

    // Scroll to interview prep
    prepContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function showPersonalizedRoadmap(role, matchScore, verdict) {
    // Hide verdict details and button
    document.getElementById('verdict-details').style.display = 'none';
    document.getElementById('btn-take-quiz').style.display = 'none';

    // Create roadmap container if it doesn't exist
    let roadmapContainer = document.getElementById('roadmap-container');
    if (!roadmapContainer) {
        roadmapContainer = document.createElement('div');
        roadmapContainer.id = 'roadmap-container';
        document.getElementById('verdict-reveal').parentElement.appendChild(roadmapContainer);
    }

    // Get learning roadmap for the role
    const roadmap = learningRoadmapDB[role] || learningRoadmapDB.sde;
    const courses = certificationCoursesDB[role] || certificationCoursesDB.sde;

    // Get role data for strengths and gaps
    const roleData = verdict?.roleVerdicts?.[role];

    // Build roadmap content
    let roadmapHTML = `
        <div class="roadmap-container glass-card">
            <div class="roadmap-header">
                <h2 class="roadmap-title">Your Personalized Growth Roadmap</h2>
                <p class="roadmap-subtitle">4-Week Plan to Master ${role.toUpperCase()}</p>
                <div class="roadmap-score-display">
                    <div class="roadmap-score-circle" style="border-color: ${matchScore >= 50 ? '#f59e0b' : '#ef4444'};">
                        <span class="roadmap-score-value">${matchScore}%</span>
                    </div>
                    <p class="roadmap-score-text">Current Match Score</p>
                </div>
            </div>

            <div class="roadmap-strengths-gaps">
                <div class="roadmap-section">
                    <h4 class="roadmap-section-title">✓ Build On These Strengths</h4>
                    <ul class="roadmap-list">
    `;

    if (roleData?.keyStrengths && Array.isArray(roleData.keyStrengths)) {
        roleData.keyStrengths.forEach(strength => {
            roadmapHTML += `<li><span class="checkmark">✓</span> ${strength}</li>`;
        });
    } else {
        roadmapHTML += `<li>Continue developing your existing skills</li>`;
    }

    roadmapHTML += `
                    </ul>
                </div>

                <div class="roadmap-section">
                    <h4 class="roadmap-section-title">🎯 Focus Areas to Master</h4>
                    <ul class="roadmap-list">
    `;

    if (roleData?.keyGaps && Array.isArray(roleData.keyGaps)) {
        roleData.keyGaps.slice(0, 6).forEach(gap => {
            roadmapHTML += `<li><span class="target">🎯</span> ${gap}</li>`;
        });
    } else {
        roadmapHTML += `<li>Work on advancing your technical skills</li>`;
    }

    roadmapHTML += `
                    </ul>
                </div>
            </div>

            <div class="roadmap-weeks">
                <h3 class="weeks-title">📚 Weekly Learning Plan</h3>
    `;

    // Add 4-week breakdown
    Object.entries(roadmap).forEach(([, weekData], index) => {
        roadmapHTML += `
                <div class="week-card glass-card">
                    <div class="week-header">
                        <h4 class="week-title">Week ${index + 1}: ${weekData.title}</h4>
                        <span class="week-number">${index + 1}/4</span>
                    </div>
                    <ul class="week-topics">
        `;

        weekData.topics.forEach(topic => {
            roadmapHTML += `<li><span class="topic-bullet">→</span> ${topic}</li>`;
        });

        roadmapHTML += `
                    </ul>
                </div>
        `;
    });

    roadmapHTML += `
            </div>

            <div class="roadmap-courses">
                <h3 class="courses-title">🎓 Recommended Courses & Resources</h3>
                <div class="courses-grid">
    `;

    courses.forEach((course, index) => {
        roadmapHTML += `
                    <div class="course-card glass-card">
                        <div class="course-number">${index + 1}</div>
                        <h5 class="course-name">${course}</h5>
                        <p class="course-desc">Comprehensive learning path</p>
                    </div>
        `;
    });

    roadmapHTML += `
                </div>
            </div>

            <div class="roadmap-tips">
                <h3 class="tips-title">💡 Success Tips</h3>
                <ul class="tips-list">
                    <li>Dedicate 5-7 hours per week to learning and practice</li>
                    <li>Build 1-2 small projects each week to reinforce concepts</li>
                    <li>Join communities and practice with peers</li>
                    <li>Review and revise weekly to retain concepts</li>
                    <li>Track your progress and celebrate small wins</li>
                </ul>
            </div>

            <div class="roadmap-actions">
                <button id="btn-back-to-verdict-roadmap" class="btn-secondary">
                    <span class="btn-text">← Back to Verdict</span>
                </button>
                <button id="btn-restart-roadmap" class="btn-secondary">
                    <span class="btn-text">Try Another Resume</span>
                </button>
            </div>
        </div>
    `;

    roadmapContainer.innerHTML = roadmapHTML;

    // Setup button listeners
    document.getElementById('btn-back-to-verdict-roadmap').addEventListener('click', () => {
        roadmapContainer.style.display = 'none';
        document.getElementById('verdict-details').style.display = 'block';
        document.getElementById('btn-take-quiz').style.display = 'block';
    });

    document.getElementById('btn-restart-roadmap').addEventListener('click', restart);

    // Scroll to roadmap
    roadmapContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
