// Time slots configuration (2-hour slots from 9 AM to 8 PM)
const timeSlots = [
    "09:00 - 11:00",
    "11:00 - 13:00",
    "13:00 - 15:00",
    "15:00 - 17:00",
    "17:00 - 19:00"
];

// Workshop date range
const workshopStart = new Date('2025-12-15');
const workshopEnd = new Date('2026-03-15');
const maxUsersPerSlot = 4; // 4 gaming setups available

// Initialize the application
document.addEventListener('DOMContentLoaded', function () {
    setupDateSelector();
    setupEventListeners();
    updateWorkshopInfo();
});

// Setup date selector
function setupDateSelector() {
    const dateSelector = document.getElementById('dateSelector');
    const today = new Date();

    // Set default date to today if within workshop period, otherwise start date
    if (today >= workshopStart && today <= workshopEnd) {
        dateSelector.value = today.toISOString().split('T')[0];
        generateTimeSlots(today.toISOString().split('T')[0]);
    } else {
        dateSelector.value = workshopStart.toISOString().split('T')[0];
    }

    dateSelector.addEventListener('change', function () {
        const selectedDate = this.value;
        if (selectedDate) {
            generateTimeSlots(selectedDate);
        }
    });
}

// Generate time slots for selected date
function generateTimeSlots(selectedDate) {
    const slotsGrid = document.getElementById('slotsGrid');
    const selectedDateInfo = document.getElementById('selectedDateInfo');
    const selectedDateDisplay = document.getElementById('selectedDateDisplay');

    const slotOccupancy = getSlotOccupancy(selectedDate);
    const dateObj = new Date(selectedDate);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    selectedDateDisplay.textContent = formattedDate;
    selectedDateInfo.style.display = 'block';
    slotsGrid.innerHTML = '';

    timeSlots.forEach(slot => {
        const slotKey = `${selectedDate}_${slot}`;
        const occupiedCount = slotOccupancy[slotKey] || 0;
        const availableCount = maxUsersPerSlot - occupiedCount;
        const isFull = occupiedCount >= maxUsersPerSlot;

        const slotCard = document.createElement('div');
        slotCard.className = `slot-card ${isFull ? 'booked' : 'available'}`;

        let statusText = '';
        if (isFull) {
            statusText = 'FULL';
        } else if (occupiedCount > 0) {
            statusText = `${availableCount} AVAILABLE`;
        } else {
            statusText = '4 AVAILABLE';
        }

        slotCard.innerHTML = `
            <div class="slot-time">${slot}</div>
            <div class="slot-status ${isFull ? 'status-booked' : 'status-available'}">
                ${statusText}
            </div>
            <div class="booked-by">${occupiedCount}/${maxUsersPerSlot} Registered</div>
        `;

        if (!isFull) {
            slotCard.addEventListener('click', () => openRegistrationModal(selectedDate, slot));
        }

        slotsGrid.appendChild(slotCard);
    });
}

// Get slot occupancy for a specific date
function getSlotOccupancy(date) {
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const occupancy = {};

    registrations
        .filter(reg => reg.date === date)
        .forEach(reg => {
            occupancy[reg.slotKey] = (occupancy[reg.slotKey] || 0) + 1;
        });

    return occupancy;
}

// Setup event listeners
function setupEventListeners() {
    const modal = document.getElementById('registrationModal');
    const closeBtn = document.querySelector('.close');
    const form = document.getElementById('registrationForm');

    closeBtn.addEventListener('click', closeModal);
    window.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    form.addEventListener('submit', handleRegistration);
    setupFormValidation();
}

// Open registration modal
function openRegistrationModal(date, slot) {
    const modal = document.getElementById('registrationModal');
    const modalDate = document.getElementById('modalDate');
    const modalTime = document.getElementById('modalTime');

    const dateObj = new Date(date);
    const formattedDate = dateObj.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    modalDate.textContent = formattedDate;
    modalTime.textContent = slot;
    
    // Add user registration history section
    addUserHistorySection();
    
    modal.style.display = 'block';
}

// Add user history section to modal
function addUserHistorySection() {
    const existingHistory = document.getElementById('userRegistrationHistory');
    if (existingHistory) {
        existingHistory.remove();
    }

    const modalContent = document.querySelector('.modal-content');
    const form = document.getElementById('registrationForm');
    
    const historySection = document.createElement('div');
    historySection.id = 'userRegistrationHistory';
    historySection.innerHTML = `
        <div class="user-history-section" style="margin-bottom: 20px; padding: 15px; background: #f8f9fa; border-radius: 8px; display: none;">
            <h4 style="color: #333; margin-bottom: 15px;">Your Existing Registrations</h4>
            <div id="userHistoryList"></div>
        </div>
    `;
    
    modalContent.insertBefore(historySection, form);
    
    // Add email input listener to show history
    const emailInput = document.getElementById('userEmail');
    emailInput.addEventListener('blur', showUserHistory);
}

// Show user registration history
function showUserHistory() {
    const email = document.getElementById('userEmail').value.trim().toLowerCase();
    const historySection = document.querySelector('.user-history-section');
    const historyList = document.getElementById('userHistoryList');
    
    if (!email || !validateEmail(email)) {
        historySection.style.display = 'none';
        return;
    }
    
    const userRegistrations = getUserRegistrations(email);
    
    if (userRegistrations.length === 0) {
        historySection.style.display = 'none';
        return;
    }
    
    historySection.style.display = 'block';
    historyList.innerHTML = userRegistrations.map(reg => `
        <div style="background: white; padding: 10px; margin: 5px 0; border-radius: 5px; border-left: 3px solid #667eea;">
            <strong>${reg.dateFormatted}</strong> - ${reg.slot} - ${reg.gamePreference}
            <br><small style="color: #666;">ID: ${reg.registrationId}</small>
        </div>
    `).join('');
}

// Get user's existing registrations
function getUserRegistrations(email) {
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    return registrations.filter(reg => reg.email === email);
}

// Close modal
function closeModal() {
    const modal = document.getElementById('registrationModal');
    modal.style.display = 'none';
    document.getElementById('registrationForm').reset();
    
    // Hide user history section
    const historySection = document.querySelector('.user-history-section');
    if (historySection) {
        historySection.style.display = 'none';
    }
}

// Handle registration
function handleRegistration(e) {
    e.preventDefault();

    // Validate form first
    if (!validateForm()) {
        return;
    }

    const modalDate = document.getElementById('modalDate').textContent;
    const modalTime = document.getElementById('modalTime').textContent;
    const selectedDate = document.getElementById('dateSelector').value;

    const formData = {
        date: selectedDate,
        dateFormatted: modalDate,
        slot: modalTime,
        slotKey: `${selectedDate}_${modalTime}`,
        name: document.getElementById('userName').value.trim(),
        email: document.getElementById('userEmail').value.trim().toLowerCase(),
        wwid: document.getElementById('userWWID').value.trim(),
        gamePreference: document.getElementById('gamePreference').value,
        registrationTime: new Date().toISOString(),
        registrationId: generateRegistrationId()
    };

    // Validate slot availability
    const slotOccupancy = getSlotOccupancy(selectedDate);
    const currentOccupancy = slotOccupancy[formData.slotKey] || 0;

    if (currentOccupancy >= maxUsersPerSlot) {
        alert('Sorry, this slot is now full. Please select another time slot.');
        closeModal();
        generateTimeSlots(selectedDate);
        return;
    }

    // Validate email uniqueness for this specific slot
    if (isEmailAlreadyRegistered(formData.email, selectedDate, modalTime)) {
        alert('You are already registered for this specific time slot. Please choose a different time slot.');
        return;
    }

    // Validate WWID uniqueness for this specific slot
    if (isWWIDAlreadyRegistered(formData.wwid, selectedDate, modalTime)) {
        alert('This WWID is already registered for this specific time slot. Please choose a different time slot.');
        return;
    }

    // Check if user has existing registrations (for information)
    const existingRegistrations = getUserRegistrations(formData.email);
    let confirmMessage = `Registration Details:\nName: ${formData.name}\nEmail: ${formData.email}\nWWID: ${formData.wwid}\nDate: ${formData.dateFormatted}\nTime: ${formData.slot}\nGame: ${formData.gamePreference}\nRegistration ID: ${formData.registrationId}`;
    
    if (existingRegistrations.length > 0) {
        confirmMessage += `\n\nNote: You have ${existingRegistrations.length} other registration(s). You can register for multiple slots.`;
    }
    
    confirmMessage += `\n\nPlease save this information and arrive 15 minutes early.`;

    // Save registration
    saveRegistration(formData);

    // Show success message
    alert(`Registration successful!\n\n${confirmMessage}`);

    // Close modal and refresh slots
    closeModal();
    generateTimeSlots(selectedDate);
}

// Check if email is already registered for specific slot
function isEmailAlreadyRegistered(email, selectedDate, selectedSlot) {
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const slotKey = `${selectedDate}_${selectedSlot}`;
    
    return registrations.some(reg => 
        reg.email === email && reg.slotKey === slotKey
    );
}

// Check if WWID is already registered for specific slot
function isWWIDAlreadyRegistered(wwid, selectedDate, selectedSlot) {
    const registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    const slotKey = `${selectedDate}_${selectedSlot}`;
    
    return registrations.some(reg => 
        reg.wwid === wwid && reg.slotKey === slotKey
    );
}

// Generate unique registration ID
function generateRegistrationId() {
    return 'REG-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}

// Save registration to localStorage
function saveRegistration(data) {
    let registrations = JSON.parse(localStorage.getItem('registrations') || '[]');
    registrations.push(data);
    localStorage.setItem('registrations', JSON.stringify(registrations));
}

// Update workshop info
function updateWorkshopInfo() {
    const totalDays = Math.ceil((workshopEnd - workshopStart) / (1000 * 60 * 60 * 24)) + 1;
    const totalSlots = totalDays * timeSlots.length * maxUsersPerSlot;

    console.log(`Workshop: ${totalDays} days, ${totalSlots} total slots available`);
}

// Utility function to get days remaining
function getDaysRemaining() {
    const today = new Date();
    const diffTime = workshopEnd - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
}

// Utility functions for form validation
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

function validateWWID(wwid) {
    return wwid.length >= 3 && wwid.length <= 20;
}

// Enhanced form validation
function validateForm() {
    const name = document.getElementById('userName').value.trim();
    const email = document.getElementById('userEmail').value.trim();
    const wwid = document.getElementById('userWWID').value.trim();
    const game = document.getElementById('gamePreference').value;

    if (!name || name.length < 2) {
        alert('Please enter a valid name (at least 2 characters).');
        return false;
    }

    if (!validateEmail(email)) {
        alert('Please enter a valid email address.');
        return false;
    }

    if (!validateWWID(wwid)) {
        alert('Please enter a valid WWID (3-20 characters).');
        return false;
    }

    if (!game) {
        alert('Please select a preferred game.');
        return false;
    }

    return true;
}

// Add real-time validation feedback
function setupFormValidation() {
    const nameInput = document.getElementById('userName');
    const emailInput = document.getElementById('userEmail');
    const wwidInput = document.getElementById('userWWID');

    if (nameInput) {
        nameInput.addEventListener('blur', function () {
            if (this.value.trim().length < 2) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#28a745';
            }
        });
    }

    if (emailInput) {
        emailInput.addEventListener('blur', function () {
            if (!validateEmail(this.value.trim())) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#28a745';
            }
        });
    }

    if (wwidInput) {
        wwidInput.addEventListener('blur', function () {
            if (!validateWWID(this.value.trim())) {
                this.style.borderColor = '#dc3545';
            } else {
                this.style.borderColor = '#28a745';
            }
        });
    }
}