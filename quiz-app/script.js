/**
 * Lumina Quiz Application - Professional Grade
 * Refactored using Modular Namespace Patterns
 */

// =========================================
// 1. Storage Manager
// =========================================
const StorageManager = {
    KEYS: {
        THEME: 'lumina_theme',
        LEADERBOARD: 'lumina_leaderboard',
        SOUND: 'lumina_sound'
    },
    
    saveTheme(isDark) {
        localStorage.setItem(this.KEYS.THEME, isDark ? 'dark' : 'light');
    },
    
    getTheme() {
        return localStorage.getItem(this.KEYS.THEME) || 'light';
    },

    saveSound(isOn) {
        localStorage.setItem(this.KEYS.SOUND, isOn ? 'true' : 'false');
    },

    getSound() {
        return localStorage.getItem(this.KEYS.SOUND) !== 'false'; // default true
    },

    saveScore(scoreData) {
        const board = this.getLeaderboard();
        board.push(scoreData);
        board.sort((a, b) => b.percentage - a.percentage || new Date(b.date) - new Date(a.date));
        const top10 = board.slice(0, 10);
        localStorage.setItem(this.KEYS.LEADERBOARD, JSON.stringify(top10));
    },

    getLeaderboard() {
        try {
            return JSON.parse(localStorage.getItem(this.KEYS.LEADERBOARD)) || [];
        } catch {
            return [];
        }
    }
};

// =========================================
// 2. Audio Manager
// =========================================
const AudioManager = {
    enabled: true,
    elements: {
        correct: document.getElementById('audio-correct'),
        wrong: document.getElementById('audio-wrong'),
        click: document.getElementById('audio-click')
    },

    init() {
        this.enabled = StorageManager.getSound();
        this.updateUI();
        
        document.getElementById('sound-toggle').addEventListener('click', () => {
            this.enabled = !this.enabled;
            StorageManager.saveSound(this.enabled);
            this.updateUI();
            this.play('click');
        });

        // Add ripple logic globally here for buttons
        document.querySelectorAll('.with-ripple').forEach(btn => {
            btn.addEventListener('click', function(e) {
                AudioManager.play('click');
                const x = e.clientX - e.target.getBoundingClientRect().left;
                const y = e.clientY - e.target.getBoundingClientRect().top;
                const ripple = document.createElement('span');
                ripple.classList.add('ripple');
                ripple.style.left = `${x}px`;
                ripple.style.top = `${y}px`;
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        });
    },

    updateUI() {
        const btn = document.getElementById('sound-toggle');
        const onIcon = btn.querySelector('.sound-on-icon');
        const offIcon = btn.querySelector('.sound-off-icon');
        if (this.enabled) {
            onIcon.classList.remove('hidden');
            offIcon.classList.add('hidden');
        } else {
            onIcon.classList.add('hidden');
            offIcon.classList.remove('hidden');
        }
    },

    play(type) {
        if (!this.enabled || !this.elements[type]) return;
        this.elements[type].currentTime = 0;
        this.elements[type].play().catch(e => console.warn('Audio play blocked', e));
    }
};

// =========================================
// 3. Application State
// =========================================
const AppState = {
    questions: [],
    currentQuestionIndex: 0,
    answers: {}, // { id: answer }
    flagged: new Set(), // Set of question IDs
    score: 0,
    
    async loadQuestions() {
        try {
            const res = await fetch('questions.json');
            if (!res.ok) throw new Error('Network response was not ok');
            const data = await res.json();
            this.questions = this.shuffle(data);
            return true;
        } catch (error) {
            console.error("Failed to load questions:", error);
            alert("Unable to load questions. Please ensure you are running on a local server.");
            return false;
        }
    },

    shuffle(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    reset() {
        this.currentQuestionIndex = 0;
        this.answers = {};
        this.flagged.clear();
        this.score = 0;
    },

    toggleFlag() {
        const id = this.getCurrentQuestion().id;
        if (this.flagged.has(id)) this.flagged.delete(id);
        else this.flagged.add(id);
    },

    saveAnswer(answer) {
        this.answers[this.getCurrentQuestion().id] = answer;
    },

    getAnswer() {
        return this.answers[this.getCurrentQuestion().id];
    },

    getCurrentQuestion() {
        return this.questions[this.currentQuestionIndex];
    },

    calculateFinalScore() {
        this.score = 0;
        this.questions.forEach(q => {
            const uAns = this.answers[q.id];
            const cAns = q.answer;
            if (!uAns) return;

            if (q.type === 'mcq' || q.type === 'boolean') {
                if (uAns === cAns) this.score++;
            } else if (q.type === 'multi') {
                if (Array.isArray(uAns) && Array.isArray(cAns) &&
                    uAns.length === cAns.length && 
                    uAns.every(v => cAns.includes(v))) {
                    this.score++;
                }
            } else if (q.type === 'fill') {
                if (uAns.trim().toLowerCase() === cAns.trim().toLowerCase()) {
                    this.score++;
                }
            }
        });
        return this.score;
    }
};

// =========================================
// 4. Timer Manager
// =========================================
const TimerManager = {
    TIME_LIMIT: 30,
    timeLeft: 30,
    interval: null,

    start(onTick, onComplete) {
        this.stop();
        this.timeLeft = this.TIME_LIMIT;
        onTick(this.timeLeft);
        
        this.interval = setInterval(() => {
            this.timeLeft--;
            onTick(this.timeLeft);
            if (this.timeLeft <= 0) {
                this.stop();
                onComplete();
            }
        }, 1000);
    },

    stop() {
        if (this.interval) clearInterval(this.interval);
    }
};

// =========================================
// 5. UI Manager
// =========================================
const UIManager = {
    elements: {
        screens: {
            start: document.getElementById('start-screen'),
            rules: document.getElementById('rules-screen'),
            leaderboard: document.getElementById('leaderboard-screen'),
            quiz: document.getElementById('quiz-screen'),
            result: document.getElementById('result-screen')
        },
        overlay: document.getElementById('loading-overlay'),
        navGrid: document.getElementById('nav-grid'),
        qContainer: document.getElementById('question-container'),
        reviewSection: document.getElementById('review-section')
    },

    init() {
        this.initTheme();
        
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-mode');
            document.body.classList.toggle('light-mode', !isDark);
            StorageManager.saveTheme(isDark);
            AudioManager.play('click');
        });
    },

    initTheme() {
        const isDark = StorageManager.getTheme() === 'dark';
        document.body.classList.toggle('dark-mode', isDark);
        document.body.classList.toggle('light-mode', !isDark);
    },

    hideLoading() {
        this.elements.overlay.classList.remove('active');
    },

    switchScreen(screenKey) {
        Object.values(this.elements.screens).forEach(s => {
            s.classList.remove('active');
            setTimeout(() => s.classList.add('hidden'), 400); // Wait for transition
        });
        
        setTimeout(() => {
            this.elements.screens[screenKey].classList.remove('hidden');
            // Slight delay to trigger CSS transition
            setTimeout(() => this.elements.screens[screenKey].classList.add('active'), 50);
            
            // Set focus for a11y
            const heading = this.elements.screens[screenKey].querySelector('h1, h2');
            if (heading) {
                heading.setAttribute('tabindex', '-1');
                heading.focus();
            }
        }, 400);
    },

    renderGrid() {
        const frag = document.createDocumentFragment();
        AppState.questions.forEach((q, idx) => {
            const btn = document.createElement('button');
            btn.className = 'grid-btn';
            btn.textContent = idx + 1;
            btn.setAttribute('aria-label', `Go to question ${idx + 1}`);
            
            if (idx === AppState.currentQuestionIndex) btn.classList.add('current');
            if (AppState.answers[q.id]) btn.classList.add('answered');
            if (AppState.flagged.has(q.id)) btn.classList.add('flagged');
            
            btn.addEventListener('click', () => {
                AudioManager.play('click');
                GameController.jumpToQuestion(idx);
            });
            frag.appendChild(btn);
        });
        this.elements.navGrid.innerHTML = '';
        this.elements.navGrid.appendChild(frag);
    },

    renderQuestion() {
        const q = AppState.getCurrentQuestion();
        const savedAns = AppState.getAnswer();
        
        // Update Headers
        document.getElementById('question-counter').textContent = `Question ${AppState.currentQuestionIndex + 1} of ${AppState.questions.length}`;
        document.getElementById('progress-bar').style.width = `${((AppState.currentQuestionIndex) / AppState.questions.length) * 100}%`;
        
        // Flag text
        document.getElementById('flag-text').textContent = AppState.flagged.has(q.id) ? 'Unflag' : 'Flag';

        // Prev/Next buttons
        document.getElementById('btn-prev').classList.toggle('hidden', AppState.currentQuestionIndex === 0);
        const isLast = AppState.currentQuestionIndex === AppState.questions.length - 1;
        document.getElementById('btn-next').classList.toggle('hidden', isLast);
        document.getElementById('btn-submit').classList.toggle('hidden', !isLast);

        // Build HTML safely
        let html = `<h3 class="question-text" tabindex="0">${q.question}</h3>`;

        if (q.type === 'mcq' || q.type === 'boolean') {
            const opts = q.type === 'boolean' ? ['True', 'False'] : q.options;
            html += `<div class="options-container ${q.type === 'boolean' ? 'tf-container' : ''}">`;
            opts.forEach((opt, i) => {
                const isSelected = savedAns === opt;
                html += `
                    <label class="option-item ${isSelected ? 'selected' : ''}" tabindex="0" onkeydown="UIManager.handleLabelKeydown(event, this)">
                        <input type="radio" name="q${q.id}" value="${opt}" ${isSelected ? 'checked' : ''} tabindex="-1">
                        <span class="option-label">${opt}</span>
                    </label>
                `;
            });
            html += `</div>`;
        } 
        else if (q.type === 'multi') {
            const savedArr = Array.isArray(savedAns) ? savedAns : [];
            html += `<div class="options-container">`;
            q.options.forEach(opt => {
                const isSelected = savedArr.includes(opt);
                html += `
                    <label class="option-item ${isSelected ? 'selected' : ''}" tabindex="0" onkeydown="UIManager.handleLabelKeydown(event, this)">
                        <input type="checkbox" name="q${q.id}" value="${opt}" ${isSelected ? 'checked' : ''} tabindex="-1">
                        <span class="option-label">${opt}</span>
                    </label>
                `;
            });
            html += `</div>`;
        }
        else if (q.type === 'fill') {
            html += `<input type="text" class="fill-input" id="fill-input-box" placeholder="Type answer..." value="${savedAns || ''}" autocomplete="off">`;
        }

        this.elements.qContainer.innerHTML = html;
        this.attachInputListeners(q.type);
        this.renderGrid(); // update grid state

        // Focus management
        const firstFocusable = this.elements.qContainer.querySelector('input, .option-item, h3');
        if (firstFocusable) firstFocusable.focus();
    },

    attachInputListeners(type) {
        if (type === 'fill') {
            document.getElementById('fill-input-box').addEventListener('input', (e) => {
                AppState.saveAnswer(e.target.value);
                this.renderGrid();
            });
            return;
        }

        const inputs = this.elements.qContainer.querySelectorAll('input');
        inputs.forEach(inp => {
            inp.addEventListener('change', (e) => {
                AudioManager.play('click');
                const label = e.target.closest('.option-item');
                
                if (type === 'multi') {
                    label.classList.toggle('selected', e.target.checked);
                    const checked = Array.from(this.elements.qContainer.querySelectorAll('input:checked')).map(cb => cb.value);
                    AppState.saveAnswer(checked.length ? checked : null);
                } else {
                    this.elements.qContainer.querySelectorAll('.option-item').forEach(l => l.classList.remove('selected'));
                    label.classList.add('selected');
                    AppState.saveAnswer(e.target.value);
                }
                this.renderGrid();
            });
        });
    },

    handleLabelKeydown(e, label) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            label.querySelector('input').click();
        }
    },

    renderLeaderboard() {
        const tbody = document.getElementById('leaderboard-body');
        const board = StorageManager.getLeaderboard();
        
        if (board.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center">No attempts yet. Be the first!</td></tr>`;
            return;
        }

        tbody.innerHTML = board.map((entry, idx) => {
            const date = new Date(entry.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
            return `
                <tr>
                    <td>#${idx + 1}</td>
                    <td>${date}</td>
                    <td>${entry.score}/${entry.maxScore}</td>
                    <td class="font-bold ${entry.percentage >= 80 ? 'text-success' : ''}">${entry.percentage}%</td>
                </tr>
            `;
        }).join('');
    },

    renderResults() {
        const total = AppState.questions.length;
        const score = AppState.calculateFinalScore();
        const percentage = Math.round((score / total) * 100);

        // Save Leaderboard
        StorageManager.saveScore({
            score,
            maxScore: total,
            percentage,
            date: new Date().toISOString()
        });

        document.getElementById('final-score').textContent = score;
        document.getElementById('total-questions-score').textContent = total;
        document.getElementById('correct-count').textContent = score;
        document.getElementById('incorrect-count').textContent = total - score;

        // Animate Circle
        const circle = document.getElementById('score-circle');
        const pctText = document.getElementById('final-percentage');
        pctText.textContent = '0%';
        
        const circumference = 283;
        const offset = circumference - (percentage / 100) * circumference;
        setTimeout(() => circle.style.strokeDashoffset = offset, 100);

        let currentPct = 0;
        const interval = setInterval(() => {
            currentPct += percentage / 50; // smooth steps
            if (currentPct >= percentage) {
                currentPct = percentage;
                clearInterval(interval);
            }
            pctText.textContent = `${Math.round(currentPct)}%`;
        }, 30);

        // Label & Audio
        const labelEl = document.getElementById('performance-label');
        if (percentage >= 80) {
            labelEl.textContent = "Excellent!";
            AudioManager.play('correct');
            ConfettiEngine.trigger();
        } else if (percentage >= 50) {
            labelEl.textContent = "Good Effort!";
            AudioManager.play('correct');
        } else {
            labelEl.textContent = "Keep Practicing";
            AudioManager.play('wrong');
        }

        this.renderReviewList();
    },

    renderReviewList() {
        let html = '';
        AppState.questions.forEach((q, i) => {
            const uAns = AppState.answers[q.id];
            let isCorrect = false;
            let uStr = uAns || 'Not Answered';
            let cStr = q.answer;

            if (q.type === 'multi') {
                uStr = Array.isArray(uAns) ? uAns.join(', ') : 'None';
                cStr = q.answer.join(', ');
                isCorrect = Array.isArray(uAns) && uAns.length === q.answer.length && uAns.every(v => q.answer.includes(v));
            } else if (q.type === 'fill') {
                isCorrect = uAns && uAns.trim().toLowerCase() === q.answer.trim().toLowerCase();
            } else {
                isCorrect = uAns === q.answer;
            }

            html += `
                <div class="review-item ${isCorrect ? 'is-correct' : 'is-incorrect'}" tabindex="0">
                    <div class="review-q">Q${i+1}. ${q.question}</div>
                    <div class="review-a">Your Answer: <span>${uStr}</span></div>
                    ${!isCorrect ? `<div class="review-a">Correct Answer: <span>${cStr}</span></div>` : ''}
                    ${q.explanation ? `<div class="review-explanation">${q.explanation}</div>` : ''}
                </div>
            `;
        });
        document.getElementById('review-list').innerHTML = html;
    }
};

// =========================================
// 6. Game Controller
// =========================================
const GameController = {
    init() {
        AudioManager.init();
        UIManager.init();
        this.bindEvents();
        
        // Fake loading for effect
        setTimeout(() => {
            UIManager.hideLoading();
        }, 1000);
    },

    bindEvents() {
        // Start Screen
        document.getElementById('btn-start').addEventListener('click', () => UIManager.switchScreen('rules'));
        document.getElementById('btn-view-leaderboard').addEventListener('click', () => {
            UIManager.renderLeaderboard();
            UIManager.switchScreen('leaderboard');
        });

        // Rules
        document.getElementById('btn-rules-back').addEventListener('click', () => UIManager.switchScreen('start'));
        document.getElementById('btn-begin').addEventListener('click', () => this.startQuiz());

        // Leaderboard
        document.getElementById('btn-leaderboard-back').addEventListener('click', () => UIManager.switchScreen('start'));

        // Quiz Footer
        document.getElementById('btn-prev').addEventListener('click', () => this.jumpToQuestion(AppState.currentQuestionIndex - 1));
        document.getElementById('btn-next').addEventListener('click', () => this.jumpToQuestion(AppState.currentQuestionIndex + 1));
        document.getElementById('btn-submit').addEventListener('click', () => this.submitQuiz());
        document.getElementById('btn-flag').addEventListener('click', () => {
            AppState.toggleFlag();
            UIManager.renderGrid();
            UIManager.renderQuestion(); // updates flag button text
        });

        // Results
        document.getElementById('btn-play-again').addEventListener('click', () => {
            ConfettiEngine.stop();
            UIManager.switchScreen('start');
        });
        document.getElementById('btn-result-home').addEventListener('click', () => {
            ConfettiEngine.stop();
            UIManager.switchScreen('start');
        });
        
        const reviewToggle = document.getElementById('btn-toggle-review');
        reviewToggle.addEventListener('click', () => {
            const sec = document.getElementById('review-section');
            const isHidden = sec.classList.contains('hidden');
            if (isHidden) {
                sec.classList.remove('hidden');
                reviewToggle.textContent = 'Hide Detailed Review';
                reviewToggle.setAttribute('aria-expanded', 'true');
            } else {
                sec.classList.add('hidden');
                reviewToggle.textContent = 'Show Detailed Review';
                reviewToggle.setAttribute('aria-expanded', 'false');
            }
        });
    },

    async startQuiz() {
        UIManager.elements.overlay.classList.add('active');
        const loaded = await AppState.loadQuestions();
        UIManager.elements.overlay.classList.remove('active');
        
        if (!loaded) return;

        AppState.reset();
        UIManager.switchScreen('quiz');
        this.startQuestion();
    },

    startQuestion() {
        UIManager.renderQuestion();
        TimerManager.start(
            (timeLeft) => {
                const el = document.getElementById('time-left');
                const wrap = document.querySelector('.timer-wrapper');
                el.textContent = `${timeLeft}s`;
                wrap.classList.toggle('danger', timeLeft <= 5);
                if(timeLeft <= 5 && timeLeft > 0) AudioManager.play('click'); // ticking sound logic
            },
            () => {
                // Auto submit or next
                if (AppState.currentQuestionIndex < AppState.questions.length - 1) {
                    this.jumpToQuestion(AppState.currentQuestionIndex + 1);
                } else {
                    this.submitQuiz();
                }
            }
        );
    },

    jumpToQuestion(index) {
        if (index < 0 || index >= AppState.questions.length) return;
        AppState.currentQuestionIndex = index;
        this.startQuestion();
    },

    submitQuiz() {
        TimerManager.stop();
        document.getElementById('progress-bar').style.width = '100%';
        UIManager.renderResults();
        UIManager.switchScreen('result');
    }
};

// =========================================
// 7. Confetti Engine (Lightweight)
// =========================================
const ConfettiEngine = {
    canvas: null,
    ctx: null,
    pieces: [],
    animationId: null,

    trigger() {
        this.canvas = document.getElementById('confetti-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.pieces = [];

        const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#FFEB3B', '#FF9800'];

        for (let i = 0; i < 200; i++) {
            this.pieces.push({
                x: Math.random() * this.canvas.width,
                y: Math.random() * this.canvas.height - this.canvas.height,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * 5 + 2,
                size: Math.random() * 10 + 6,
                color: colors[Math.floor(Math.random() * colors.length)],
                rot: Math.random() * 360,
                rs: Math.random() * 10 - 5
            });
        }
        
        this.render();
        setTimeout(() => this.stop(), 6000);
    },

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        let active = false;

        this.pieces.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.rot += p.rs;
            if (p.y < this.canvas.height) active = true;

            this.ctx.save();
            this.ctx.translate(p.x, p.y);
            this.ctx.rotate(p.rot * Math.PI / 180);
            this.ctx.fillStyle = p.color;
            this.ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
            this.ctx.restore();
        });

        if (active) {
            this.animationId = requestAnimationFrame(() => this.render());
        }
    },

    stop() {
        if (this.animationId) cancelAnimationFrame(this.animationId);
        if (this.ctx) this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }
};

// Bootstrap App
document.addEventListener('DOMContentLoaded', () => {
    GameController.init();
});
