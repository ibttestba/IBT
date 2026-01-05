const workshopStart = new Date('2025-12-15');
const workshopEnd = new Date('2026-03-15');
const totalWorkshopDays = Math.ceil((workshopEnd - workshopStart) / (1000 * 60 * 60 * 24)) + 1;
const slotsPerDay = 5;
const maxUsersPerSlot = 4;
const totalAvailableSlots = totalWorkshopDays * slotsPerDay * maxUsersPerSlot;

let currentSelectedGame = '';

document.addEventListener('DOMContentLoaded', function () {
    loadAdminData();
    setupAdminEventListeners();
    updateWorkshopOverview();
});

function setupAdminEventListeners() {
    document.getElementById('applyFilters').addEventListener('click', applyFilters);
    document.getElementById('clearFilters').addEventListener('click', clearFilters);
    document.getElementById('exportUsers').addEventListener('click', exportUsers);
    document.getElementById('exportAnalytics').addEventListener('click', exportAnalytics);
    document.getElementById('exportAllData').addEventListener('click', exportAllData);
    document.getElementById('importData').addEventListener('click', () => document.getElementById('importFile').click());
    document.getElementById('importFile').addEventListener('change', importData);
    document.getElementById('resetTodaySlots').addEventListener('click', resetTodaySlots);
    document.getElementById('clearOldSessions').addEventListener('click', clearOldSessions);
    document.getElementById('clearAllData').addEventListener('click', clearAllData);
    
    // Game analytics event listeners
    document.getElementById('loadGameAnalytics').addEventListener('click', loadGameAnalytics);
    document.getElementById('gameAnalyticsSelector').addEventListener('change', function() {
        if (!this.value) {
            hideGameAnalytics();
        }
    });
    document.getElementById('exportGameData').addEventListener('click', exportCurrentGameData);
}

function updateWorkshopOverview() {
    document.getElementById('totalAvailableSlots').textContent = totalAvailableSlots;
    document.getElementById('daysRemaining').textContent = getDaysRemaining();
}

function getDaysRemaining() {
    const today = new Date();
    const diffTime = workshopEnd - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

function loadAdminData() {
    updateStats();
    loadUsersTable();
    loadAnalyticsTable();
}

function updateStats() {
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

    const totalRegistrations = registrations.length;
    const availableSlots = totalAvailableSlots - totalRegistrations;
    const completionRate = ((totalRegistrations / totalAvailableSlots) * 100).toFixed(1);

    // Get today's sessions
    const today = new Date().toISOString().split('T')[0];
    const todaySessions = sessions.filter(s => s.date === today).length;

    document.getElementById('totalRegistrations').textContent = totalRegistrations;
    document.getElementById('availableSlots').textContent = availableSlots;
    document.getElementById('todaySessions').textContent = todaySessions;
    document.getElementById('completionRate').textContent = `${completionRate}%`;
}

function loadUsersTable(filteredData = null) {
    const registrations = filteredData || JSON.parse(localStorage.getItem('registrations') || '[]');
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const tbody = document.getElementById('usersTableBody');

    tbody.innerHTML = '';

    // Sort by date and time
    registrations.sort((a, b) => {
        if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
        return a.slot.localeCompare(b.slot);
    });

    registrations.forEach((reg, index) => {
        const userSession = sessions.find(s => s.registrationId === reg.registrationId);

        let status = 'Registered';
        if (userSession) {
            if (userSession.completionPercent >= 100) {
                status = 'Completed';
            } else if (userSession.elapsedTime > 0) {
                status = 'Active';
            }
        }

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${reg.name}</td>
            <td>${reg.email}</td>
            <td>${reg.wwid}</td>
            <td>${new Date(reg.date).toLocaleDateString()}</td>
            <td>${reg.slot}</td>
            <td>${reg.gamePreference}</td>
            <td><span class="status ${status.toLowerCase()}">${status}</span></td>
            <td>
                <button onclick="removeUser('${reg.registrationId}')" class="admin-btn danger" style="padding: 5px 10px; font-size: 12px;">Remove</button>
                <button onclick="viewUserDetails('${reg.registrationId}')" class="admin-btn" style="padding: 5px 10px; font-size: 12px;">Details</button>
            </td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('tableInfo').textContent = `Showing ${registrations.length} registrations`;
}

function loadAnalyticsTable(filteredData = null) {
    const sessions = filteredData || JSON.parse(localStorage.getItem('sessions') || '[]');
    const tbody = document.getElementById('analyticsTableBody');

    tbody.innerHTML = '';

    // Sort by date and time
    sessions.sort((a, b) => {
        if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
        return a.slot.localeCompare(b.slot);
    });

    sessions.forEach(session => {
        const duration = Math.floor((session.elapsedTime || 0) / 60000);
        const gamesPlayed = session.gameTasks ? Object.keys(session.gameTasks).join(', ') : 'None';
        const completionPercent = Math.round(session.completionPercent || 0);
        const totalCrashes = session.gameTasks ? Object.values(session.gameTasks).reduce((sum, task) => sum + task.crashes, 0) : 0;
        const totalNotes = session.gameTasks ? Object.values(session.gameTasks).reduce((sum, task) => sum + task.observations.length, 0) : 0;
        const totalScreenshots = session.gameTasks ? Object.values(session.gameTasks).reduce((sum, task) => sum + (task.screenshots || []).length, 0) : 0;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${session.user}</td>
            <td>${session.wwid}</td>
            <td>${new Date(session.date).toLocaleDateString()}</td>
            <td>${session.slot}</td>
            <td>${gamesPlayed}</td>
            <td>${duration} min</td>
            <td>${completionPercent}%</td>
            <td>${totalCrashes}</td>
            <td>${totalNotes}</td>
            <td>${totalScreenshots}</td>
        `;
        tbody.appendChild(row);
    });

    document.getElementById('analyticsInfo').textContent = `Showing ${sessions.length} session records`;
}

// Game Analytics Functions
function loadGameAnalytics() {
    const selectedGame = document.getElementById('gameAnalyticsSelector').value;
    if (!selectedGame) {
        alert('Please select a game first!');
        return;
    }

    currentSelectedGame = selectedGame;
    const gameData = getGameAnalyticsData(selectedGame);
    displayGameOverviewStats(selectedGame, gameData);
    displayGamePlayerAnalysis(selectedGame, gameData.players);
    
    // Show analytics sections
    document.getElementById('gameOverviewStats').style.display = 'block';
    document.getElementById('gamePlayerAnalysis').style.display = 'block';
    document.getElementById('selectedGameName').textContent = selectedGame;
}

function getGameAnalyticsData(gameName) {
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    
    // Get all players who registered for this game
    const gameRegistrations = registrations.filter(reg => reg.gamePreference === gameName);
    
    // Get all sessions where this game was played
    const gameSessions = sessions.filter(session => 
        session.gameTasks && session.gameTasks[gameName]
    );
    
    const analytics = {
        totalPlayers: new Set(),
        totalHours: 0,
        totalCrashes: 0,
        totalScreenshots: 0,
        completions: [],
        sessionTimes: [],
        players: []
    };
    
    // Process game sessions
    gameSessions.forEach(session => {
        const gameTask = session.gameTasks[gameName];
        if (gameTask) {
            analytics.totalPlayers.add(session.wwid);
            analytics.totalHours += (gameTask.totalPlayTime || 0) / (1000 * 60 * 60); // Convert to hours
            analytics.totalCrashes += gameTask.crashes || 0;
            analytics.totalScreenshots += (gameTask.screenshots || []).length;
            analytics.completions.push(gameTask.completionPercentage || 0);
            analytics.sessionTimes.push((gameTask.totalPlayTime || 0) / (1000 * 60)); // Convert to minutes
            
            // Add player data
            analytics.players.push({
                name: session.user,
                wwid: session.wwid,
                date: session.date,
                playTime: gameTask.totalPlayTime || 0,
                completion: gameTask.completionPercentage || 0,
                crashes: gameTask.crashes || 0,
                screenshots: (gameTask.screenshots || []).length,
                notes: (gameTask.observations || []).length,
                sessionId: session.registrationId
            });
        }
    });
    
    return {
        totalPlayers: analytics.totalPlayers.size,
        totalHours: analytics.totalHours,
        totalCrashes: analytics.totalCrashes,
        totalScreenshots: analytics.totalScreenshots,
        avgCompletion: analytics.completions.length > 0 ? 
            (analytics.completions.reduce((a, b) => a + b, 0) / analytics.completions.length) : 0,
        avgSessionTime: analytics.sessionTimes.length > 0 ? 
            (analytics.sessionTimes.reduce((a, b) => a + b, 0) / analytics.sessionTimes.length) : 0,
        players: analytics.players
    };
}

function displayGameOverviewStats(gameName, data) {
    document.getElementById('totalGamePlayers').textContent = data.totalPlayers;
    document.getElementById('totalGameHours').textContent = data.totalHours.toFixed(1) + 'h';
    document.getElementById('totalGameCrashes').textContent = data.totalCrashes;
    document.getElementById('avgGameCompletion').textContent = data.avgCompletion.toFixed(1) + '%';
    document.getElementById('totalGameScreenshots').textContent = data.totalScreenshots;
    document.getElementById('avgGameSessionTime').textContent = data.avgSessionTime.toFixed(0) + 'm';
}

function displayGamePlayerAnalysis(gameName, players) {
    const tbody = document.getElementById('gamePlayersTableBody');
    tbody.innerHTML = '';
    
    players.forEach(player => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${player.name}</td>
            <td>${player.wwid}</td>
            <td>${new Date(player.date).toLocaleDateString()}</td>
            <td>${formatPlayTime(player.playTime)}</td>
            <td>${player.completion}%</td>
            <td>${player.crashes}</td>
            <td>${player.screenshots}</td>
            <td>${player.notes}</td>
            <td>
                <button onclick="viewPlayerGameDetails('${player.sessionId}', '${gameName}')" class="admin-btn" style="padding: 5px 10px; font-size: 12px;">View Details</button>
            </td>
        `;
        tbody.appendChild(row);
    });
    
    document.getElementById('gameTableInfo').textContent = `Showing ${players.length} player records for ${gameName}`;
}

function formatPlayTime(milliseconds) {
    const totalMinutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
}

window.viewPlayerGameDetails = function(sessionId, gameName) {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const session = sessions.find(s => s.registrationId === sessionId);
    
    if (!session || !session.gameTasks || !session.gameTasks[gameName]) {
        alert('Session data not found!');
        return;
    }
    
    const gameTask = session.gameTasks[gameName];
    
    let details = `Game Details for ${session.user}\n\n`;
    details += `Game: ${gameName}\n`;
    details += `Play Time: ${formatPlayTime(gameTask.totalPlayTime || 0)}\n`;
    details += `Completion: ${gameTask.completionPercentage || 0}%\n`;
    details += `Crashes: ${gameTask.crashes || 0}\n`;
    details += `Screenshots: ${(gameTask.screenshots || []).length}\n`;
    details += `Observations: ${(gameTask.observations || []).length}\n\n`;
    
    if (gameTask.observations && gameTask.observations.length > 0) {
        details += `Observations:\n`;
        gameTask.observations.forEach((obs, index) => {
            details += `${index + 1}. [${obs.time}] ${obs.note}\n`;
        });
    }
    
    alert(details);
};

function hideGameAnalytics() {
    document.getElementById('gameOverviewStats').style.display = 'none';
    document.getElementById('gamePlayerAnalysis').style.display = 'none';
    currentSelectedGame = '';
}

function exportCurrentGameData() {
    if (!currentSelectedGame) {
        alert('Please select and load a game first!');
        return;
    }
    
    const gameData = getGameAnalyticsData(currentSelectedGame);
    const csvContent = generateGameCSV(gameData.players, currentSelectedGame);
    downloadCSV(csvContent, `${currentSelectedGame.replace(/\s+/g, '_')}-analytics-${new Date().toISOString().split('T')[0]}.csv`);
}

function generateGameCSV(players, gameName) {
    const headers = ['Player Name', 'WWID', 'Session Date', 'Play Time (minutes)', 'Completion %', 'Crashes', 'Screenshots', 'Notes Count'];
    const rows = players.map(player => [
        player.name,
        player.wwid,
        player.date,
        Math.floor(player.playTime / (1000 * 60)),
        player.completion,
        player.crashes,
        player.screenshots,
        player.notes
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
}

function applyFilters() {
    const filterDate = document.getElementById('filterDate').value;
    const filterGame = document.getElementById('filterGame').value;
    const searchUser = document.getElementById('searchUser').value.toLowerCase();

    let registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    let sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

    // Apply filters to registrations
    if (filterDate) {
        registrations = registrations.filter(reg => reg.date === filterDate);
    }
    if (filterGame) {
        registrations = registrations.filter(reg => reg.gamePreference === filterGame);
    }
    if (searchUser) {
        registrations = registrations.filter(reg =>
            reg.name.toLowerCase().includes(searchUser) ||
            reg.email.toLowerCase().includes(searchUser) ||
            reg.wwid.toLowerCase().includes(searchUser)
        );
    }

    // Apply filters to sessions
    if (filterDate) {
        sessions = sessions.filter(s => s.date === filterDate);
    }
    if (filterGame) {
        sessions = sessions.filter(s =>
            s.gameTasks && Object.keys(s.gameTasks).some(game => game.includes(filterGame))
        );
    }
    if (searchUser) {
        sessions = sessions.filter(s =>
            s.user.toLowerCase().includes(searchUser) ||
            s.wwid.toLowerCase().includes(searchUser)
        );
    }

    loadUsersTable(registrations);
    loadAnalyticsTable(sessions);
}

function clearFilters() {
    document.getElementById('filterDate').value = '';
    document.getElementById('filterGame').value = '';
    document.getElementById('searchUser').value = '';
    loadAdminData();
}

function removeUser(registrationId) {
    if (confirm('Are you sure you want to remove this user? This will also delete their session data.')) {
        let registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        let sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

        // Remove registration
        registrations = registrations.filter(reg => reg.registrationId !== registrationId);
        localStorage.setItem('registrations', JSON.stringify(registrations));

        // Remove associated session
        sessions = sessions.filter(s => s.registrationId !== registrationId);
        localStorage.setItem('sessions', JSON.stringify(sessions));

        loadAdminData();
        alert('User and associated session data removed successfully!');
    }
}

function viewUserDetails(registrationId) {
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

    const registration = registrations.find(reg => reg.registrationId === registrationId);
    const session = sessions.find(s => s.registrationId === registrationId);

    let details = `User Details:\n\n`;
    details += `Name: ${registration.name}\n`;
    details += `Email: ${registration.email}\n`;
    details += `WWID: ${registration.wwid}\n`;
    details += `Date: ${new Date(registration.date).toLocaleDateString()}\n`;
    details += `Time: ${registration.slot}\n`;
    details += `Preferred Game: ${registration.gamePreference}\n`;
    details += `Registration ID: ${registration.registrationId}\n`;
    details += `Registered: ${new Date(registration.registrationTime).toLocaleString()}\n`;

    if (session) {
        details += `\nSession Data:\n`;
        details += `Duration: ${Math.floor(session.elapsedTime / 60000)} minutes\n`;
        details += `Completion: ${Math.round(session.completionPercent || 0)}%\n`;
        details += `Games Tested: ${session.gameTasks ? Object.keys(session.gameTasks).length : 0}\n`;
        details += `Total Issues: ${session.gameTasks ? Object.values(session.gameTasks).reduce((sum, task) => sum + task.crashes, 0) : 0}\n`;
        details += `Total Notes: ${session.gameTasks ? Object.values(session.gameTasks).reduce((sum, task) => sum + task.observations.length, 0) : 0}\n`;
        details += `Total Screenshots: ${session.gameTasks ? Object.values(session.gameTasks).reduce((sum, task) => sum + (task.screenshots || []).length, 0) : 0}\n`;
    }

    alert(details);
}

function exportUsers() {
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const csvContent = generateCSV(registrations, [
        'name', 'email', 'wwid', 'date', 'slot', 'gamePreference', 'registrationId', 'registrationTime'
    ]);

    downloadCSV(csvContent, `users-${new Date().toISOString().split('T')[0]}.csv`);
}

function exportAnalytics() {
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
    const csvContent = generateCSV(sessions, [
        'user', 'wwid', 'date', 'slot', 'elapsedTime', 'completionPercent'
    ]);

    downloadCSV(csvContent, `analytics-${new Date().toISOString().split('T')[0]}.csv`);
}

function exportAllData() {
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

    const exportData = {
        exportDate: new Date().toISOString(),
        workshopInfo: {
            startDate: '2025-12-15',
            endDate: '2026-03-15',
            totalDays: totalWorkshopDays,
            slotsPerDay: slotsPerDay,
            maxUsersPerSlot: maxUsersPerSlot,
            totalSlots: totalAvailableSlots
        },
        registrations,
        sessions,
        statistics: {
            totalRegistrations: registrations.length,
            availableSlots: totalAvailableSlots - registrations.length,
            completionRate: ((registrations.length / totalAvailableSlots) * 100).toFixed(2)
        }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `gaming-workshop-complete-data-${new Date().toISOString().split('T')[0]}.json`;
    link.click();

    alert('Complete data exported successfully!');
}

function importData(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (event) {
        try {
            const importedData = JSON.parse(event.target.result);

            if (confirm('This will replace all existing data. Are you sure?')) {
                if (importedData.registrations) {
                    localStorage.setItem('registrations', JSON.stringify(importedData.registrations));
                }
                if (importedData.sessions) {
                    localStorage.setItem('sessions', JSON.stringify(importedData.sessions));
                }

                loadAdminData();
                alert('Data imported successfully!');
            }
        } catch (error) {
            alert('Error importing data. Please check the file format.');
        }
    };
    reader.readAsText(file);
}

function resetTodaySlots() {
    const today = new Date().toISOString().split('T')[0];

    if (confirm(`Reset all slots for ${today}? This will remove all registrations for today.`)) {
        let registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
        let sessions = JSON.parse(localStorage.getItem('sessions') || '[]');

        registrations = registrations.filter(reg => reg.date !== today);
        sessions = sessions.filter(s => s.date !== today);

        localStorage.setItem('registrations', JSON.stringify(registrations));
        localStorage.setItem('sessions', JSON.stringify(sessions));

        loadAdminData();
        alert(`All slots for ${today} have been reset!`);
    }
}

function clearOldSessions() {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days ago

    if (confirm('Clear session data older than 7 days?')) {
        let sessions = JSON.parse(localStorage.getItem('sessions') || '[]');
        const originalCount = sessions.length;

        sessions = sessions.filter(s => new Date(s.date) >= cutoffDate);
        localStorage.setItem('sessions', JSON.stringify(sessions));

        const removedCount = originalCount - sessions.length;
        loadAdminData();
        alert(`Removed ${removedCount} old session records.`);
    }
}

function clearAllData() {
    if (confirm('Are you sure you want to clear ALL data? This action cannot be undone!')) {
        if (confirm('This will delete all registrations and session data. Are you absolutely sure?')) {
            localStorage.removeItem('registrations');
            localStorage.removeItem('sessions');
            loadAdminData();
            alert('All data cleared successfully!');
        }
    }
}

// Utility functions
function generateCSV(data, fields) {
    const headers = fields.join(',');
    const rows = data.map(item =>
        fields.map(field => {
            let value = item[field] || '';
            if (typeof value === 'object') {
                value = JSON.stringify(value);
            }
            return `"${value}"`;
        }).join(',')
    );

    return [headers, ...rows].join('\n');
}

function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
}