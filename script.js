/**
 * VoicePlan AI - Smart Daily Planner Master JavaScript
 * Web Speech API + Speech-to-Text NLP Extraction Engine + Full Planner Features
 */

// Global State
const state = {
    tasks: [],
    activities: [],
    commandLogs: [],
    currentFilter: 'all',
    searchQuery: '',
    isListening: false,
    selectedCalDate: getTodayString(),
    calMonthOffset: 0,
    language: 'en-IN',
    theme: 'dark'
};

// DOM Elements Registry
const DOM = {};

// Initialize Application on DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    cacheDOMElements();
    loadStateFromStorage();
    initTheme();
    initSpeechRecognition();
    initWaveformCanvas();
    initClock();
    initEventListeners();
    renderAll();
    startCountdownTimerLoop();
});

// Helper: Cache Frequently Used DOM Nodes
function cacheDOMElements() {
    DOM.sidebar = document.getElementById('sidebar');
    DOM.mobileMenuBtn = document.getElementById('mobile-menu-btn');
    DOM.navItems = document.querySelectorAll('.nav-item');
    DOM.views = document.querySelectorAll('.view-panel');
    DOM.themeToggle = document.getElementById('theme-toggle');
    DOM.btnTryDemo = document.getElementById('btn-try-demo');

    // Header & Stats
    DOM.headerDate = document.getElementById('header-date');
    DOM.headerTime = document.getElementById('header-time');
    DOM.statTotal = document.getElementById('stat-total');
    DOM.statCompleted = document.getElementById('stat-completed');
    DOM.statPending = document.getElementById('stat-pending');
    DOM.statHighPriority = document.getElementById('stat-high-priority');

    // Mic & Speech
    DOM.micStatusBadge = document.getElementById('mic-status-badge');
    DOM.micPrompt = document.getElementById('mic-prompt');
    DOM.micWrapper = document.querySelector('.mic-button-wrapper');
    DOM.btnToggleListen = document.getElementById('btn-toggle-listen');
    DOM.btnStartSpeech = document.getElementById('btn-start-speech');
    DOM.btnStopSpeech = document.getElementById('btn-stop-speech');
    DOM.btnClearSpeech = document.getElementById('btn-clear-speech');
    DOM.btnQuickVoice = document.getElementById('btn-quick-voice');
    DOM.transcriptDisplay = document.getElementById('transcript-display');
    DOM.liveIndicator = document.getElementById('live-indicator');
    DOM.waveformCanvas = document.getElementById('waveform-canvas');

    // Extraction Form
    DOM.extractionCard = document.getElementById('extraction-card');
    DOM.extractName = document.getElementById('extract-name');
    DOM.extractDate = document.getElementById('extract-date');
    DOM.extractTime = document.getElementById('extract-time');
    DOM.extractCategory = document.getElementById('extract-category');
    DOM.extractPriority = document.getElementById('extract-priority');
    DOM.btnSaveExtracted = document.getElementById('btn-save-extracted');

    // Search & Filter & Task List
    DOM.taskSearchInput = document.getElementById('task-search-input');
    DOM.filterChips = document.getElementById('filter-chips');
    DOM.timelineContainer = document.getElementById('timeline-container');
    DOM.taskListContainer = document.getElementById('task-list-container');
    DOM.taskListCount = document.getElementById('task-list-count');
    DOM.navTodayCount = document.getElementById('nav-today-count');

    // Progress & Countdown & Suggestions
    DOM.progressCircle = document.getElementById('progress-circle');
    DOM.progressPercent = document.getElementById('progress-percent');
    DOM.progCompleted = document.getElementById('prog-completed');
    DOM.progPending = document.getElementById('prog-pending');
    DOM.progTotal = document.getElementById('prog-total');
    DOM.nextTaskTitle = document.getElementById('next-task-title');
    DOM.nextTaskTime = document.getElementById('next-task-time');
    DOM.countdownTimer = document.getElementById('countdown-timer');
    DOM.suggestionsList = document.getElementById('suggestions-list');
    DOM.commandLogContainer = document.getElementById('command-log-container');

    // Modal
    DOM.taskModal = document.getElementById('task-modal');
    DOM.modalTitle = document.getElementById('modal-title');
    DOM.taskEditId = document.getElementById('task-edit-id');
    DOM.modalTaskName = document.getElementById('modal-task-name');
    DOM.modalTaskDate = document.getElementById('modal-task-date');
    DOM.modalTaskTime = document.getElementById('modal-task-time');
    DOM.modalTaskCategory = document.getElementById('modal-task-category');
    DOM.modalTaskPriority = document.getElementById('modal-task-priority');
    DOM.btnOpenManualModal = document.getElementById('btn-open-manual-modal');
    DOM.btnCloseModal = document.getElementById('btn-close-modal');
    DOM.btnCancelModal = document.getElementById('btn-cancel-modal');
    DOM.manualTaskForm = document.getElementById('manual-task-form');

    // Calendar & Activity & Settings
    DOM.calMonthYear = document.getElementById('cal-month-year');
    DOM.calDaysGrid = document.getElementById('cal-days-grid');
    DOM.calPrevBtn = document.getElementById('cal-prev-btn');
    DOM.calNextBtn = document.getElementById('cal-next-btn');
    DOM.selectedDayTitle = document.getElementById('selected-day-title');
    DOM.selectedDayTasksContainer = document.getElementById('selected-day-tasks-container');
    DOM.activityTimeline = document.getElementById('activity-timeline');
    DOM.btnClearActivity = document.getElementById('btn-clear-activity');
    DOM.settingLang = document.getElementById('setting-lang');
    DOM.btnResetData = document.getElementById('btn-reset-data');
}

// --------------------------------------------------------------------------
// LOCALSTORAGE & STATE MANAGEMENT
// --------------------------------------------------------------------------
function loadStateFromStorage() {
    try {
        const savedTasks = localStorage.getItem('voiceplan_tasks');
        const savedActivities = localStorage.getItem('voiceplan_activities');
        const savedTheme = localStorage.getItem('voiceplan_theme');
        const savedLang = localStorage.getItem('voiceplan_lang');

        if (savedTasks) state.tasks = JSON.parse(savedTasks);
        if (savedActivities) state.activities = JSON.parse(savedActivities);
        if (savedTheme) state.theme = savedTheme;
        if (savedLang) state.language = savedLang;

        // If fresh user with no tasks, offer demo tasks initialization
        if (state.tasks.length === 0) {
            loadDemoTasks(false); // don't log toast on initial load
        }
    } catch (e) {
        console.error('Error loading LocalStorage state:', e);
    }
}

function saveStateToStorage() {
    try {
        localStorage.setItem('voiceplan_tasks', JSON.stringify(state.tasks));
        localStorage.setItem('voiceplan_activities', JSON.stringify(state.activities));
        localStorage.setItem('voiceplan_theme', state.theme);
        localStorage.setItem('voiceplan_lang', state.language);
    } catch (e) {
        console.error('Error saving state to LocalStorage:', e);
    }
}

function logActivity(description) {
    const activity = {
        id: Date.now().toString(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        desc: description
    };
    state.activities.unshift(activity);
    if (state.activities.length > 50) state.activities.pop();
    saveStateToStorage();
    renderActivityLog();
}

function logVoiceCommand(commandText) {
    const entry = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        text: commandText
    };
    state.commandLogs.unshift(entry);
    if (state.commandLogs.length > 20) state.commandLogs.pop();
    renderCommandLog();
}

// --------------------------------------------------------------------------
// THEME & CLOCK ENGINE
// --------------------------------------------------------------------------
function initTheme() {
    document.documentElement.setAttribute('data-theme', state.theme);
}

function toggleTheme() {
    state.theme = state.theme === 'dark' ? 'light' : 'dark';
    initTheme();
    saveStateToStorage();
}

function initClock() {
    updateClockDisplay();
    setInterval(updateClockDisplay, 1000);
}

function updateClockDisplay() {
    const now = new Date();
    const optionsDate = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
    const optionsTime = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true };
    
    if (DOM.headerDate) DOM.headerDate.textContent = now.toLocaleDateString('en-US', optionsDate);
    if (DOM.headerTime) DOM.headerTime.textContent = now.toLocaleTimeString('en-US', optionsTime);
}

// --------------------------------------------------------------------------
// SPEECH RECOGNITION (WEB SPEECH API)
// --------------------------------------------------------------------------
let recognition = null;

function initSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('Web Speech API is not supported in this browser.');
        if (DOM.transcriptDisplay) {
            DOM.transcriptDisplay.innerHTML = `<span style="color: var(--danger-color);">Web Speech API not supported in this browser. You can still add tasks manually or try Demo Mode!</span>`;
        }
        return;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = state.language;

    recognition.onstart = () => {
        state.isListening = true;
        updateMicUI(true);
        startWaveformAnimation();
    };

    recognition.onend = () => {
        state.isListening = false;
        updateMicUI(false);
        stopWaveformAnimation();
    };

    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        state.isListening = false;
        updateMicUI(false);
        stopWaveformAnimation();
    };

    recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            } else {
                interimTranscript += event.results[i][0].transcript;
            }
        }

        const currentText = finalTranscript || interimTranscript;
        if (currentText.trim()) {
            DOM.transcriptDisplay.textContent = currentText;
            
            // Check for direct voice action commands first
            const commandHandled = processVoiceCommands(currentText);

            // If not a pure navigation command, perform smart NLP extraction
            if (!commandHandled) {
                extractAndFillTaskDetails(currentText);
            }
        }
    };
}

function toggleListening() {
    if (!recognition) {
        alert('Web Speech API is not supported in your current browser. Please try Chrome, Edge, or Safari.');
        return;
    }

    if (state.isListening) {
        recognition.stop();
    } else {
        recognition.lang = state.language;
        try {
            recognition.start();
        } catch (e) {
            console.error('Recognition start error:', e);
        }
    }
}

function updateMicUI(isListening) {
    if (isListening) {
        DOM.micStatusBadge.textContent = 'Listening...';
        DOM.micStatusBadge.className = 'mic-status-badge listening';
        DOM.micPrompt.textContent = 'Listening... Speak naturally';
        DOM.micWrapper.classList.add('listening');
        DOM.btnStartSpeech.disabled = true;
        DOM.btnStopSpeech.disabled = false;
        DOM.liveIndicator.classList.remove('hidden');
    } else {
        DOM.micStatusBadge.textContent = 'Idle';
        DOM.micStatusBadge.className = 'mic-status-badge idle';
        DOM.micPrompt.textContent = 'What do you need to do?';
        DOM.micWrapper.classList.remove('listening');
        DOM.btnStartSpeech.disabled = false;
        DOM.btnStopSpeech.disabled = true;
        DOM.liveIndicator.classList.add('hidden');
    }
}

// --------------------------------------------------------------------------
// AUDIO WAVEFORM ANIMATION (HTML5 CANVAS)
// --------------------------------------------------------------------------
let waveformAnimId = null;

function initWaveformCanvas() {
    const canvas = DOM.waveformCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    drawIdleWaveform(ctx, canvas.width, canvas.height);
}

function drawIdleWaveform(ctx, width, height) {
    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = getComputedStyle(document.documentElement).getPropertyValue('--border-color') || '#444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
}

function startWaveformAnimation() {
    const canvas = DOM.waveformCanvas;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let step = 0;

    function animate() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#06b6d4';
        ctx.lineWidth = 2.5;
        ctx.beginPath();

        const width = canvas.width;
        const height = canvas.height;
        const midY = height / 2;

        for (let x = 0; x < width; x++) {
            const angle = (x + step) * 0.05;
            const amp = Math.sin(step * 0.08) * 12 + 4;
            const y = midY + Math.sin(angle) * amp;
            if (x === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        }
        ctx.stroke();
        step += 3;
        waveformAnimId = requestAnimationFrame(animate);
    }

    animate();
}

function stopWaveformAnimation() {
    if (waveformAnimId) {
        cancelAnimationFrame(waveformAnimId);
        waveformAnimId = null;
    }
    initWaveformCanvas();
}

// --------------------------------------------------------------------------
// NATURAL LANGUAGE PROCESSING (NLP) & SMART TASK EXTRACTION
// --------------------------------------------------------------------------

/**
 * Extracts Task Name, Date, Time, Priority, and Category from raw speech transcript
 */
function extractAndFillTaskDetails(rawText) {
    const text = rawText.toLowerCase().trim();

    // 1. Priority Detection
    let priority = 'Medium';
    if (/\b(urgent|urgently|important|asap|must do|critical|emergency|high priority)\b/i.test(text)) {
        priority = 'High';
    } else if (/\b(later|optional|whenever|low priority|someday|if possible)\b/i.test(text)) {
        priority = 'Low';
    }

    // 2. Category Detection
    let category = 'Other';
    if (/\b(study|studying|exam|test|quiz|read|reading|chapter|subject|revision|learn|learning|course|lecture|tutorial)\b/i.test(text)) {
        category = 'Study';
    } else if (/\b(project|code|coding|program|programming|build|app|website|github|repo|bug|feature|developer)\b/i.test(text)) {
        category = 'Project';
    } else if (/\b(college|class|university|professor|lab|seminar|campus|dbms|networks|dsa|os|oops|submission|assignment)\b/i.test(text)) {
        category = 'College';
    } else if (/\b(work|meeting|client|office|presentation|email|report|call|sync|standup|manager)\b/i.test(text)) {
        category = 'Work';
    } else if (/\b(gym|workout|health|exercise|run|running|doctor|meditation|walk|yoga|fitness|water|diet)\b/i.test(text)) {
        category = 'Health';
    } else if (/\b(personal|home|buy|grocery|clean|cleaning|dinner|lunch|breakfast|family|pay|bill|car|shop|shopping)\b/i.test(text)) {
        category = 'Personal';
    }

    // 3. Date Parsing
    let targetDate = getTodayString();
    if (/\btomorrow\b/i.test(text)) {
        targetDate = getOffsetDateString(1);
    } else if (/\bday after tomorrow\b/i.test(text)) {
        targetDate = getOffsetDateString(2);
    }

    // 4. Time Parsing
    let extractedTime = '09:00'; // Default morning time
    
    // Look for explicit time formats like 10 AM, 5 PM, 7:30 PM, at 9, 10:00
    const timeMatch = text.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i) || text.match(/\bat\s*(\d{1,2})(?::(\d{2}))?\b/i);
    
    if (timeMatch) {
        let hour = parseInt(timeMatch[1], 10);
        let min = timeMatch[2] ? parseInt(timeMatch[2], 10) : 0;
        const meridian = timeMatch[3] ? timeMatch[3].toLowerCase() : null;

        if (meridian === 'pm' && hour < 12) hour += 12;
        if (meridian === 'am' && hour === 12) hour = 0;
        
        // If no meridian specified but number between 1 and 7, assume PM in daily context
        if (!meridian && hour >= 1 && hour <= 7) hour += 12;

        const hh = String(hour).padStart(2, '0');
        const mm = String(min).padStart(2, '0');
        extractedTime = `${hh}:${mm}`;
    } else {
        // Keyword relative times
        if (/\b(morning)\b/i.test(text)) extractedTime = '09:00';
        else if (/\b(noon|lunch time)\b/i.test(text)) extractedTime = '12:00';
        else if (/\b(afternoon)\b/i.test(text)) extractedTime = '14:00';
        else if (/\b(evening)\b/i.test(text)) extractedTime = '18:00';
        else if (/\b(night)\b/i.test(text)) extractedTime = '20:00';
    }

    // 5. Task Name Cleaning
    let taskName = rawText;
    // Strip common conversational command phrases
    taskName = taskName.replace(/^(please|can you|i need to|i have to|remind me to|add task|add a task|create task|schedule)\s+/i, '');
    taskName = taskName.replace(/\b(tomorrow|today|day after tomorrow|at \d{1,2}(:\d{2})?\s*(am|pm)?|urgently|important|asap)\b/gi, '');
    taskName = taskName.replace(/\s+/g, ' ').trim();

    // Capitalize first letter
    if (taskName.length > 0) {
        taskName = taskName.charAt(0).toUpperCase() + taskName.slice(1);
    } else {
        taskName = rawText;
    }

    // Fill UI Extraction Form
    DOM.extractName.value = taskName;
    DOM.extractDate.value = targetDate;
    DOM.extractTime.value = extractedTime;
    DOM.extractCategory.value = category;
    DOM.extractPriority.value = priority;
}

// --------------------------------------------------------------------------
// VOICE COMMAND ACTIONS & LOG ENGINE
// --------------------------------------------------------------------------
function processVoiceCommands(rawText) {
    const text = rawText.toLowerCase().trim();

    // 1. Complete Task Command: "Mark [task name] as completed" or "Complete [task name]"
    if (text.startsWith('mark ') || text.startsWith('complete ') || text.includes('as completed')) {
        const targetName = text.replace(/^(mark|complete|task|as|completed|\s)+/g, '').trim();
        if (targetName) {
            const task = state.tasks.find(t => t.title.toLowerCase().includes(targetName));
            if (task && !task.completed) {
                task.completed = true;
                saveStateToStorage();
                logActivity(`Voice Command: Completed task "${task.title}"`);
                logVoiceCommand(`Marked completed: "${task.title}"`);
                renderAll();
                return true;
            }
        }
    }

    // 2. Navigation Commands
    if (text.includes("show today's tasks") || text.includes("show today tasks")) {
        switchView('today-tasks');
        logVoiceCommand("Switched view to Today's Tasks");
        return true;
    }
    if (text.includes("show pending tasks")) {
        setFilter('pending');
        switchView('dashboard');
        logVoiceCommand("Filtered tasks to Pending");
        return true;
    }

    // 3. Delete Task Command: "Delete my project task" / "Delete task [name]"
    if (text.startsWith('delete ')) {
        const targetName = text.replace(/^(delete|my|task|\s)+/g, '').trim();
        if (targetName) {
            const idx = state.tasks.findIndex(t => t.title.toLowerCase().includes(targetName));
            if (idx !== -1) {
                const deletedTitle = state.tasks[idx].title;
                state.tasks.splice(idx, 1);
                saveStateToStorage();
                logActivity(`Voice Command: Deleted task "${deletedTitle}"`);
                logVoiceCommand(`Deleted task: "${deletedTitle}"`);
                renderAll();
                return true;
            }
        }
    }

    return false;
}

// --------------------------------------------------------------------------
// TASK CRUD OPERATIONS
// --------------------------------------------------------------------------
function addTask(taskObj) {
    state.tasks.push(taskObj);
    saveStateToStorage();
    logActivity(`Added task "${taskObj.title}" for ${formatDateReadable(taskObj.date)} at ${formatTimeReadable(taskObj.time)}`);
    renderAll();
}

function updateTask(id, updatedObj) {
    const idx = state.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
        state.tasks[idx] = { ...state.tasks[idx], ...updatedObj };
        saveStateToStorage();
        logActivity(`Updated task "${updatedObj.title}"`);
        renderAll();
    }
}

function toggleTaskComplete(id) {
    const task = state.tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveStateToStorage();
        logActivity(`${task.completed ? 'Completed' : 'Reopened'} task "${task.title}"`);
        renderAll();
    }
}

function deleteTask(id) {
    const idx = state.tasks.findIndex(t => t.id === id);
    if (idx !== -1) {
        const title = state.tasks[idx].title;
        state.tasks.splice(idx, 1);
        saveStateToStorage();
        logActivity(`Deleted task "${title}"`);
        renderAll();
    }
}

// --------------------------------------------------------------------------
// DEMO MODE DATA GENERATOR (SECTION 18 REQUIREMENT)
// --------------------------------------------------------------------------
function loadDemoTasks(showToast = true) {
    const today = getTodayString();
    
    const demoTasks = [
        {
            id: 'demo-1',
            title: 'Computer Networks Study',
            date: today,
            time: '09:00',
            category: 'Study',
            priority: 'Medium',
            completed: false
        },
        {
            id: 'demo-2',
            title: 'Complete Python Program',
            date: today,
            time: '11:00',
            category: 'Project',
            priority: 'High',
            completed: false
        },
        {
            id: 'demo-3',
            title: 'College Project',
            date: today,
            time: '14:00',
            category: 'College',
            priority: 'High',
            completed: false
        },
        {
            id: 'demo-4',
            title: 'Submit Assignment',
            date: today,
            time: '17:00',
            category: 'College',
            priority: 'High',
            completed: false
        },
        {
            id: 'demo-5',
            title: 'Practice Java',
            date: today,
            time: '19:00',
            category: 'Study',
            priority: 'Low',
            completed: false
        }
    ];

    state.tasks = demoTasks;
    saveStateToStorage();
    logActivity('Loaded standard demo dataset');
    renderAll();
    if (showToast) alert('Demo tasks successfully loaded!');
}

// --------------------------------------------------------------------------
// UI RENDERERS & DATA PIPELINES
// --------------------------------------------------------------------------
function renderAll() {
    renderStats();
    renderTimeline();
    renderTaskList();
    renderProgressCircle();
    renderNextTaskCountdown();
    renderPlannerSuggestions();
    renderCalendar();
    renderActivityLog();
    renderCommandLog();
}

// 1. Dashboard Stat Metrics
function renderStats() {
    const today = getTodayString();
    const todayTasks = state.tasks.filter(t => t.date === today);
    const completed = todayTasks.filter(t => t.completed).length;
    const pending = todayTasks.length - completed;
    const highPrio = todayTasks.filter(t => t.priority === 'High' && !t.completed).length;

    DOM.statTotal.textContent = todayTasks.length;
    DOM.statCompleted.textContent = completed;
    DOM.statPending.textContent = pending;
    DOM.statHighPriority.textContent = highPrio;

    DOM.navTodayCount.textContent = todayTasks.length;
}

// 2. Daily Timeline Renderer (Section 4 Requirement)
function renderTimeline() {
    const today = getTodayString();
    const todayTasks = state.tasks
        .filter(t => t.date === today)
        .sort((a, b) => a.time.localeCompare(b.time));

    DOM.timelineContainer.innerHTML = '';

    if (todayTasks.length === 0) {
        DOM.timelineContainer.innerHTML = `<div class="empty-state">No scheduled tasks for today timeline yet.</div>`;
        return;
    }

    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    todayTasks.forEach(task => {
        let status = 'upcoming';
        let statusLabel = 'Upcoming';

        if (task.completed) {
            status = 'completed';
            statusLabel = 'Completed';
        } else if (task.time < currentHHMM) {
            status = 'overdue';
            statusLabel = 'Overdue';
        } else if (isTimeInRange(task.time, currentHHMM)) {
            status = 'in_progress';
            statusLabel = 'In Progress';
        }

        const item = document.createElement('div');
        item.className = `timeline-item status-${status}`;
        item.innerHTML = `
            <div class="timeline-time">${formatTimeReadable(task.time)}</div>
            <div class="timeline-axis">
                <div class="timeline-dot"></div>
                <div class="timeline-line"></div>
            </div>
            <div class="timeline-content">
                <div class="timeline-info">
                    <h4>${escapeHTML(task.title)}</h4>
                    <div class="timeline-meta">
                        <span class="cat-badge">${getCategoryEmoji(task.category)} ${task.category}</span>
                        <span class="prio-badge prio-${task.priority.toLowerCase()}">${task.priority}</span>
                    </div>
                </div>
                <span class="timeline-status-badge status-badge-${status}">${statusLabel}</span>
            </div>
        `;
        DOM.timelineContainer.appendChild(item);
    });
}

// Helper: Check if task time is within current hour slot
function isTimeInRange(taskTime, nowTime) {
    const taskHour = parseInt(taskTime.split(':')[0], 10);
    const nowHour = parseInt(nowTime.split(':')[0], 10);
    return taskHour === nowHour;
}

// 3. Smart Task List Renderer (Section 8 Requirement)
function renderTaskList() {
    let filtered = [...state.tasks];

    // Apply Search Query
    if (state.searchQuery) {
        const q = state.searchQuery.toLowerCase();
        filtered = filtered.filter(t => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
    }

    // Apply Filter Chips
    const f = state.currentFilter;
    if (f === 'pending') filtered = filtered.filter(t => !t.completed);
    else if (f === 'completed') filtered = filtered.filter(t => t.completed);
    else if (f === 'High') filtered = filtered.filter(t => t.priority === 'High');
    else if (['Study', 'Project', 'College', 'Work', 'Personal', 'Health'].includes(f)) {
        filtered = filtered.filter(t => t.category === f);
    }

    // Sort chronologically
    filtered.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));

    DOM.taskListContainer.innerHTML = '';
    DOM.taskListCount.textContent = `${filtered.length} tasks`;

    if (filtered.length === 0) {
        DOM.taskListContainer.innerHTML = `<div class="empty-state">No matching tasks found.</div>`;
        return;
    }

    filtered.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-item ${task.completed ? 'completed' : ''}`;
        card.innerHTML = `
            <div class="task-left">
                <div class="task-checkbox" onclick="toggleTaskComplete('${task.id}')">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>
                </div>
                <div class="task-details">
                    <span class="task-title">${escapeHTML(task.title)}</span>
                    <div class="task-tags">
                        <span class="task-time-tag">📅 ${formatDateReadable(task.date)} • 🕒 ${formatTimeReadable(task.time)}</span>
                        <span class="cat-badge">${getCategoryEmoji(task.category)} ${task.category}</span>
                        <span class="prio-badge prio-${task.priority.toLowerCase()}">${task.priority}</span>
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="task-action-btn edit-btn" onclick="openEditModal('${task.id}')" title="Edit Task">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button class="task-action-btn delete-btn" onclick="deleteTask('${task.id}')" title="Delete Task">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
            </div>
        `;
        DOM.taskListContainer.appendChild(card);
    });
}

// 4. Progress Ring Calculation (Section 9 Requirement)
function renderProgressCircle() {
    const today = getTodayString();
    const todayTasks = state.tasks.filter(t => t.date === today);
    const total = todayTasks.length;
    const completed = todayTasks.filter(t => t.completed).length;
    const pending = total - completed;
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;

    DOM.progressPercent.textContent = `${percent}%`;
    DOM.progCompleted.textContent = completed;
    DOM.progPending.textContent = pending;
    DOM.progTotal.textContent = total;

    // Donut ring SVG circumference = 2 * PI * r = 2 * 3.14159 * 52 ≈ 326.7
    const circumference = 326.7;
    const offset = circumference - (percent / 100) * circumference;
    DOM.progressCircle.style.strokeDasharray = `${circumference} ${circumference}`;
    DOM.progressCircle.style.strokeDashoffset = offset;
}

// 5. Next Task & Live Countdown Engine (Section 10 Requirement)
function startCountdownTimerLoop() {
    renderNextTaskCountdown();
    setInterval(renderNextTaskCountdown, 1000);
}

function renderNextTaskCountdown() {
    const today = getTodayString();
    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Find next pending task for today with time >= now
    const upcomingToday = state.tasks
        .filter(t => t.date === today && !t.completed && t.time >= currentHHMM)
        .sort((a, b) => a.time.localeCompare(b.time))[0];

    if (!upcomingToday) {
        DOM.nextTaskTitle.textContent = "All tasks complete!";
        DOM.nextTaskTime.textContent = "No further scheduled tasks today";
        DOM.countdownTimer.textContent = "00h 00m 00s";
        return;
    }

    DOM.nextTaskTitle.textContent = upcomingToday.title;
    DOM.nextTaskTime.textContent = `Today • ${formatTimeReadable(upcomingToday.time)}`;

    // Compute remaining time delta
    const [taskH, taskM] = upcomingToday.time.split(':').map(Number);
    const targetDate = new Date();
    targetDate.setHours(taskH, taskM, 0, 0);

    let diffMs = targetDate - now;
    if (diffMs < 0) diffMs = 0;

    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    const diffSecs = Math.floor((diffMs % (1000 * 60)) / 1000);

    const pad = n => String(n).padStart(2, '0');
    DOM.countdownTimer.textContent = `${pad(diffHours)}h ${pad(diffMins)}m ${pad(diffSecs)}s`;
}

// 6. Smart Planner Suggestions & Conflict Detector (Section 11 Requirement)
function renderPlannerSuggestions() {
    const today = getTodayString();
    const todayTasks = state.tasks.filter(t => t.date === today);
    const suggestions = [];

    // Conflict detection: Same date + time overlap
    const timeMap = {};
    todayTasks.forEach(t => {
        timeMap[t.time] = (timeMap[t.time] || 0) + 1;
    });

    Object.keys(timeMap).forEach(timeSlot => {
        if (timeMap[timeSlot] > 1) {
            suggestions.push({
                type: 'warning',
                text: `⚠️ Your ${formatTimeReadable(timeSlot)} schedule has overlapping tasks!`
            });
        }
    });

    // Category insights
    const studyCount = todayTasks.filter(t => t.category === 'Study').length;
    if (studyCount > 0) {
        suggestions.push({
            type: 'info',
            text: `💡 You have ${studyCount} study task${studyCount > 1 ? 's' : ''} scheduled today.`
        });
    }

    // Morning tasks check (before 12 PM)
    const morningTasks = todayTasks.filter(t => t.time < '12:00');
    if (morningTasks.length > 0 && morningTasks.every(t => t.completed)) {
        suggestions.push({
            type: 'info',
            text: `✅ Fantastic! You completed all morning tasks.`
        });
    }

    // Overdue check
    const now = new Date();
    const currentHHMM = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    const overdueCount = todayTasks.filter(t => !t.completed && t.time < currentHHMM).length;
    if (overdueCount > 0) {
        suggestions.push({
            type: 'warning',
            text: `🚨 You have ${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} today.`
        });
    }

    if (suggestions.length === 0) {
        suggestions.push({
            type: 'info',
            text: `💡 Your daily schedule is well balanced with no conflict.`
        });
    }

    DOM.suggestionsList.innerHTML = suggestions.map(s => `
        <div class="suggestion-item ${s.type}">
            <span>${s.text}</span>
        </div>
    `).join('');
}

// 7. Interactive Calendar View (Section 12 Requirement)
function renderCalendar() {
    if (!DOM.calDaysGrid) return;

    const baseDate = new Date();
    baseDate.setMonth(baseDate.getMonth() + state.calMonthOffset);
    
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    DOM.calMonthYear.textContent = `${monthNames[month]} ${year}`;

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const prevMonthTotalDays = new Date(year, month, 0).getDate();

    DOM.calDaysGrid.innerHTML = '';

    // Render Previous Month Padding Days
    for (let x = firstDayIndex; x > 0; x--) {
        const dayNum = prevMonthTotalDays - x + 1;
        const cell = document.createElement('div');
        cell.className = 'cal-day-cell other-month';
        cell.innerHTML = `<span class="cal-day-num">${dayNum}</span>`;
        DOM.calDaysGrid.appendChild(cell);
    }

    // Render Current Month Days
    const todayStr = getTodayString();
    for (let i = 1; i <= totalDays; i++) {
        const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
        const dayTasks = state.tasks.filter(t => t.date === dateStr);

        const cell = document.createElement('div');
        cell.className = `cal-day-cell ${dateStr === todayStr ? 'today' : ''} ${dateStr === state.selectedCalDate ? 'selected' : ''}`;
        
        let dotsHTML = '';
        if (dayTasks.length > 0) {
            dotsHTML = `<div class="cal-task-dots">${dayTasks.map(() => '<span class="cal-dot"></span>').join('')}</div>`;
        }

        cell.innerHTML = `
            <span class="cal-day-num">${i}</span>
            ${dotsHTML}
        `;

        cell.addEventListener('click', () => {
            state.selectedCalDate = dateStr;
            renderCalendar();
            renderSelectedDayTasks();
        });

        DOM.calDaysGrid.appendChild(cell);
    }

    renderSelectedDayTasks();
}

function renderSelectedDayTasks() {
    if (!DOM.selectedDayTasksContainer) return;
    DOM.selectedDayTitle.textContent = `Tasks for ${formatDateReadable(state.selectedCalDate)}`;

    const dayTasks = state.tasks.filter(t => t.date === state.selectedCalDate);
    DOM.selectedDayTasksContainer.innerHTML = '';

    if (dayTasks.length === 0) {
        DOM.selectedDayTasksContainer.innerHTML = `<div class="empty-state">No tasks scheduled for this date.</div>`;
        return;
    }

    dayTasks.forEach(task => {
        const div = document.createElement('div');
        div.className = `task-item ${task.completed ? 'completed' : ''}`;
        div.innerHTML = `
            <div class="task-left">
                <div class="task-details">
                    <span class="task-title">${escapeHTML(task.title)}</span>
                    <div class="task-tags">
                        <span class="task-time-tag">🕒 ${formatTimeReadable(task.time)}</span>
                        <span class="cat-badge">${getCategoryEmoji(task.category)} ${task.category}</span>
                        <span class="prio-badge prio-${task.priority.toLowerCase()}">${task.priority}</span>
                    </div>
                </div>
            </div>
        `;
        DOM.selectedDayTasksContainer.appendChild(div);
    });
}

// 8. Activity Log Renderer (Section 14 Requirement)
function renderActivityLog() {
    if (!DOM.activityTimeline) return;
    if (state.activities.length === 0) {
        DOM.activityTimeline.innerHTML = `<div class="empty-state">No recent activity logged yet.</div>`;
        return;
    }

    DOM.activityTimeline.innerHTML = state.activities.map(act => `
        <div class="activity-item">
            <span class="activity-time">${act.time}</span>
            <span class="activity-desc">${escapeHTML(act.desc)}</span>
        </div>
    `).join('');
}

// 9. Voice Command Log Renderer (Section 7 Requirement)
function renderCommandLog() {
    if (!DOM.commandLogContainer) return;
    if (state.commandLogs.length === 0) {
        DOM.commandLogContainer.innerHTML = `<div class="empty-log">No voice commands detected yet. Speak commands like <em>"Mark Python as completed"</em> or <em>"Show pending tasks"</em>.</div>`;
        return;
    }

    DOM.commandLogContainer.innerHTML = state.commandLogs.map(log => `
        <div class="log-entry">
            <span class="log-time">${log.time}</span>
            <span class="log-text">${escapeHTML(log.text)}</span>
        </div>
    `).join('');
}

// --------------------------------------------------------------------------
// MODAL CONTROLLER & EVENT LISTENERS
// --------------------------------------------------------------------------
function initEventListeners() {
    // Mobile Sidebar Toggle
    DOM.mobileMenuBtn?.addEventListener('click', () => {
        DOM.sidebar.classList.toggle('mobile-open');
    });

    // Sidebar View Navigation
    DOM.navItems.forEach(item => {
        item.addEventListener('click', () => {
            DOM.navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            switchView(item.dataset.view);
            DOM.sidebar.classList.remove('mobile-open');
        });
    });

    // Theme Toggle
    DOM.themeToggle?.addEventListener('click', toggleTheme);

    // Speech Controls
    DOM.btnToggleListen?.addEventListener('click', toggleListening);
    DOM.btnStartSpeech?.addEventListener('click', toggleListening);
    DOM.btnStopSpeech?.addEventListener('click', toggleListening);
    DOM.btnQuickVoice?.addEventListener('click', () => {
        switchView('dashboard');
        toggleListening();
    });

    DOM.btnClearSpeech?.addEventListener('click', () => {
        DOM.transcriptDisplay.innerHTML = `<span class="placeholder-text">Speak naturally into your microphone...</span>`;
        DOM.extractName.value = '';
    });

    // Confirm & Save Extracted Task
    DOM.btnSaveExtracted?.addEventListener('click', () => {
        const title = DOM.extractName.value.trim();
        if (!title) {
            alert('Please speak or type a valid task name first.');
            return;
        }

        const newTask = {
            id: Date.now().toString(),
            title: title,
            date: DOM.extractDate.value || getTodayString(),
            time: DOM.extractTime.value || '09:00',
            category: DOM.extractCategory.value,
            priority: DOM.extractPriority.value,
            completed: false
        };

        addTask(newTask);
        DOM.transcriptDisplay.innerHTML = `<span class="placeholder-text">Task saved! Speak another task...</span>`;
        DOM.extractName.value = '';
    });

    // Search Input Filter
    DOM.taskSearchInput?.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderTaskList();
    });

    // Filter Chips
    DOM.filterChips?.addEventListener('click', (e) => {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        DOM.filterChips.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        setFilter(chip.dataset.filter);
    });

    // Manual Modal Handlers
    DOM.btnOpenManualModal?.addEventListener('click', () => openManualModal());
    DOM.btnCloseModal?.addEventListener('click', closeTaskModal);
    DOM.btnCancelModal?.addEventListener('click', closeTaskModal);

    DOM.manualTaskForm?.addEventListener('submit', (e) => {
        e.preventDefault();
        const editId = DOM.taskEditId.value;
        const taskObj = {
            title: DOM.modalTaskName.value.trim(),
            date: DOM.modalTaskDate.value,
            time: DOM.modalTaskTime.value,
            category: DOM.modalTaskCategory.value,
            priority: DOM.modalTaskPriority.value,
            completed: false
        };

        if (editId) {
            updateTask(editId, taskObj);
        } else {
            taskObj.id = Date.now().toString();
            addTask(taskObj);
        }
        closeTaskModal();
    });

    // Try Demo Button
    DOM.btnTryDemo?.addEventListener('click', () => loadDemoTasks(true));

    // Calendar Month Controls
    DOM.calPrevBtn?.addEventListener('click', () => {
        state.calMonthOffset--;
        renderCalendar();
    });

    DOM.calNextBtn?.addEventListener('click', () => {
        state.calMonthOffset++;
        renderCalendar();
    });

    // Clear Activity History
    DOM.btnClearActivity?.addEventListener('click', () => {
        state.activities = [];
        saveStateToStorage();
        renderActivityLog();
    });

    // Reset Data
    DOM.btnResetData?.addEventListener('click', () => {
        if (confirm('Are you sure you want to delete all tasks and settings?')) {
            localStorage.clear();
            state.tasks = [];
            state.activities = [];
            saveStateToStorage();
            renderAll();
            alert('All data has been reset.');
        }
    });

    // Language Change Setting
    DOM.settingLang?.addEventListener('change', (e) => {
        state.language = e.target.value;
        if (recognition) recognition.lang = state.language;
        saveStateToStorage();
    });
}

function switchView(viewName) {
    DOM.views.forEach(v => v.classList.remove('active'));

    const target = document.getElementById(`view-${viewName}`);
    if (target) {
        target.classList.add('active');
    } else {
        document.getElementById('view-dashboard').classList.add('active');
    }

    // Synchronize active nav button
    DOM.navItems.forEach(item => {
        if (item.dataset.view === viewName) item.classList.add('active');
        else item.classList.remove('active');
    });
}

function setFilter(filterVal) {
    state.currentFilter = filterVal;
    renderTaskList();
}

function openManualModal() {
    DOM.modalTitle.textContent = 'Add New Task';
    DOM.taskEditId.value = '';
    DOM.modalTaskName.value = '';
    DOM.modalTaskDate.value = getTodayString();
    DOM.modalTaskTime.value = '09:00';
    DOM.modalTaskCategory.value = 'Study';
    DOM.modalTaskPriority.value = 'Medium';
    DOM.taskModal.classList.add('active');
}

function openEditModal(id) {
    const task = state.tasks.find(t => t.id === id);
    if (!task) return;

    DOM.modalTitle.textContent = 'Edit Task';
    DOM.taskEditId.value = task.id;
    DOM.modalTaskName.value = task.title;
    DOM.modalTaskDate.value = task.date;
    DOM.modalTaskTime.value = task.time;
    DOM.modalTaskCategory.value = task.category;
    DOM.modalTaskPriority.value = task.priority;
    DOM.taskModal.classList.add('active');
}

function closeTaskModal() {
    DOM.taskModal.classList.remove('active');
}

// --------------------------------------------------------------------------
// UTILITY HELPERS
// --------------------------------------------------------------------------
function getTodayString() {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function getOffsetDateString(offsetDays) {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function formatDateReadable(dateStr) {
    if (!dateStr) return '';
    const [y, m, d] = dateStr.split('-');
    const dt = new Date(y, m - 1, d);
    return dt.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatTimeReadable(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

function getCategoryEmoji(cat) {
    const map = {
        'Study': '📚',
        'Project': '💻',
        'College': '🏫',
        'Work': '💼',
        'Personal': '🏠',
        'Health': '🏃',
        'Other': '🎯'
    };
    return map[cat] || '🎯';
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}
