import confetti from 'canvas-confetti';

document.addEventListener('DOMContentLoaded', () => {
    // State variables
    let currentModuleLevel = 1;
    let consecutiveDays = 0; // Load from storage later
    let missionDiaryContent = ''; // Load from storage later
    let lastLogDate = null; // Track last ethics log date
    let ethicsScore = 0; // Daily score, resets
    let moduleProgress = {}; // Store completion status, e.g., { 1: { "Segunda": true, "Terça": false... }}
    let ethicsProgressToday = {}; // Store today's checkbox states {id: boolean}
    let customTemptations = []; // Store user-added temptations [{id: 'c_t_1', text: '...', value: -1}]
    let customDisciplines = []; // Store user-added disciplines [{id: 'c_d_1', text: '...', value: 1}]

    // DOM Elements
    const sections = document.querySelectorAll('main section');
    const navButtons = document.querySelectorAll('.nav-button');
    const startProgramBtn = document.getElementById('start-program-btn');
    const moduleNav = document.getElementById('module-nav');
    const moduleContent = document.getElementById('module-content');
    const missionAccomplishedBtn = document.getElementById('mission-accomplished-btn');
    const currentModuleDisplay = document.getElementById('current-module');
    const consecutiveDaysDisplay = document.getElementById('consecutive-days');
    const insigniasDisplay = document.getElementById('insignias-earned');
    const missionDiary = document.getElementById('mission-diary');
    const globalSeesawBeam = document.getElementById('global-seesaw-beam');
    const temptationsList = document.getElementById('temptations-list');
    const disciplinesList = document.getElementById('disciplines-list');
    const selfControlScoreDisplay = document.getElementById('self-control-score');
    const logEthicsBtn = document.getElementById('log-ethics-btn');
    const newTemptationInput = document.getElementById('new-temptation-input');
    const addTemptationBtn = document.getElementById('add-temptation-btn');
    const newDisciplineInput = document.getElementById('new-discipline-input');
    const addDisciplineBtn = document.getElementById('add-discipline-btn');

    // --- Data Definitions ---
    const moduleData = {
        1: { name: "Recruta", days: [
            { day: "Segunda", exercises: ["Flexões (3xAMRAP)", "Agachamentos (3x20)", "Prancha (3x30s)"], completed: false },
            { day: "Terça", exercises: ["Corrida Leve (20 min)"], completed: false },
            { day: "Quarta", exercises: ["Abdominais (3x20)", "Afundos (3x15 cada perna)", "Ponte de Glúteo (3x15)"], completed: false },
            { day: "Quinta", exercises: ["Descanso Ativo (Alongamento)"], completed: false },
            { day: "Sexta", exercises: ["Flexões Inclinadas (3x15)", "Agachamentos Sumô (3x15)", "Prancha Lateral (3x20s cada lado)"], completed: false },
            { day: "Sábado", exercises: ["Caminhada Rápida (30 min)"], completed: false },
            { day: "Domingo", exercises: ["Descanso"], completed: false },
        ]},
        2: { name: "Cadete", days: [ 
            { day: "Segunda", exercises: ["Flexões (4xAMRAP)", "Agachamentos com Salto (3x15)", "Prancha (3x45s)"], completed: false },
            { day: "Terça", exercises: ["Corrida Moderada (25 min)", "Burpees (3x10)"], completed: false },
            { day: "Quarta", exercises: ["Abdominais Remador (3x20)", "Afundos com Peso Leve (3x12)", "Elevação Pélvica (3x20)"], completed: false },
            { day: "Quinta", exercises: ["Descanso Ativo (Yoga Leve)"], completed: false },
            { day: "Sexta", exercises: ["Flexões Diamante (3xAMRAP)", "Agachamentos Búlgaros (3x10 cada)", "Prancha com Toque no Ombro (3x30s)"], completed: false },
            { day: "Sábado", exercises: ["Corrida Intervalada (30 min)"], completed: false },
            { day: "Domingo", exercises: ["Descanso"], completed: false },
        ]},
        3: { name: "Oficial", days: [ { day: "Segunda", exercises: ["WIP"], completed: false } ]},
        4: { name: "Capitão", days: [ { day: "Segunda", exercises: ["WIP"], completed: false } ]},
        5: { name: "General", days: [ { day: "Segunda", exercises: ["WIP"], completed: false } ]},
        6: { name: "Lendário", days: [ { day: "Segunda", exercises: ["WIP"], completed: false } ]}
    };

    const defaultEthicsData = {
        temptations: [
            { id: "t1", text: "Comer fast food/ultraprocessados", value: -2 },
            { id: "t2", text: "Dormir muito tarde (depois das 23h)", value: -1 },
            { id: "t3", text: "Procrastinar tarefas importantes", value: -2 },
            { id: "t4", text: "Excesso de redes sociais (>1h)", value: -1 },
            { id: "t5", text: "Reclamar ou ser negativo", value: -1 },
        ],
        disciplines: [
            { id: "d1", text: "Tomar banho frio", value: 2 },
            { id: "d2", text: "Acordar antes das 7h", value: 2 },
            { id: "d3", text: "Fazer alongamento/mobilidade", value: 1 },
            { id: "d4", text: "Ler por 30 minutos", value: 1 },
            { id: "d5", text: "Meditar por 10 minutos", value: 2 },
            { id: "d6", text: "Planejar o dia seguinte", value: 1 },
        ]
    };

    // Function to get combined ethics data (defaults + custom)
    function getCombinedEthicsData() {
        return {
            temptations: [...defaultEthicsData.temptations, ...customTemptations],
            disciplines: [...defaultEthicsData.disciplines, ...customDisciplines]
        };
    }

    // --- Initialization ---
    function init() {
        // Load data from localStorage (if available)
        loadState();

        // Set up initial view
        navigateTo('home'); // Start on the home section
        renderModuleContent(currentModuleLevel);
        renderDashboard();
        renderEthicsChoices();
        updateSeesaw(ethicsScore); // Initial seesaw position (using global beam)

        // Add event listeners
        setupEventListeners();

        // Check consecutive days on load
        checkConsecutiveDays();
    }

    // --- State Management (LocalStorage) ---
    function saveState() {
        const state = {
            currentModuleLevel,
            consecutiveDays,
            missionDiaryContent,
            lastLogDate: lastLogDate ? lastLogDate.toISOString() : null, // Store as ISO string
            moduleProgress,
            ethicsProgressToday: ethicsProgressToday, // Save daily checks
            customTemptations, // Save custom items
            customDisciplines, // Save custom items
            // Note: ethicsScoreToday is dynamically calculated based on ethicsProgressToday now
        };
        localStorage.setItem('operacaoTransformacaoState', JSON.stringify(state));
    }

    function loadState() {
        const savedState = localStorage.getItem('operacaoTransformacaoState');
        if (savedState) {
            try {
                const state = JSON.parse(savedState);
                currentModuleLevel = state.currentModuleLevel || 1;
                consecutiveDays = state.consecutiveDays || 0;
                missionDiaryContent = state.missionDiaryContent || '';
                lastLogDate = state.lastLogDate ? new Date(state.lastLogDate) : null;
                moduleProgress = state.moduleProgress || {};
                customTemptations = state.customTemptations || []; // Load custom items
                customDisciplines = state.customDisciplines || []; // Load custom items

                // Load ethics progress ONLY if it's from today
                if (lastLogDate && isToday(lastLogDate)) {
                    ethicsProgressToday = state.ethicsProgressToday || {};
                    ethicsScore = calculateScoreFromProgress(ethicsProgressToday); // Recalculate score based on loaded progress
                } else {
                    // It's a new day or no prior state
                    ethicsProgressToday = {}; // Reset daily progress
                    ethicsScore = 0; // Reset score
                }

                missionDiary.value = missionDiaryContent; // Update textarea
            } catch (e) {
                console.error("Error loading state:", e);
                // Clear potentially corrupted state
                localStorage.removeItem('operacaoTransformacaoState');
            }
        }
        // Initialize progress for modules if not present
        Object.keys(moduleData).forEach(level => {
            if (!moduleProgress[level]) {
                moduleProgress[level] = {};
                moduleData[level].days.forEach(dayData => {
                    moduleProgress[level][dayData.day] = false; // Default to not completed
                });
            }
        });
    }

    // --- Navigation ---
    function navigateTo(sectionId) {
        sections.forEach(section => {
            section.classList.remove('active-section');
            section.classList.add('hidden-section');
            if (section.id === sectionId) {
                section.classList.add('active-section');
                section.classList.remove('hidden-section');
            }
        });

        navButtons.forEach(button => {
            button.classList.remove('active');
            if (button.dataset.section === sectionId) {
                button.classList.add('active');
            }
        });

        // Special case: Update things when navigating TO specific sections
        if (sectionId === 'training-modules') {
            renderModuleContent(currentModuleLevel);
        } else if (sectionId === 'dashboard') {
            renderDashboard();
        } else if (sectionId === 'ethics-module') {
            renderEthicsChoices(); // Re-render to reflect current selections & custom items
            // No need to update seesaw here as it's always visible and updated on choice
        }
        // Always ensure global seesaw is updated when state might change (like loading)
        updateSeesaw(calculateScoreFromProgress(ethicsProgressToday));
    }

    // --- Rendering Functions ---

    function renderModuleContent(level) {
        currentModuleLevel = level; // Update state
        const module = moduleData[level];
        if (!module) {
            moduleContent.innerHTML = `<p>Módulo ${level} ainda não disponível.</p>`;
            return;
        }

        let html = `<h3>${module.name} - Cronograma Semanal</h3>`;
        html += '<div class="weekly-schedule">';

        module.days.forEach(dayData => {
            const isCompleted = moduleProgress[level] && moduleProgress[level][dayData.day];
            html += `
                <div class="day-schedule ${isCompleted ? 'day-completed' : ''}">
                    <h4>${dayData.day} ${isCompleted ? '<span class="completed-badge">(Completo)</span>' : ''}</h4>
                    <ul class="checklist exercise-list">
            `;
            if (dayData.exercises.length > 0 && dayData.exercises[0] !== "Descanso") {
                dayData.exercises.forEach((exercise, index) => {
                    // Simple checkbox approach for now - clicking the day marks all as done
                    html += `<li>${exercise}</li>`;
                });
            } else {
                html += `<li>${dayData.exercises[0]}</li>`; // Show "Descanso" or "WIP"
            }
            html += `</ul>`;
            // Add a completion button/indicator for the day
            if (dayData.exercises[0] !== "Descanso" && dayData.exercises[0] !== "WIP") {
                html += `<button class="day-complete-btn" data-level="${level}" data-day="${dayData.day}" ${isCompleted ? 'disabled' : ''}>
                            ${isCompleted ? 'Dia Concluído' : 'Marcar Dia Como Concluído'}
                          </button>`;
            }
            html += `</div>`; // Close day-schedule
        });

        html += '</div>'; // Close weekly-schedule
        moduleContent.innerHTML = html;

        // Update active tab
        document.querySelectorAll('#module-nav .module-tab').forEach(tab => {
            tab.classList.remove('active');
            if (parseInt(tab.dataset.level) === level) {
                tab.classList.add('active');
            }
        });

        // Add event listeners for the new day completion buttons
        document.querySelectorAll('.day-complete-btn').forEach(button => {
            button.addEventListener('click', handleDayCompletion);
        });
    }

    function renderDashboard() {
        currentModuleDisplay.textContent = `Módulo: ${moduleData[currentModuleLevel]?.name || 'N/A'}`;
        consecutiveDaysDisplay.textContent = `${consecutiveDays} dia${consecutiveDays !== 1 ? 's' : ''}`;
        renderInsignias();
    }

    function renderInsignias() {
        insigniasDisplay.innerHTML = ''; // Clear existing
        let earnedAny = false;

        // Simple insignia logic (example: based on consecutive days)
        if (consecutiveDays >= 7) {
            insigniasDisplay.innerHTML += createInsigniaSVG('Consistência Semanal'); // Replace with actual SVG later
            earnedAny = true;
        }
        if (consecutiveDays >= 30) {
            insigniasDisplay.innerHTML += createInsigniaSVG('Compromisso Mensal');
            earnedAny = true;
        }
        if (currentModuleLevel >= 3) {
            insigniasDisplay.innerHTML += createInsigniaSVG('Oficial Promovido');
            earnedAny = true;
        }
        // Add more insignia logic based on modules completed, ethics score streaks, etc.

        if (!earnedAny) {
            insigniasDisplay.innerHTML = '<span class="insignia-placeholder">Nenhuma ainda</span>';
        }
    }

    function createInsigniaSVG(title) {
        // Placeholder SVG - Replace with actual meaningful SVGs
        return `
            <svg class="insignia" viewBox="0 0 24 24" fill="currentColor" aria-label="${title}" title="${title}">
              <path d="M12 2 L15.09 8.09 L22 9.27 L17 14 L18.18 21.02 L12 17.77 L5.82 21.02 L7 14 L2 9.27 L8.91 8.09 L12 2z"/>
            </svg>
        `;
    }

    function renderEthicsChoices() {
        temptationsList.innerHTML = '';
        disciplinesList.innerHTML = '';
        const combinedData = getCombinedEthicsData();
        const currentScore = calculateScoreFromProgress(ethicsProgressToday);

        // Render Temptations (Defaults + Custom)
        combinedData.temptations.forEach(item => {
            const isChecked = ethicsProgressToday[item.id] || false;
            temptationsList.innerHTML += createEthicsListItem(item, isChecked);
        });

        // Render Disciplines (Defaults + Custom)
        combinedData.disciplines.forEach(item => {
            const isChecked = ethicsProgressToday[item.id] || false;
            disciplinesList.innerHTML += createEthicsListItem(item, isChecked);
        });

        // Add event listeners to ALL checkboxes (including newly rendered custom ones)
        document.querySelectorAll('#ethics-module input[type="checkbox"]').forEach(checkbox => {
            // Remove existing listener to prevent duplicates if re-rendering
            checkbox.removeEventListener('change', handleEthicsChoice);
            // Add the listener
            checkbox.addEventListener('change', handleEthicsChoice);
        });

        updateSeesaw(currentScore);
        selfControlScoreDisplay.textContent = currentScore;
    }

    // Helper to create list item HTML
    function createEthicsListItem(item, isChecked) {
        return `
            <li>
                <input type="checkbox" id="${item.id}" data-value="${item.value}" ${isChecked ? 'checked' : ''}>
                <label for="${item.id}">${item.text}</label>
                ${isCustomItem(item.id) ? `<button class="delete-item-btn" data-id="${item.id}" data-type="${item.value < 0 ? 'temptation' : 'discipline'}">X</button>` : ''}
            </li>
        `;
        // Note: Added a delete button for custom items. Need CSS and JS for it.
    }

    // Helper to check if an ID belongs to a custom item
    function isCustomItem(id) {
        return id.startsWith('c_t_') || id.startsWith('c_d_');
    }

    function updateSeesaw(score) {
        // Ensure the global seesaw beam element exists
        if (!globalSeesawBeam) {
            console.error("Global seesaw beam element not found!");
            return;
        }
        const maxRotation = 15; // Max degrees of rotation
        let rotation = 0;

        // Simple linear mapping: score range -10 to +10 maps to -15 to +15 degrees
        const scaleFactor = 1.5; // Adjust if needed
        rotation = Math.max(-maxRotation, Math.min(maxRotation, score * scaleFactor));

        // Apply rotation. Positive score tilts right (discipline), negative tilts left (temptation)
        globalSeesawBeam.style.transform = `rotate(${rotation}deg)`;
    }

    // --- Event Handlers ---
    function setupEventListeners() {
        // Bottom Navigation
        navButtons.forEach(button => {
            button.addEventListener('click', () => {
                navigateTo(button.dataset.section);
            });
        });

        // Start Program Button
        startProgramBtn.addEventListener('click', () => {
            navigateTo('training-modules');
        });

        // Module Navigation Tabs
        moduleNav.addEventListener('click', (e) => {
            if (e.target.classList.contains('module-tab')) {
                const level = parseInt(e.target.dataset.level);
                renderModuleContent(level);
            }
        });

        // Mission Diary Input
        missionDiary.addEventListener('input', (e) => {
            missionDiaryContent = e.target.value;
            saveState(); // Save diary content as user types (debouncing could be added)
        });

        // Log Ethics Button (Might be less critical now with auto-save)
        logEthicsBtn.addEventListener('click', handleLogEthics);

        // Add new ethics item listeners
        addTemptationBtn.addEventListener('click', () => handleAddItem('temptation'));
        addDisciplineBtn.addEventListener('click', () => handleAddItem('discipline'));

        // Delegate listener for delete buttons (since they are added dynamically)
        const ethicsChoicesContainer = document.querySelector('.ethics-choices');
        ethicsChoicesContainer.addEventListener('click', (event) => {
            if (event.target.classList.contains('delete-item-btn')) {
                handleDeleteItem(event.target.dataset.id, event.target.dataset.type);
            }
        });

        // Day Completion Buttons (Listeners added in renderModuleContent)
    }

    function handleDayCompletion(event) {
        const button = event.target;
        const level = button.dataset.level;
        const day = button.dataset.day;

        if (!moduleProgress[level]) {
            moduleProgress[level] = {};
        }
        moduleProgress[level][day] = true; // Mark as completed

        // Disable button and update UI immediately
        button.disabled = true;
        button.textContent = 'Dia Concluído';
        button.closest('.day-schedule').classList.add('day-completed');
        button.closest('.day-schedule').querySelector('h4').innerHTML += ' <span class="completed-badge">(Completo)</span>';

        // Check if all days in the *current* module are complete
        checkModuleCompletion(level);

        // Check for consecutive days (might need refinement based on actual date)
        // This simple check assumes completion implies "today"
        handleMissionAccomplished(); // Trigger confetti and day count

        saveState(); // Save progress
    }

    function handleMissionAccomplished() {
        // This function is now primarily for consecutive day tracking and confetti
        // triggered by handleDayCompletion
        const today = new Date();
        let updatedConsecutive = false;

        if (!lastLogDate || !isSameDay(lastLogDate, today)) {
            // If it's the first log ever or the first log for *today*
            if (lastLogDate && isYesterday(lastLogDate, today)) {
                // Logged yesterday, increment streak
                consecutiveDays++;
            } else if (!lastLogDate) {
                // First log ever
                consecutiveDays = 1;
            }
            else {
                // Missed a day or more, reset streak
                consecutiveDays = 1;
            }
            lastLogDate = today; // Update last log date
            updatedConsecutive = true;
        }
        // If already logged today, consecutive days don't change here

        // Launch confetti!
        confetti({
            particleCount: 150,
            spread: 90,
            origin: { y: 0.6 }
        });

        if(updatedConsecutive) {
            renderDashboard(); // Update dashboard if consecutive days changed
            saveState();
        }
    }

    function handleEthicsChoice(event) {
        const checkbox = event.target;
        const id = checkbox.id;
        const isChecked = checkbox.checked;

        // Update today's progress tracker
        ethicsProgressToday[id] = isChecked;

        // Recalculate score based on current progress
        ethicsScore = calculateScoreFromProgress(ethicsProgressToday);

        // Update score display in ethics module
        selfControlScoreDisplay.textContent = ethicsScore;
        // Update the global seesaw visual
        updateSeesaw(ethicsScore);

        // Auto-save the progress for today
        saveEthicsStateForToday();
    }

    // Function to calculate score based on the progress object
    function calculateScoreFromProgress(progress) {
        let score = 0;
        const combinedData = getCombinedEthicsData(); // Get all items

        for (const id in progress) {
            if (progress[id]) { // If the item is checked
                // Find the item in either temptations or disciplines
                const item = combinedData.temptations.find(t => t.id === id) || combinedData.disciplines.find(d => d.id === id);
                if (item) {
                    score += item.value; // Add its value
                }
            }
        }
        return score;
    }

    function handleLogEthics() {
        // This function mainly just confirms the state is saved and potentially updates UI
        saveEthicsStateForToday(); // Ensure state is saved
        updateSeesaw(ethicsScore); // Ensure seesaw reflects final score for the day
        alert(`Progresso de hoje salvo! Pontuação atual: ${ethicsScore}`);
    }

    // Function to add a new custom ethics item
    function handleAddItem(type) {
        const input = (type === 'temptation') ? newTemptationInput : newDisciplineInput;
        const text = input.value.trim();

        if (!text) {
            alert("Por favor, insira o texto para o item.");
            return;
        }

        const newItem = {
            id: `c_${type.charAt(0)}_${Date.now()}`, // Unique ID (custom_temptation/discipline_timestamp)
            text: text,
            value: (type === 'temptation') ? -1 : 1 // Default values
        };

        if (type === 'temptation') {
            customTemptations.push(newItem);
            temptationsList.innerHTML += createEthicsListItem(newItem, false); // Add to DOM
        } else {
            customDisciplines.push(newItem);
            disciplinesList.innerHTML += createEthicsListItem(newItem, false); // Add to DOM
        }

        // Add listener to the new checkbox immediately
        const newCheckbox = document.getElementById(newItem.id);
        if (newCheckbox) {
            newCheckbox.addEventListener('change', handleEthicsChoice);
        }
        // Add listener for the new delete button (delegated listener handles this)

        input.value = ''; // Clear input
        saveState(); // Save the updated custom items list
        console.log("Custom item added:", newItem);
    }

    // Function to delete a custom ethics item
    function handleDeleteItem(idToDelete, type) {
        if (!confirm("Tem certeza que deseja remover este item personalizado?")) {
            return;
        }

        // Remove from the appropriate array
        if (type === 'temptation') {
            customTemptations = customTemptations.filter(item => item.id !== idToDelete);
        } else {
            customDisciplines = customDisciplines.filter(item => item.id !== idToDelete);
        }

        // Remove from today's progress if it exists
        if (ethicsProgressToday.hasOwnProperty(idToDelete)) {
            delete ethicsProgressToday[idToDelete];
        }

        // Re-render the choices to remove it from the DOM and update score/seesaw
        renderEthicsChoices();

        // Save the updated state (custom items list and potentially today's progress)
        saveState();
        saveEthicsStateForToday(); // Ensure daily progress reflects the deletion

        console.log("Custom item deleted:", idToDelete);
    }

    function saveEthicsStateForToday() {
        const today = new Date();
        // Only update lastLogDate if it's not already today, or if it's null
        if (!lastLogDate || !isToday(lastLogDate)) {
            lastLogDate = today;
        }

        // Save the current state of checkboxes for today
        const state = JSON.parse(localStorage.getItem('operacaoTransformacaoState') || '{}');
        state.lastLogDate = lastLogDate.toISOString();
        state.ethicsProgressToday = ethicsProgressToday; // Save the checkbox states for today
        // Also save potentially updated custom lists and other state
        state.customTemptations = customTemptations;
        state.customDisciplines = customDisciplines;
        state.currentModuleLevel = currentModuleLevel;
        state.consecutiveDays = consecutiveDays;
        state.missionDiaryContent = missionDiaryContent;
        state.moduleProgress = moduleProgress;

        localStorage.setItem('operacaoTransformacaoState', JSON.stringify(state));
    }

    // --- Helper Functions ---
    function isSameDay(date1, date2) {
        if (!date1 || !date2) return false;
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }

    function isToday(date) {
        if (!date) return false;
        const today = new Date();
        return isSameDay(date, today);
    }

    function isYesterday(date1, date2) {
        if (!date1 || !date2) return false;
        const yesterday = new Date(date2);
        yesterday.setDate(date2.getDate() - 1);
        return isSameDay(date1, yesterday);
    }

    function checkConsecutiveDays() {
        const today = new Date();
        if (lastLogDate && !isToday(lastLogDate) && !isYesterday(lastLogDate, today)) {
            // If the last log wasn't today OR yesterday, reset the streak
            console.log("Resetting consecutive days streak.");
            consecutiveDays = 0;
            saveState(); // Save the reset streak
        } else if (!lastLogDate) {
            // No log date ever, ensure streak is 0
            consecutiveDays = 0;
            saveState();
        }
        renderDashboard(); // Update display
    }

    function checkModuleCompletion(level) {
        const module = moduleData[level];
        const progress = moduleProgress[level];
        if (!module || !progress) return;

        const allDaysCompleted = module.days.every(dayData => {
            // Consider "Descanso" as automatically completed for module progression? Or require explicit check?
            // For now, let's assume non-exercise days don't block progression.
            return dayData.exercises[0] === "Descanso" || dayData.exercises[0] === "WIP" || progress[dayData.day];
        });

        if (allDaysCompleted) {
            console.log(`Module ${level} (${module.name}) completed!`);
            // Optionally: Award insignia, unlock next module, show celebration
            alert(`Parabéns! Módulo ${module.name} concluído!`);

            // Auto-advance to next module? (Optional)
            const nextLevel = parseInt(level) + 1;
            if (moduleData[nextLevel]) {
                currentModuleLevel = nextLevel;
                renderModuleContent(currentModuleLevel); // Render the new module immediately
                navigateTo('training-modules'); // Switch view to training
                alert(`Você avançou para o módulo ${moduleData[currentModuleLevel].name}!`);
            } else {
                alert("Você completou todos os módulos disponíveis! Lendário!");
                // Handle program completion
            }
            renderDashboard(); // Update dashboard with new module name etc.
            saveState(); // Save the new current level
        }
    }

    // --- Load initial state ---
    init();
});

// Add CSS for the delete button
const styleSheet = document.createElement("style");
styleSheet.textContent = `
.delete-item-btn {
    background-color: #ff6b6b; /* Reddish */
    color: white;
    border: none;
    border-radius: 50%;
    width: 18px;
    height: 18px;
    font-size: 10px;
    line-height: 16px; /* Center 'X' */
    text-align: center;
    cursor: pointer;
    margin-left: 8px;
    padding: 0;
    font-weight: bold;
    transition: background-color 0.2s ease;
}
.delete-item-btn:hover {
    background-color: #e74c3c; /* Darker red */
}
.ethics-choices li {
    display: flex;
    align-items: center;
    justify-content: space-between; /* Align checkbox/label and delete button */
    margin-bottom: 0.8rem;
}
.ethics-choices li > label {
     margin-right: auto; /* Push delete button to the right */
     padding-left: 10px; /* Space between checkbox and label */
}

`;
document.head.appendChild(styleSheet);