let sessionTimer = {
    startTime: null,
    elapsedTime: 0,
    timerInterval: null,
    isRunning: false,
    totalSessionTime: 2 * 60 * 60 * 1000 // 2 hours in milliseconds
};

let sessionData = {
    user: '',
    wwid: '',
    email: '',
    date: '',
    slot: '',
    registeredGame: '',
    registrationId: '',
    gameTasks: {}, // Enhanced structure with screenshots and completion
    startTime: null,
    lastUpdated: null,
    activeGameTask: null // Track currently active game
};

let currentUser = null;
let gameTimers = {};

document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
});

function setupEventListeners() {
    document.getElementById('searchBtn').addEventListener('click', searchUserSessions);
    document.getElementById('userSearch').addEventListener('keypress', function (e) {
        if (e.key === 'Enter') {
            searchUserSessions();
        }
    });

    document.getElementById('startTimer').addEventListener('click', startTimer);
    document.getElementById('pauseTimer').addEventListener('click', pauseTimer);
    document.getElementById('resetTimer').addEventListener('click', resetTimer);
    document.getElementById('addGameTask').addEventListener('click', addGameTask);
}

function searchUserSessions() {
    const searchTerm = document.getElementById('userSearch').value.trim().toLowerCase();
    if (!searchTerm) {
        alert('Please enter your WWID or Email ID');
        return;
    }

    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const userSessions = registrations.filter(reg =>
        reg.wwid.toLowerCase() === searchTerm ||
        reg.email.toLowerCase() === searchTerm
    );

    displaySearchResults(userSessions);
}

function displaySearchResults(sessions) {
    const searchResults = document.getElementById('searchResults');
    const sessionsList = document.getElementById('sessionsList');

    if (sessions.length === 0) {
        searchResults.style.display = 'block';
        sessionsList.innerHTML = '<p style="text-align: center; color: #666; font-style: italic; padding: 20px;">No sessions found for this WWID/Email. Please check your input.</p>';
        return;
    }

    searchResults.style.display = 'block';
    sessionsList.innerHTML = '';

    sessions.forEach(session => {
        const sessionCard = document.createElement('div');
        sessionCard.style.cssText = `
            background: linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%);
            border: 1px solid #e9ecef;
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 15px;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: all 0.3s ease;
        `;

        const sessionDate = new Date(session.date).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        sessionCard.innerHTML = `
            <div>
                <h5 style="color: #333; margin-bottom: 10px; font-size: 1.2em;">${session.name}</h5>
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;"><strong>Date:</strong> ${sessionDate}</p>
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;"><strong>Time:</strong> ${session.slot}</p>
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;"><strong>Registered Game:</strong> ${session.gamePreference}</p>
                <p style="margin: 5px 0; color: #666; font-size: 0.9em;"><strong>Registration ID:</strong> ${session.registrationId}</p>
            </div>
            <button onclick="loadUserSession('${session.registrationId}')" style="
                padding: 10px 20px;
                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                color: white;
                border: none;
                border-radius: 6px;
                cursor: pointer;
                font-weight: 600;
                transition: all 0.3s ease;
            ">Load Session</button>
        `;

        sessionCard.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-3px)';
            this.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.15)';
        });

        sessionCard.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });

        sessionsList.appendChild(sessionCard);
    });
}

function loadUserSession(registrationId) {
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const selectedSession = registrations.find(reg => reg.registrationId === registrationId);

    if (!selectedSession) {
        alert('Session not found!');
        return;
    }

    currentUser = selectedSession;

    // Initialize session data
    sessionData.user = selectedSession.name;
    sessionData.wwid = selectedSession.wwid;
    sessionData.email = selectedSession.email;
    sessionData.date = selectedSession.date;
    sessionData.slot = selectedSession.slot;
    sessionData.registeredGame = selectedSession.gamePreference;
    sessionData.registrationId = selectedSession.registrationId;
    sessionData.startTime = new Date();

    // Update session header
    document.getElementById('sessionUserName').textContent = selectedSession.name;
    document.getElementById('sessionDateTime').textContent = `${selectedSession.dateFormatted} | ${selectedSession.slot}`;
    document.getElementById('registeredGame').textContent = selectedSession.gamePreference;

    // Show session form and hide search
    document.getElementById('sessionForm').style.display = 'block';
    document.getElementById('searchResults').style.display = 'none';
    document.getElementById('userSearch').value = '';

    // Load existing session data if available
    loadExistingSessionData();
    updateOverallSummary();
}

function addGameTask() {
    const gameSelector = document.getElementById('gameSelector');
    const selectedGame = gameSelector.value;

    if (!selectedGame) {
        alert('Please select a game first!');
        return;
    }

    // Check if there's already an active game task
    if (sessionData.activeGameTask) {
        alert(`Please complete the current game task "${sessionData.activeGameTask}" before starting a new one.`);
        return;
    }

    // Check if task for this game already exists
    if (sessionData.gameTasks[selectedGame]) {
        alert('A task for this game already exists!');
        return;
    }

    // Create new game task with enhanced structure
    const gameTask = {
        game: selectedGame,
        startTime: new Date().toISOString(),
        crashes: 0,
        observations: [],
        isActive: true,
        completionPercentage: 0,
        screenshots: [], // Array to store screenshot data
        totalPlayTime: 0,
        gameStartTime: null,
        gameEndTime: null
    };

    sessionData.gameTasks[selectedGame] = gameTask;
    sessionData.activeGameTask = selectedGame;
    
    createEnhancedGameTaskCard(gameTask);
    updateActiveGames();
    saveSessionData();
    updateOverallSummary();

    // Reset selector
    gameSelector.value = '';
}

function createEnhancedGameTaskCard(gameTask) {
    const gameTasksContainer = document.getElementById('gameTasksContainer');

    const taskCard = document.createElement('div');
    taskCard.className = 'log-section';
    taskCard.id = `task-${gameTask.game.replace(/\s+/g, '_')}`;

    taskCard.innerHTML = `
        <h4>🎮 ${gameTask.game} ${gameTask.isActive ? '(Active - Currently Playing)' : '(Completed)'}</h4>
        
        ${gameTask.isActive ? `
        <div class="game-timer-section" style="background: #e8f5e8; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #28a745;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>Game Play Time:</strong> <span id="gameTimer-${gameTask.game.replace(/\s+/g, '_')}">00:00:00</span>
                </div>
                <div>
                    <button onclick="startGameTimer('${gameTask.game}')" id="startGameBtn-${gameTask.game.replace(/\s+/g, '_')}" class="timer-btn">Start Playing</button>
                    <button onclick="pauseGameTimer('${gameTask.game}')" id="pauseGameBtn-${gameTask.game.replace(/\s+/g, '_')}" class="timer-btn" disabled>Pause Game</button>
                </div>
            </div>
        </div>
        ` : ''}
        
        <div class="performance-grid">
            <div class="perf-item">
                <label>Crashes/Issues:</label>
                <input type="number" id="crashes-${gameTask.game.replace(/\s+/g, '_')}" min="0" value="${gameTask.crashes}" readonly>
                <button onclick="addGameCrash('${gameTask.game}')" class="log-btn" ${!gameTask.isActive ? 'disabled' : ''}>+1 Issue</button>
            </div>
            
            <div class="perf-item">
                <label>Completion %:</label>
                <input type="number" id="completion-${gameTask.game.replace(/\s+/g, '_')}" min="0" max="100" value="${gameTask.completionPercentage}" ${!gameTask.isActive ? 'readonly' : ''}>
                <button onclick="updateCompletion('${gameTask.game}')" class="log-btn" ${!gameTask.isActive ? 'disabled' : ''}>Update</button>
            </div>
        </div>
        
        <div class="screenshot-section" style="margin: 20px 0;">
            <h5>Game Progress Screenshots</h5>
            ${gameTask.isActive ? `
            <div class="screenshot-upload" style="margin-bottom: 15px;">
                <input type="file" id="screenshot-${gameTask.game.replace(/\s+/g, '_')}" accept="image/*" style="margin-bottom: 10px;">
                <button onclick="uploadScreenshot('${gameTask.game}')" class="log-btn">Upload Progress Screenshot</button>
            </div>
            ` : ''}
            <div class="screenshots-gallery" id="screenshots-${gameTask.game.replace(/\s+/g, '_')}">
                ${displayScreenshots(gameTask.screenshots)}
            </div>
        </div>
        
        <div class="notes-area">
            <h5>Game-Specific Observations</h5>
            <textarea id="obs-${gameTask.game.replace(/\s+/g, '_')}" placeholder="Record performance, FPS, crashes, or any game-specific notes..." ${!gameTask.isActive ? 'disabled' : ''}></textarea>
            <button onclick="saveGameObservation('${gameTask.game}')" class="log-btn" ${!gameTask.isActive ? 'disabled' : ''}>Save Note</button>
        </div>
        
        <div class="saved-notes" id="saved-obs-${gameTask.game.replace(/\s+/g, '_')}"></div>
        
        ${gameTask.isActive ? `
        <div class="game-completion-section" style="margin-top: 20px; padding: 15px; background: #fff3cd; border-radius: 8px; border-left: 4px solid #ffc107;">
            <h5>Complete Game Task</h5>
            <p>Make sure to update completion percentage and upload final screenshot before completing.</p>
            <button onclick="completeGameTask('${gameTask.game}')" class="admin-btn" style="margin-top: 10px;">Complete Game Task</button>
        </div>
        ` : `
        <div class="game-summary" style="margin-top: 20px; padding: 15px; background: #d1ecf1; border-radius: 8px; border-left: 4px solid #17a2b8;">
            <h5>Game Summary</h5>
            <p><strong>Total Play Time:</strong> ${formatTime(gameTask.totalPlayTime)}</p>
            <p><strong>Completion:</strong> ${gameTask.completionPercentage}%</p>
            <p><strong>Screenshots:</strong> ${gameTask.screenshots.length}</p>
            <p><strong>Issues Found:</strong> ${gameTask.crashes}</p>
        </div>
        `}
    `;

    gameTasksContainer.appendChild(taskCard);
    displayGameObservations(gameTask.game);
    
    // Start game timer interval if active
    if (gameTask.isActive && gameTask.gameStartTime) {
        startGameTimerInterval(gameTask.game);
    }
}

// Game timer functions
window.startGameTimer = function(gameName) {
    const gameTask = sessionData.gameTasks[gameName];
    if (!gameTask || !gameTask.isActive) return;
    
    gameTask.gameStartTime = Date.now();
    startGameTimerInterval(gameName);
    
    document.getElementById(`startGameBtn-${gameName.replace(/\s+/g, '_')}`).disabled = true;
    document.getElementById(`pauseGameBtn-${gameName.replace(/\s+/g, '_')}`).disabled = false;
    
    saveSessionData();
};

window.pauseGameTimer = function(gameName) {
    const gameTask = sessionData.gameTasks[gameName];
    if (!gameTask || !gameTask.isActive) return;
    
    if (gameTask.gameStartTime) {
        gameTask.totalPlayTime += Date.now() - gameTask.gameStartTime;
        gameTask.gameStartTime = null;
    }
    
    clearInterval(gameTimers[gameName]);
    
    document.getElementById(`startGameBtn-${gameName.replace(/\s+/g, '_')}`).disabled = false;
    document.getElementById(`pauseGameBtn-${gameName.replace(/\s+/g, '_')}`).disabled = true;
    
    saveSessionData();
};

function startGameTimerInterval(gameName) {
    gameTimers[gameName] = setInterval(() => {
        updateGameTimerDisplay(gameName);
    }, 1000);
}

function updateGameTimerDisplay(gameName) {
    const gameTask = sessionData.gameTasks[gameName];
    if (!gameTask) return;
    
    let currentPlayTime = gameTask.totalPlayTime;
    if (gameTask.gameStartTime) {
        currentPlayTime += Date.now() - gameTask.gameStartTime;
    }
    
    const timerElement = document.getElementById(`gameTimer-${gameName.replace(/\s+/g, '_')}`);
    if (timerElement) {
        timerElement.textContent = formatTime(currentPlayTime);
    }
}

function formatTime(milliseconds) {
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Screenshot functions
window.uploadScreenshot = function(gameName) {
    const fileInput = document.getElementById(`screenshot-${gameName.replace(/\s+/g, '_')}`);
    const file = fileInput.files[0];
    
    if (!file) {
        alert('Please select a screenshot file first!');
        return;
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Screenshot file size should be less than 5MB!');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const gameTask = sessionData.gameTasks[gameName];
        const screenshot = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            dataUrl: e.target.result,
            filename: file.name,
            completionAtTime: gameTask.completionPercentage
        };
        
        gameTask.screenshots.push(screenshot);
        
        // Update screenshots display
        const screenshotsContainer = document.getElementById(`screenshots-${gameName.replace(/\s+/g, '_')}`);
        screenshotsContainer.innerHTML = displayScreenshots(gameTask.screenshots);
        
        // Clear file input
        fileInput.value = '';
        
        saveSessionData();
        updateOverallSummary();
        alert('Screenshot uploaded successfully!');
    };
    
    reader.readAsDataURL(file);
};

function displayScreenshots(screenshots) {
    if (!screenshots || screenshots.length === 0) {
        return '<p style="color: #666; font-style: italic; text-align: center;">No screenshots uploaded yet</p>';
    }
    
    return screenshots.map(screenshot => `
        <div class="screenshot-item" style="display: inline-block; margin: 10px; text-align: center; border: 1px solid #ddd; border-radius: 8px; padding: 10px; background: white; transition: all 0.3s ease;">
            <img src="${screenshot.dataUrl}" alt="Game Progress" style="max-width: 150px; max-height: 100px; border-radius: 5px; cursor: pointer;" onclick="viewFullScreenshot('${screenshot.dataUrl}', '${screenshot.filename}')">
            <div style="margin-top: 8px; font-size: 0.8em; color: #666;">
                <div>${new Date(screenshot.timestamp).toLocaleTimeString()}</div>
                <div>Completion: ${screenshot.completionAtTime}%</div>
            </div>
        </div>
    `).join('');
}

window.viewFullScreenshot = function(dataUrl, filename) {
    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        background: rgba(0,0,0,0.8); z-index: 2000; display: flex; 
        justify-content: center; align-items: center; cursor: pointer;
    `;
    
    modal.innerHTML = `
        <div style="max-width: 90%; max-height: 90%; text-align: center;">
            <img src="${dataUrl}" style="max-width: 100%; max-height: 100%; border-radius: 10px;">
            <div style="color: white; margin-top: 15px; font-size: 1.1em;">${filename}</div>
            <div style="color: #ccc; margin-top: 5px;">Click anywhere to close</div>
        </div>
    `;
    
    modal.onclick = () => document.body.removeChild(modal);
    document.body.appendChild(modal);
};

// Update completion percentage
window.updateCompletion = function(gameName) {
    const completionInput = document.getElementById(`completion-${gameName.replace(/\s+/g, '_')}`);
    const newCompletion = parseInt(completionInput.value);
    
    if (isNaN(newCompletion) || newCompletion < 0 || newCompletion > 100) {
        alert('Please enter a valid completion percentage (0-100)!');
        return;
    }
    
    const gameTask = sessionData.gameTasks[gameName];
    gameTask.completionPercentage = newCompletion;
    
    saveSessionData();
    updateOverallSummary();
    alert(`Completion updated to ${newCompletion}%`);
};

function displayGameObservations(gameName) {
    const gameTask = sessionData.gameTasks[gameName];
    if (!gameTask) return;

    const container = document.getElementById(`saved-obs-${gameName.replace(/\s+/g, '_')}`);

    if (gameTask.observations.length === 0) {
        container.innerHTML = '<p style="color: #666; font-style: italic; text-align: center; margin: 20px 0;">No observations yet</p>';
        return;
    }

    container.innerHTML = gameTask.observations.map(obs => `
        <div class="note-item">
            <div class="note-time">${obs.time}</div>
            <div>${obs.note}</div>
        </div>
    `).join('');
}

// Global functions for game tasks
window.addGameCrash = function (gameName) {
    if (!sessionData.gameTasks[gameName] || !sessionData.gameTasks[gameName].isActive) return;

    sessionData.gameTasks[gameName].crashes++;
    document.getElementById(`crashes-${gameName.replace(/\s+/g, '_')}`).value = sessionData.gameTasks[gameName].crashes;

    saveSessionData();
    updateOverallSummary();
};

window.saveGameObservation = function (gameName) {
    const gameTask = sessionData.gameTasks[gameName];
    if (!gameTask || !gameTask.isActive) return;

    const observationText = document.getElementById(`obs-${gameName.replace(/\s+/g, '_')}`).value.trim();
    if (!observationText) {
        alert('Please enter an observation!');
        return;
    }

    const observation = {
        time: new Date().toLocaleTimeString(),
        note: observationText
    };

    gameTask.observations.push(observation);
    document.getElementById(`obs-${gameName.replace(/\s+/g, '_')}`).value = '';

    displayGameObservations(gameName);
    saveSessionData();
    updateOverallSummary();
    alert('Observation saved successfully!');
};

window.completeGameTask = function(gameName) {
    const gameTask = sessionData.gameTasks[gameName];
    if (!gameTask || !gameTask.isActive) return;

    // Pause game timer if running
    if (gameTask.gameStartTime) {
        pauseGameTimer(gameName);
    }

    if (confirm(`Complete the task for ${gameName}? You won't be able to add more data to this game.`)) {
        gameTask.isActive = false;
        gameTask.endTime = new Date().toISOString();
        sessionData.activeGameTask = null;

        // Clear game timer interval
        if (gameTimers[gameName]) {
            clearInterval(gameTimers[gameName]);
            delete gameTimers[gameName];
        }

        // Recreate the task card with completed state
        const taskCard = document.getElementById(`task-${gameName.replace(/\s+/g, '_')}`);
        taskCard.remove();
        createEnhancedGameTaskCard(gameTask);

        updateActiveGames();
        saveSessionData();
        updateOverallSummary();
    }
};

function updateActiveGames() {
    const activeGamesDiv = document.getElementById('activeGames');
    const activeGames = Object.values(sessionData.gameTasks).filter(task => task.isActive);

    if (activeGames.length === 0) {
        activeGamesDiv.innerHTML = '<p>No active game tasks</p>';
        return;
    }

    activeGamesDiv.innerHTML = `
        <h5>Active Games (${activeGames.length})</h5>
        ${activeGames.map(task => `
            <div style="background: white; padding: 8px 15px; margin: 5px 0; border-radius: 20px; display: inline-block; border: 1px solid #e9ecef; margin-right: 10px;">
                <span style="font-weight: 500; color: #333;">${task.game}</span>
                <span style="color: #28a745; margin-left: 8px;">🟢</span>
            </div>
        `).join('')}
    `;
}

function startTimer() {
    if (!sessionTimer.isRunning) {
        sessionTimer.startTime = Date.now() - sessionTimer.elapsedTime;
        sessionTimer.timerInterval = setInterval(updateTimer, 1000);
        sessionTimer.isRunning = true;

        document.getElementById('startTimer').disabled = true;
        document.getElementById('pauseTimer').disabled = false;
    }
}

function pauseTimer() {
    if (sessionTimer.isRunning) {
        clearInterval(sessionTimer.timerInterval);
        sessionTimer.isRunning = false;

        document.getElementById('startTimer').disabled = false;
        document.getElementById('pauseTimer').disabled = true;

        saveSessionData();
        updateOverallSummary();
    }
}

function resetTimer() {
    if (confirm('Are you sure you want to reset the timer? This will clear all timing data.')) {
        clearInterval(sessionTimer.timerInterval);
        sessionTimer.elapsedTime = 0;
        sessionTimer.isRunning = false;

        document.getElementById('sessionTimer').textContent = '00:00:00';
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('progressText').textContent = '0% of 2 hours completed';
        document.getElementById('startTimer').disabled = false;
        document.getElementById('pauseTimer').disabled = true;

        saveSessionData();
        updateOverallSummary();
    }
}

function updateTimer() {
    sessionTimer.elapsedTime = Date.now() - sessionTimer.startTime;
    const time = new Date(sessionTimer.elapsedTime);

    const hours = String(time.getUTCHours()).padStart(2, '0');
    const minutes = String(time.getUTCMinutes()).padStart(2, '0');
    const seconds = String(time.getUTCSeconds()).padStart(2, '0');

    document.getElementById('sessionTimer').textContent = `${hours}:${minutes}:${seconds}`;

    // Update progress bar
    const progressPercent = Math.min((sessionTimer.elapsedTime / sessionTimer.totalSessionTime) * 100, 100);
    document.getElementById('progressFill').style.width = `${progressPercent}%`;
    document.getElementById('progressText').textContent = `${Math.round(progressPercent)}% of 2 hours completed`;

    // Auto-pause at 2 hours
    if (sessionTimer.elapsedTime >= sessionTimer.totalSessionTime) {
        pauseTimer();
        alert('2-hour session completed! Great job!');
    }

    // Save progress periodically
    if (Math.floor(sessionTimer.elapsedTime / 1000) % 30 === 0) { // Every 30 seconds
        saveSessionData();
    }
}

function updateOverallSummary() {
    const totalMinutes = Math.floor(sessionTimer.elapsedTime / 60000);
    const totalGames = Object.keys(sessionData.gameTasks).length;
    const totalIssues = Object.values(sessionData.gameTasks).reduce((sum, task) => sum + task.crashes, 0);
    const totalNotes = Object.values(sessionData.gameTasks).reduce((sum, task) => sum + task.observations.length, 0);
    const totalScreenshots = Object.values(sessionData.gameTasks).reduce((sum, task) => sum + (task.screenshots || []).length, 0);
    const completionPercent = Math.min((sessionTimer.elapsedTime / sessionTimer.totalSessionTime) * 100, 100);

    document.getElementById('totalTime').textContent = `${totalMinutes} minutes`;
    document.getElementById('gamesPlayed').textContent = totalGames;
    document.getElementById('totalCrashes').textContent = totalIssues;
    document.getElementById('notesCount').textContent = totalNotes;
    document.getElementById('totalScreenshots').textContent = totalScreenshots;
    document.getElementById('completionPercent').textContent = `${Math.round(completionPercent)}%`;
}

function saveSessionData() {
    if (!currentUser) return;

    let sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

    // Find existing session or create new one
    let existingSessionIndex = sessions.findIndex(s =>
        s.registrationId === sessionData.registrationId
    );

    const sessionToSave = {
        ...sessionData,
        elapsedTime: sessionTimer.elapsedTime,
        completionPercent: Math.min((sessionTimer.elapsedTime / sessionTimer.totalSessionTime) * 100, 100),
        lastUpdated: new Date().toISOString()
    };

    if (existingSessionIndex >= 0) {
        sessions[existingSessionIndex] = sessionToSave;
    } else {
        sessions.push(sessionToSave);
    }

    localStorage.setItem('sessions', JSON.stringify(sessions));
}

function loadExistingSessionData() {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const existingSession = sessions.find(s => s.registrationId === sessionData.registrationId);

    if (existingSession) {
        sessionData = { ...existingSession };
        sessionTimer.elapsedTime = existingSession.elapsedTime || 0;

        // Recreate game task cards
        Object.values(sessionData.gameTasks || {}).forEach(gameTask => {
            createEnhancedGameTaskCard(gameTask);
        });

        updateActiveGames();

        // Update timer display
        const time = new Date(sessionTimer.elapsedTime);
        const hours = String(time.getUTCHours()).padStart(2, '0');
        const minutes = String(time.getUTCMinutes()).padStart(2, '0');
        const seconds = String(time.getUTCSeconds()).padStart(2, '0');
        document.getElementById('sessionTimer').textContent = `${hours}:${minutes}:${seconds}`;

        const progressPercent = Math.min((sessionTimer.elapsedTime / sessionTimer.totalSessionTime) * 100, 100);
        document.getElementById('progressFill').style.width = `${progressPercent}%`;
        document.getElementById('progressText').textContent = `${Math.round(progressPercent)}% of 2 hours completed`;
    }

    updateOverallSummary();
}