// Игровое состояние
let gameState = {
    selectedClub: null,
    opponentsList: null, // Список оппонентов (исключая выбранную команду)
    currentOpponentIndex: 0,
    currentOpponentHP: 0,
    maxOpponentHP: 0,
    spinsLeft: 6,
    defeatedCount: 0,
    boostedPlayers: new Set(), // ID усиленных игроков
    isSpinning: false,
    audioContext: null, // AudioContext для звуков
    musicAudio: null,
    spinAudio: null,
    spinAudioTimeout: null,
    cheerAudio: null,
    whistleAudio: null,
    shotAudio: null,
    spinCount: 0,
    bonusGiven: false,
    penaltyWillTrigger: false,
    penaltyActive: false,
    penaltyPhase: null,
    penaltyPlayer: null,
    penaltySlotIndex: null,
    penaltyOccurred: false,
    playerRevealNodes: [],
    randomizeSoundNodes: [],
    lastProgressPercent: 100,
    bonusClaimedThisRound: false,
    pendingSirenaBonus: 0,
    sirenaClaimed: false,
    tutorialActive: false,
    tutorialStep: null,
    tutorialCompletedIntro: false,
    tutorialCompletedCard: false
};

// Инициализация AudioContext
function initAudio() {
    try {
        if (!gameState.audioContext) {
            gameState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
    } catch (e) {
        console.warn('Web Audio API не поддерживается', e);
    }
    initBackgroundMusic();
    initGameSounds();
}

function initBackgroundMusic() {
    if (!gameState.musicAudio) {
        const music = new Audio('music/background.mp3');
        music.loop = true;
        music.volume = 0.2;
        gameState.musicAudio = music;
    }
}

function initGameSounds() {
    if (!gameState.spinAudio) {
        const spin = new Audio('sound/spin.mp3');
        spin.preload = 'auto';
        spin.loop = true;
        spin.volume = 0.55;
        gameState.spinAudio = spin;
    }
    if (!gameState.cheerAudio) {
        const cheer = new Audio('sound/cheer.mp3');
        cheer.preload = 'auto';
        cheer.loop = true;
        cheer.volume = 0.6;
        gameState.cheerAudio = cheer;
    }
    if (!gameState.whistleAudio) {
        const whistle = new Audio('sound/whistle.mp3');
        whistle.preload = 'auto';
        whistle.loop = false;
        whistle.volume = 0.7;
        gameState.whistleAudio = whistle;
    }
    if (!gameState.shotAudio) {
        const shot = new Audio('sound/shot.mp3');
        shot.preload = 'auto';
        shot.loop = false;
        shot.volume = 0.7;
        gameState.shotAudio = shot;
    }
}

function startBackgroundMusic() {
    if (gameState.musicAudio) {
        if (gameState.musicAudio.paused) {
            gameState.musicAudio.play().catch(() => {});
        }
    }
}

function ensureBackgroundMusic() {
    initAudio();
    if (gameState.audioContext && gameState.audioContext.state === 'suspended') {
        try {
            gameState.audioContext.resume();
        } catch (e) {
            // ignore resume errors
        }
    }
    startBackgroundMusic();
}

function playButtonClickSound() {
    if (!gameState.audioContext) {
        initAudio();
    }
    if (!gameState.audioContext) return;

    try {
        if (gameState.audioContext.state === 'suspended') {
            gameState.audioContext.resume().catch(() => {});
        }
        const now = gameState.audioContext.currentTime;
        const osc = gameState.audioContext.createOscillator();
        const gain = gameState.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, now);
        osc.frequency.exponentialRampToValueAtTime(110, now + 0.18);

        gain.gain.setValueAtTime(0.35, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

        osc.connect(gain);
        gain.connect(gameState.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.2);
    } catch (e) {
        console.warn('Ошибка воспроизведения кнопочного звука', e);
    }
}

function startSpinSound(duration) {
    initAudio();
    const audio = gameState.spinAudio;
    if (!audio) return;

    try {
        if (!audio.paused) {
            audio.currentTime = 0;
        } else {
            audio.currentTime = 0;
        }
        audio.play().catch(() => {});
        if (typeof duration === 'number' && duration > 0) {
            if (gameState.spinAudioTimeout) {
                clearTimeout(gameState.spinAudioTimeout);
            }
            gameState.spinAudioTimeout = setTimeout(() => {
                stopSpinSound();
            }, duration + 50);
        }
    } catch (e) {
        console.warn('Ошибка воспроизведения звука вращения', e);
    }
}

function stopSpinSound() {
    if (gameState.spinAudioTimeout) {
        clearTimeout(gameState.spinAudioTimeout);
        gameState.spinAudioTimeout = null;
    }

    const audio = gameState.spinAudio;
    if (!audio) return;

    try {
        audio.pause();
        audio.currentTime = 0;
    } catch (e) {
        console.warn('Ошибка остановки звука вращения', e);
    }
}

function playCheerSound() {
    initAudio();
    const audio = gameState.cheerAudio;
    if (!audio) return;
    try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } catch (e) {
        console.warn('Ошибка воспроизведения звука победы', e);
    }
}

function stopCheerSound() {
    const audio = gameState.cheerAudio;
    if (!audio) return;
    try {
        audio.pause();
        audio.currentTime = 0;
    } catch (e) {
        console.warn('Ошибка остановки звука победы', e);
    }
}

function playWhistleSound() {
    initAudio();
    const audio = gameState.whistleAudio;
    if (!audio) return;
    try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } catch (e) {
        console.warn('Ошибка воспроизведения звука свистка', e);
    }
}

function playPlayerRevealSound(pitch = 1) {
    if (!gameState.audioContext) {
        initAudio();
    }
    if (!gameState.audioContext) return;

    try {
        if (gameState.audioContext.state === 'suspended') {
            gameState.audioContext.resume().catch(() => {});
        }
        const now = gameState.audioContext.currentTime;
        const osc = gameState.audioContext.createOscillator();
        const gain = gameState.audioContext.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320 * pitch, now);
        osc.frequency.exponentialRampToValueAtTime(180 * pitch, now + 0.22);

        gain.gain.setValueAtTime(0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

        osc.connect(gain);
        gain.connect(gameState.audioContext.destination);

        osc.start(now);
        osc.stop(now + 0.3);

        gameState.playerRevealNodes.push({ oscillator: osc, gain });
    } catch (e) {
        console.warn('Ошибка воспроизведения звука выпадения игрока', e);
    }
}

function startPlayerRandomizeSound() {
    if (!gameState.audioContext) {
        initAudio();
    }
    if (!gameState.audioContext) return;

    try {
        if (gameState.audioContext.state === 'suspended') {
            gameState.audioContext.resume().catch(() => {});
        }
        const now = gameState.audioContext.currentTime;

        const noiseBuffer = gameState.audioContext.createBuffer(1, gameState.audioContext.sampleRate * 0.3, gameState.audioContext.sampleRate);
        const data = noiseBuffer.getChannelData(0);
        for (let i = 0; i < data.length; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.4;
        }

        const noiseSource = gameState.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        const filter = gameState.audioContext.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.setValueAtTime(600, now);
        filter.Q.setValueAtTime(3, now);

        const gain = gameState.audioContext.createGain();
        gain.gain.setValueAtTime(0.12, now);

        noiseSource.connect(filter);
        filter.connect(gain);
        gain.connect(gameState.audioContext.destination);

        noiseSource.start(now);

        gameState.randomizeSoundNodes.push({ noiseSource, gain });
    } catch (e) {
        console.warn('Ошибка воспроизведения фонового звука выдачи', e);
    }
}

function stopPlayerRandomizeSound() {
    if (!gameState.randomizeSoundNodes.length) return;
    const now = gameState.audioContext?.currentTime || 0;
    gameState.randomizeSoundNodes.forEach(({ noiseSource, gain }) => {
        try {
            if (gain && gain.gain) {
                gain.gain.setTargetAtTime(0.0001, now, 0.08);
            }
            if (noiseSource) {
                noiseSource.stop(now + 0.1);
            }
        } catch (e) {
            // ignore stop errors
        }
    });
    gameState.randomizeSoundNodes = [];
}

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Элементы DOM
const screens = {
    clubSelection: document.getElementById('clubSelectionScreen'),
    opponentsMap: document.getElementById('opponentsMapScreen'),
    game: document.getElementById('gameScreen'),
    postRound: document.getElementById('postRoundScreen'),
    upgrade: document.getElementById('upgradeScreen'),
    result: document.getElementById('resultScreen')
};

const ROLE_BONUSES = {
    G: 2.0,
    D: 1.3,
    M: 1.2,
    F: 1.5
};

const ROLE_COMBO_NAMES = {
    G: 'Комбо вратарей',
    D: 'Комбо защитников',
    M: 'Комбо полузащитников',
    F: 'Комбо нападающих'
};

const MACHINE_TITLE_DEFAULT = '⚽ Команда атакует ⚽';
const MACHINE_TITLE_PENALTY = '⚽ Пенальти! ⚽';
const PENALTY_SUBTITLE_TEXT = 'Бьет 1 игрок. Если забьет – бонус x3. Чем выше сила игрок, тем вероятнее гол.';

function setMachineTitle(text) {
    const el = document.getElementById('machineTitle');
    if (el) {
        el.textContent = text;
    }
}

function setMachineSubtitle(text) {
    const el = document.getElementById('machineSubtitle');
    if (el) {
        el.textContent = text || '';
    }
}

function showTutorialOverlay(step, { title, description = [], list = [], primaryText = 'Продолжить', allowClose = false }) {
    return new Promise(resolve => {
        if (gameState.tutorialActive) {
            resolve();
            return;
        }

        gameState.tutorialActive = true;
        gameState.tutorialStep = step;

        const overlay = document.createElement('div');
        overlay.className = 'tutorial-overlay';
        overlay.dataset.step = step;

        const content = document.createElement('div');
        content.className = 'tutorial-content';

        if (allowClose) {
            const closeButton = document.createElement('button');
            closeButton.className = 'tutorial-close';
            closeButton.type = 'button';
            closeButton.setAttribute('aria-label', 'Закрыть');
            closeButton.innerHTML = '&times;';
            closeButton.addEventListener('click', () => finish());
            content.appendChild(closeButton);
        }

        if (title) {
            const heading = document.createElement('h3');
            heading.textContent = title;
            content.appendChild(heading);
        }

        description.forEach(text => {
            const paragraph = document.createElement('p');
            paragraph.textContent = text;
            content.appendChild(paragraph);
        });

        if (list.length) {
            const listEl = document.createElement('ul');
            listEl.className = 'tutorial-list';
            list.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                listEl.appendChild(li);
            });
            content.appendChild(listEl);
        }

        const actions = document.createElement('div');
        actions.className = 'tutorial-actions';
        const primaryButton = document.createElement('button');
        primaryButton.type = 'button';
        primaryButton.className = 'tutorial-button primary';
        primaryButton.textContent = primaryText;
        primaryButton.addEventListener('click', () => finish());
        actions.appendChild(primaryButton);

        content.appendChild(actions);
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        requestAnimationFrame(() => {
            overlay.classList.add('visible');
        });

        function finish() {
            if (!overlay.parentNode) {
                return;
            }
            overlay.classList.remove('visible');
            setTimeout(() => {
                overlay.remove();
            }, 200);
            gameState.tutorialActive = false;
            gameState.tutorialStep = null;
            resolve();
        }
    });
}

async function triggerTutorialIntro() {
    if (gameState.tutorialCompletedIntro) {
        return;
    }
    const spinButton = document.getElementById('spinButton');
    if (spinButton) {
        spinButton.disabled = true;
    }
    await showTutorialOverlay('intro', {
        title: 'Как играть?',
        description: [
            'Твоя цель — ВЫБИТЬ ВСЕ ОЧКИ ЗДОРОВЬЯ соперника до того, как закончатся атаки.'
        ],
        list: [
            'ЖМИ КНОПКУ В ЦЕНТРЕ, чтобы запустить атаку',
            'У каждого игрока на карточке написана сила. Сумма сил трёх выпавших игроков = ОБЩИЙ УРОН атаки'
        ],
        primaryText: 'Понятно'
    });
    gameState.tutorialCompletedIntro = true;
    updateGameUI();
}

async function triggerTutorialCardInfo() {
    if (gameState.tutorialCompletedCard) {
        return;
    }

    await showTutorialOverlay('card-info', {
        title: 'Разберём карточку игрока',
        description: [
            'Буква в углу показывает амплуа (G, D, M, F). Комбо из трёх одинаковых амплуа усиливает атаку.',
            'Под фамилией — редкость. Чем она выше, тем реже игрок выпадает.',
            'Число в центре — сила, которая списывается с HP соперника.'
        ],
        list: [],
        primaryText: 'Продолжить',
        allowClose: true
    });

    gameState.tutorialCompletedCard = true;
}

// Инициализация игры
async function init() {
    try {
        await ensureArsenalPlayersLoaded();
    } catch (error) {
        console.error('[Init] Не удалось загрузить состав Арсенала из CSV, используется запасной набор', error);
    }

    initAudio();
    renderClubSelection();
    setupEventListeners();
}

// Отрисовка экрана выбора клуба
function renderClubSelection() {
    const grid = document.getElementById('clubsGrid');
    grid.innerHTML = '';
    
    PREMIER_LEAGUE_CLUBS.forEach((club, index) => {
        const card = document.createElement('div');
        card.className = 'club-card';
        
        // Добавляем логотип, если он есть
        let logoHTML = '';
        if (CLUB_LOGOS[club.id] && CLUB_LOGOS[club.id].image) {
            logoHTML = `<img src="${CLUB_LOGOS[club.id].image}" alt="${club.name}" class="club-card-logo">`;
        }
        
        card.innerHTML = `
            ${logoHTML}
            <div class="club-name">${club.name}</div>
        `;
        
        if (index === 0) {
            // Арсенал - доступен для выбора
            card.addEventListener('click', () => selectClub(club));
        } else {
            // Остальные клубы - заблокированы
            card.classList.add('locked');
        }
        
        grid.appendChild(card);
    });
}

// Выбор клуба
function selectClub(club) {
    gameState.selectedClub = club;
    showOpponentsMap();
}

function renderOpponentsMap(container, opponentsList, { showStatus = false } = {}) {
    if (!container) {
        return;
    }

    container.innerHTML = '';

    if (!opponentsList || !opponentsList.length) {
        return;
    }

    const wrapper = document.createElement('div');
    wrapper.className = showStatus ? 'post-round-map' : 'opponents-map';
    container.appendChild(wrapper);

    opponentsList.forEach((opponent, index) => {
        const card = document.createElement('div');
        card.className = 'opponent-map-card';

        let statusLabel = '';
        if (showStatus) {
            if (index < gameState.defeatedCount) {
                card.classList.add('defeated');
                statusLabel = 'Побеждён';
            } else if (index === gameState.defeatedCount && gameState.defeatedCount < opponentsList.length) {
                card.classList.add('next');
                statusLabel = 'Следующий';
            } else {
                card.classList.add('upcoming');
            }
        }

        let logoHTML = '';
        if (CLUB_LOGOS[opponent.id] && CLUB_LOGOS[opponent.id].image) {
            logoHTML = `<img src="${CLUB_LOGOS[opponent.id].image}" alt="${opponent.name}" class="opponent-map-logo">`;
        }

        card.innerHTML = `
            <div class="opponent-map-number">${index + 1}</div>
            ${statusLabel ? `<div class="opponent-status-badge">${statusLabel}</div>` : ''}
            ${logoHTML}
            <div class="opponent-map-name">${opponent.name}</div>
            <div class="opponent-map-hp">HP: ${opponent.hp}</div>
        `;

        wrapper.appendChild(card);
    });
}

// Показ карты оппонентов
function showOpponentsMap() {
    const opponentsList = getOpponentsList(gameState.selectedClub.id);
    const mapContainer = document.getElementById('opponentsMap');
    gameState.opponentsList = opponentsList;
    renderOpponentsMap(mapContainer, opponentsList, { showStatus: false });
    
    showScreen('opponentsMap');
}

// Начало игры
function startGame() {
    if (!gameState.opponentsList || gameState.opponentsList.length === 0) {
        // Если список оппонентов не создан, создаем его
        gameState.opponentsList = getOpponentsList(gameState.selectedClub.id);
    }

    ensureBackgroundMusic();
    
    gameState.currentOpponentIndex = 0; // Начинаем с первого оппонента
    gameState.defeatedCount = 0;
    gameState.boostedPlayers.clear();
    gameState.spinCount = 0;
    gameState.spinsLeft = 6;
    gameState.bonusGiven = false;
    gameState.lastProgressPercent = 100;
    gameState.penaltyWillTrigger = false;
    gameState.penaltyActive = false;
    gameState.penaltyPhase = null;
    gameState.penaltyPlayer = null;
    gameState.penaltySlotIndex = null;
    gameState.penaltyOccurred = false;
    gameState.isSpinning = false;

    setMachineTitle(MACHINE_TITLE_DEFAULT);
    setMachineSubtitle('');
    
    loadOpponent();
    showScreen('game');
    triggerTutorialIntro();
}

// Вспомогательная функция для конвертации hex в RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Загрузка оппонента
function loadOpponent() {
    if (!gameState.opponentsList || gameState.currentOpponentIndex >= gameState.opponentsList.length) {
        return;
    }
    
    const opponent = gameState.opponentsList[gameState.currentOpponentIndex];
    gameState.maxOpponentHP = opponent.hp;
    gameState.currentOpponentHP = opponent.hp;
    gameState.spinsLeft = 6;
    gameState.spinCount = 0;
    gameState.bonusGiven = false;
    gameState.penaltyWillTrigger = Math.random() < 0.033;
    gameState.penaltyActive = false;
    gameState.penaltyPhase = null;
    gameState.penaltyPlayer = null;
    gameState.penaltySlotIndex = null;
    gameState.penaltyOccurred = false;
    gameState.isSpinning = false;
    gameState.bonusClaimedThisRound = false;
    gameState.pendingSirenaBonus = 0;
    gameState.awaitingBonusChoice = false;
    gameState.sirenaClaimed = false;

    resetSlotsUI();

    const damageDisplay = document.getElementById('damageDisplay');
    if (damageDisplay) {
        damageDisplay.classList.remove('damage-pop', 'damage-display-active', 'damage-breakdown-active');
        damageDisplay.innerHTML = '';
        damageDisplay.textContent = '';
    }

    setMachineTitle(MACHINE_TITLE_DEFAULT);
    setMachineSubtitle('');
    
    updateGameUI();
}

function resetSlotsUI() {
    ['slot1', 'slot2', 'slot3'].forEach(id => {
        const slot = document.getElementById(id);
        if (slot) {
            slot.classList.remove('spinning');
            const container = slot.querySelector('.slot-item-container');
            if (container) {
                container.innerHTML = '';
            }
        }
    });
}

function startPenaltyEvent() {
    if (gameState.spinsLeft === 0) {
        return false;
    }

    gameState.penaltyActive = true;
    gameState.penaltyPhase = 'awaitingSelection';
    gameState.penaltyPlayer = null;
    gameState.penaltySlotIndex = Math.floor(Math.random() * 3);
    gameState.penaltyOccurred = true;
    gameState.penaltyWillTrigger = false;

    gameState.spinCount = (gameState.spinCount || 0) + 1;
    gameState.spinsLeft--;
    updateGameUI();
    resetSlotsUI();

    setMachineTitle(MACHINE_TITLE_PENALTY);
    setMachineSubtitle(PENALTY_SUBTITLE_TEXT);
    showPenaltySelectionPrompt();

    const spinButton = document.getElementById('spinButton');
    if (spinButton) {
        const textSpan = spinButton.querySelector('.spin-button-text');
        if (textSpan) {
            textSpan.textContent = 'Выбери бьющего';
        }
    }

    return true;
}

async function handlePenaltyFlow() {
    const spinButton = document.getElementById('spinButton');
    if (spinButton) {
        spinButton.classList.remove('pulling');
        const textSpan = spinButton.querySelector('.spin-button-text');
        if (textSpan) {
            if (gameState.penaltyPhase === 'awaitingShot') {
                textSpan.textContent = 'Пробить пенальти';
            } else {
                textSpan.textContent = 'Выбери бьющего';
            }
        }
    }

    if (gameState.penaltyPhase === 'awaitingSelection') {
        await selectPenaltyShooter();
        return;
    }
    if (gameState.penaltyPhase === 'awaitingShot') {
        await resolvePenaltyShot();
    }
}

function getPenaltySlotElement() {
    const slotIds = ['slot1', 'slot2', 'slot3'];
    const slotId = slotIds[gameState.penaltySlotIndex] || slotIds[0];
    return document.getElementById(slotId);
}

function showPenaltySelectionPrompt() {
    const slotElement = getPenaltySlotElement();
    const container = slotElement ? slotElement.querySelector('.slot-item-container') : null;
    if (!container) {
        return;
    }

    container.innerHTML = `
        <div class="penalty-selection">
            <div class="penalty-selection-icon">⚽</div>
            <div class="penalty-selection-text">Нажми «Выбери бьющего», чтобы определить исполнителя</div>
        </div>
    `;
}

function renderPenaltyShooterCard(slotElement, player) {
    const container = slotElement ? slotElement.querySelector('.slot-item-container') : null;
    if (!container || !player) {
        return;
    }

    const playerMarkup = getPlayerCardMarkup(player, player.rating);

    container.innerHTML = `
        <div class="penalty-card penalty-card--full">
            ${playerMarkup}
        </div>
    `;
}

async function selectPenaltyShooter() {
    if (gameState.isSpinning || gameState.penaltyPhase !== 'awaitingSelection') {
        return;
    }

    const slotElement = getPenaltySlotElement();
    if (!slotElement) {
        return;
    }
    const container = slotElement.querySelector('.slot-item-container');
    if (!container) {
        return;
    }

    gameState.isSpinning = true;
    startSpinSound(1400);
    slotElement.classList.add('spinning');
    createSpinningEffect(slotElement);
    stopPlayerRandomizeSound();
    startPlayerRandomizeSound();

    try {
        await wait(1400);
    } finally {
        stopSpinSound();
        stopPlayerRandomizeSound();
        slotElement.classList.remove('spinning');
    }

    const player = getRandomPlayer();
    gameState.penaltyPlayer = player;

    renderPenaltyShooterCard(slotElement, player);
    playPlayerRevealSound(1.15);

    const spinButton = document.getElementById('spinButton');
    if (spinButton) {
        const textSpan = spinButton.querySelector('.spin-button-text');
        if (textSpan) {
            textSpan.textContent = 'Пробить пенальти';
        }
    }

    gameState.penaltyPhase = 'awaitingShot';
    gameState.isSpinning = false;
    return player;
}

async function resolvePenaltyShot() {
    const slotElement = getPenaltySlotElement();
    const container = slotElement ? slotElement.querySelector('.slot-item-container') : null;
    const player = gameState.penaltyPlayer;
    if (!container || !player) {
        gameState.penaltyActive = false;
        gameState.penaltyPhase = null;
        return;
    }

    const successChance = Math.min(0.95, 0.4 + (player.rating / 200));
    const success = Math.random() < successChance;

    container.innerHTML = `
        <div class="penalty-result ${success ? 'penalty-success' : 'penalty-fail'}">
            <div class="penalty-result-title">${success ? 'Пенальти реализован!' : 'Пенальти не забит'}</div>
            <div class="penalty-result-meta">${player.name}</div>
        </div>
    `;

    if (success) {
        await applyDamageForPlayers([player], [slotElement], {
            multiplierOverride: 3,
            comboTextOverride: 'Пенальти'
        });
    } else {
        const damageDisplay = document.getElementById('damageDisplay');
        if (damageDisplay) {
            damageDisplay.classList.remove('damage-display-active', 'damage-breakdown-active');
            damageDisplay.innerHTML = '';
            damageDisplay.textContent = 'Пенальти не забит';
            damageDisplay.classList.add('damage-pop');
            setTimeout(() => damageDisplay.classList.remove('damage-pop'), 10);
            setTimeout(() => {
                damageDisplay.textContent = '';
            }, 2000);
        }
    }

    const spinButton = document.getElementById('spinButton');
    if (spinButton) {
        const textSpan = spinButton.querySelector('.spin-button-text');
        if (textSpan) {
            textSpan.textContent = 'Атаковать';
        }
    }

    setMachineTitle(MACHINE_TITLE_DEFAULT);
    setMachineSubtitle('');

    gameState.penaltyActive = false;
    gameState.penaltyPhase = null;
    gameState.penaltyPlayer = null;
    gameState.penaltySlotIndex = null;
    gameState.isSpinning = false;

    updateGameUI();
    checkGameState();
}

async function applyPenaltyDamage(player, slotElement) {
    const damage = gameState.boostedPlayers.has(player.id) ? player.rating * 2 : player.rating;

    playHitSound();
    applyHitEffect([slotElement], damage);

    const damageDisplay = document.getElementById('damageDisplay');
    if (damageDisplay) {
        damageDisplay.classList.remove('damage-display-active', 'damage-breakdown-active');
        damageDisplay.innerHTML = '';
        damageDisplay.textContent = `Пенальти: -${damage}`;
        damageDisplay.classList.add('damage-pop');
        setTimeout(() => damageDisplay.classList.remove('damage-pop'), 10);
    }

    await wait(520);

    gameState.currentOpponentHP = Math.max(0, gameState.currentOpponentHP - damage);

    const hpBarFill = document.getElementById('opponentHPBar');
    const hpBarContainer = document.querySelector('.hp-bar-container');

    if (hpBarFill) {
        hpBarFill.classList.add('damaged');
        setTimeout(() => {
            hpBarFill.classList.remove('damaged');
        }, 400);
    }

    if (hpBarContainer) {
        hpBarContainer.classList.add('hp-bar-hit');
        setTimeout(() => {
            hpBarContainer.classList.remove('hp-bar-hit');
        }, 400);
    }

    updateGameUI();

    if (damageDisplay) {
        setTimeout(() => {
            damageDisplay.textContent = '';
        }, 2000);
    }

    return damage;
}

function renderBonusCard(slotElement) {
    const container = slotElement ? slotElement.querySelector('.slot-item-container') : null;
    if (!container) {
        return Promise.resolve(0);
    }

    const hadRandomizeSound = gameState.randomizeSoundNodes && gameState.randomizeSoundNodes.length;
    if (hadRandomizeSound) {
        stopPlayerRandomizeSound();
    }

    gameState.awaitingBonusChoice = true;
    gameState.pendingSirenaBonus = 0;

    container.innerHTML = `
        <div class="bonus-card">
            <div class="bonus-card-title">Бонус от Sirena Bet</div>
            <div class="bonus-card-actions">
                <button class="bonus-card-button primary">Перейти и получить 600</button>
                <button class="bonus-card-button secondary">Не хочу</button>
            </div>
        </div>
    `;

    return new Promise(resolve => {
        handleBonusCardButtons(container, resolve);
    });
}

function handleBonusCardButtons(container, resolve = () => {}) {
    const primaryButton = container.querySelector('.bonus-card-button.primary');
    const secondaryButton = container.querySelector('.bonus-card-button.secondary');

    const showResult = (message, extraClass = '') => {
        container.innerHTML = `
            <div class="bonus-card bonus-card-result ${extraClass}">
                <div class="bonus-card-title">${message}</div>
            </div>
        `;
    };

    const finish = (bonusValue = 0) => {
        gameState.awaitingBonusChoice = false;
        resolve(bonusValue);
    };

    if (primaryButton) {
        primaryButton.addEventListener('click', () => {
            const reward = applyBonusReward(primaryButton, container);
            if (reward > 0) {
                showResult('Бонус Sirena Bet активирован!', 'bonus-card-result--accepted');
                window.open('https://sirena.world', '_blank');
                finish(reward);
                return;
            }
            finish(0);
        });
    }

    if (secondaryButton) {
        secondaryButton.addEventListener('click', () => {
            showResult('Бонус Sirena Bet пропущен', 'bonus-card-result--declined');
            finish(0);
        });
    }
}

function applyBonusReward(button, container) {
    if (gameState.bonusClaimedThisRound) {
        return 0;
    }
    gameState.bonusClaimedThisRound = true;

    const bonusValue = 600;
    gameState.pendingSirenaBonus = (gameState.pendingSirenaBonus || 0) + bonusValue;
    gameState.sirenaClaimed = true;

    button.classList.add('claimed');
    container.classList.add('bonus-claimed');

    return bonusValue;
}

// Обновление логотипа оппонента
function updateOpponentLogo() {
    if (!gameState.opponentsList || gameState.currentOpponentIndex >= gameState.opponentsList.length) {
        return;
    }
    
    const opponent = gameState.opponentsList[gameState.currentOpponentIndex];
    const logoContainer = document.getElementById('opponentLogo');
    
    if (logoContainer && CLUB_LOGOS[opponent.id]) {
        const logoData = CLUB_LOGOS[opponent.id];
        
        // Очищаем контейнер и создаем изображение
        logoContainer.innerHTML = '';
        const img = document.createElement('img');
        img.src = logoData.image;
        img.alt = opponent.name;
        img.className = 'club-logo-image';
        logoContainer.appendChild(img);
        
        const animationClass = 'logo-animation-rotate';
        logoContainer.className = `opponent-logo ${animationClass}`;
        
        // Применяем цвета команды к HP бару с эффектом свечения
        const hpBarFill = document.getElementById('opponentHPBar');
        if (hpBarFill && logoData.colors.length > 0) {
            const color1 = logoData.colors[0];
            const color2 = logoData.colors[1] || logoData.colors[0];
            // Создаем градиент с эффектом свечения (анимированный)
            hpBarFill.style.background = `linear-gradient(90deg, ${color1} 0%, ${color2} 50%, ${color1} 100%)`;
            hpBarFill.style.backgroundSize = '200% 100%';
            // Добавляем свечение в цвете команды
            const rgbColor = hexToRgb(color1);
            if (rgbColor) {
                hpBarFill.style.boxShadow = `
                    inset 0 2px 4px rgba(255,255,255,0.3),
                    0 0 15px rgba(${rgbColor.r}, ${rgbColor.g}, ${rgbColor.b}, 0.6)
                `;
            }
        }
    }
}

// Обновление игрового UI
function updateGameUI() {
    if (!gameState.opponentsList || gameState.currentOpponentIndex >= gameState.opponentsList.length) {
        return;
    }
    
    const opponent = gameState.opponentsList[gameState.currentOpponentIndex];
    document.getElementById('opponentName').textContent = opponent.name;
    document.getElementById('opponentHPText').textContent = 
        `${gameState.currentOpponentHP} / ${gameState.maxOpponentHP}`;
    
    const hpPercentage = (gameState.currentOpponentHP / gameState.maxOpponentHP) * 100;
    document.getElementById('opponentHPBar').style.width = `${hpPercentage}%`;
    
    const totalOpponents = gameState.opponentsList ? gameState.opponentsList.length : 19;
    const defeatedStat = document.querySelector('.game-stats .stat:first-child');
    if (defeatedStat) {
        defeatedStat.innerHTML = `Побеждено: <span id="defeatedCount">${gameState.defeatedCount}</span>/${totalOpponents}`;
    }
    document.getElementById('spinsLeft').textContent = gameState.spinsLeft;
    
    // Обновляем логотип оппонента
    updateOpponentLogo();
    
    // Обновляем состояние кнопки спина
    const spinButton = document.getElementById('spinButton');
    if (spinButton) {
        const shouldDisable = gameState.isSpinning || gameState.spinsLeft === 0;
        spinButton.disabled = shouldDisable;
        // Убедимся, что кнопка видима и кликабельна
        if (!shouldDisable) {
            spinButton.style.pointerEvents = 'auto';
            spinButton.style.opacity = '1';
        }
        if (gameState.tutorialActive && gameState.tutorialStep === 'intro') {
            spinButton.disabled = true;
        }
    }
}

// Спин слот-машины
async function spinSlots() {
    const spinButton = document.getElementById('spinButton');

    if (gameState.penaltyActive) {
        await handlePenaltyFlow();
        return;
    }

    if (gameState.spinsLeft === 0) {
        return;
    }

    const completedSpins = gameState.spinCount || 0;
    const upcomingSpinIndex = completedSpins + 1;
    const penaltyEligible = completedSpins > 0;
    if (penaltyEligible && !gameState.penaltyActive && !gameState.penaltyOccurred) {
        if (gameState.penaltyWillTrigger || upcomingSpinIndex >= 3) {
            if (startPenaltyEvent()) {
                if (spinButton) {
                    spinButton.classList.remove('pulling');
                }
                await handlePenaltyFlow();
                return;
            }
        }
    }

    if (gameState.isSpinning) {
        return;
    }
    
    gameState.isSpinning = true;
    gameState.spinCount = upcomingSpinIndex;
    gameState.spinsLeft--;
    updateGameUI();
    
    if (spinButton) {
        spinButton.classList.add('pulling');
    }

    const slotIds = ['slot1', 'slot2', 'slot3'];
    const slots = slotIds
        .map(id => document.getElementById(id))
        .filter(Boolean);

    if (!slots.length) {
        if (spinButton) {
            spinButton.classList.remove('pulling');
        }
        gameState.isSpinning = false;
        updateGameUI();
        return;
    }

    slots.forEach(slot => {
        const container = slot.querySelector('.slot-item-container');
        if (container) {
            container.innerHTML = '';
        }
    });

    const spinResults = [];
    const spinDuration = 2640;
    const settleDelay = 384;

    startPlayerRandomizeSound();

    try {
        for (let index = 0; index < slots.length; index++) {
            const slot = slots[index];
            startSpinSound(spinDuration);
            slot.classList.add('spinning');
            createSpinningEffect(slot);

            await wait(spinDuration);
            stopSpinSound();

            slot.classList.remove('spinning');
            let preferredRole = null;
            let roleBiasMultiplier = 1;

            if (spinResults.length) {
                const roleCounts = spinResults.reduce((acc, entry) => {
                    const role = entry.player?.role;
                    if (!role) return acc;
                    acc[role] = (acc[role] || 0) + 1;
                    return acc;
                }, {});

                const topEntry = Object.entries(roleCounts)
                    .sort((a, b) => b[1] - a[1])[0];

                if (topEntry) {
                    const [role, count] = topEntry;
                    preferredRole = role;
                    roleBiasMultiplier = count >= 2 ? 4 : 2.2;
                }
            }

            const player = getRandomPlayer(preferredRole, roleBiasMultiplier);
            renderPlayerInSlot(slot, player);
            spinResults.push({ player, slot });

            if (!gameState.tutorialCompletedCard) {
                const hadRandomizeSound = gameState.randomizeSoundNodes.length > 0;
                if (hadRandomizeSound) {
                    stopPlayerRandomizeSound();
                }
                await triggerTutorialCardInfo();
                if (hadRandomizeSound && index < slots.length - 1) {
                    startPlayerRandomizeSound();
                }
            }

            if (index < slots.length - 1) {
                await wait(settleDelay);
            }
        }

        stopPlayerRandomizeSound();
        stopSpinSound();

        if (!gameState.bonusGiven && !gameState.sirenaClaimed && gameState.spinCount >= 2 && spinResults.length) {
            const bonusIndex = Math.floor(Math.random() * spinResults.length);
            const bonusEntry = spinResults[bonusIndex];
            await renderBonusCard(bonusEntry.slot);
            spinResults.splice(bonusIndex, 1);
            gameState.bonusGiven = true;
        }

        if (spinResults.length) {
            const playersForDamage = spinResults.map(entry => entry.player);
            const slotsForDamage = spinResults.map(entry => entry.slot);
            await applyDamageForPlayers(playersForDamage, slotsForDamage);
        }
    } finally {
        stopPlayerRandomizeSound();
        stopSpinSound();
        if (spinButton) {
                    spinButton.classList.remove('pulling');
            const textSpan = spinButton.querySelector('.spin-button-text');
            if (textSpan) {
                textSpan.textContent = 'Атаковать';
            }
        }
        gameState.isSpinning = false;
                    updateGameUI();
                    checkGameState();
            }
}

// Получение случайного игрока с учетом усилений
function getRandomPlayer(preferredRole = null, roleBiasMultiplier = 1) {
    // Вычисляем веса с учетом усиленных игроков
    const weights = ARSENAL_PLAYERS.map(player => {
        let weight = 1; // Базовая вероятность для всех игроков одинаковая
        if (gameState.boostedPlayers.has(player.id)) {
            weight *= BOOSTED_WEIGHT_MULTIPLIER; // Усиленные игроки выпадают в 2 раза чаще
        }
        if (preferredRole && player.role === preferredRole && roleBiasMultiplier > 1) {
            weight *= roleBiasMultiplier;
        }
        return weight;
    });
    
    // Взвешенный случайный выбор
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < ARSENAL_PLAYERS.length; i++) {
        random -= weights[i];
        if (random <= 0) {
            return ARSENAL_PLAYERS[i];
        }
    }
    
    return ARSENAL_PLAYERS[0];
}

// Создание эффекта прокрутки
function createSpinningEffect(slotElement) {
    const container = slotElement.querySelector('.slot-item-container');
    const players = [];
    
    // Генерируем несколько случайных игроков для эффекта прокрутки
    for (let i = 0; i < 8; i++) {
        players.push(getRandomPlayer());
    }
    
    // Создаем длинную полосу с игроками для плавной прокрутки
    container.innerHTML = players.map((player, index) => {
        const actualRating = gameState.boostedPlayers.has(player.id) ? player.rating * 2 : player.rating;
        const cardMarkup = getPlayerCardMarkup(player, actualRating);
        return `
            <div class="spinning-item" style="position: absolute; top: ${index * 320}px; left: 0; right: 0; width: 100%; height: 320px; display: flex; align-items: center; justify-content: center; padding: 24px;">
                ${cardMarkup}
            </div>
        `;
    }).join('');
}

function getPlayerCardMarkup(player, actualRating) {
    const role = player.role || '';
    const rarityTitle = getPlayerRarity(player);
    const roleLabel = role ? role.toUpperCase() : '';
    const ratingDisplay = Math.round(actualRating);

    return `
        <div class="player-card role-${role}">
            <div class="player-role role-${role}" title="${roleLabel}">${roleLabel}</div>
            <div class="player-photo">${player.emoji}</div>
            <div class="player-info">
                <div class="player-name">${player.name}</div>
                <div class="player-meta">
                    <span class="player-position">${rarityTitle}</span>
                    <span class="player-rating">${ratingDisplay}</span>
                </div>
            </div>
        </div>
    `;
}

function getPlayerRarity(player) {
    if (player && player.rarity) {
        return player.rarity;
    }

    const baseRating = player.rating || 0;
    if (baseRating >= 90) {
        return 'Уникальный';
    }
    if (baseRating >= 70) {
        return 'Редкий';
    }
    return 'Обычный';
}

// Отрисовка игрока в слоте
function renderPlayerInSlot(slotElement, player) {
    const actualRating = gameState.boostedPlayers.has(player.id) ? player.rating * 2 : player.rating;
    
    const container = slotElement.querySelector('.slot-item-container');
    container.innerHTML = getPlayerCardMarkup(player, actualRating);
}

// Воспроизведение звука удара
function playHitSound() {
    initAudio();
    const audio = gameState.shotAudio;
    if (!audio) return;

    try {
        audio.currentTime = 0;
        audio.play().catch(() => {});
    } catch (e) {
        console.warn('Ошибка воспроизведения звука удара', e);
    }
}

function playAttackProjectile(slotElement) {
    const gameScreen = document.getElementById('gameScreen');
    const opponentLogoContainer = document.querySelector('.opponent-logo-container');

    if (!gameScreen || !opponentLogoContainer || !slotElement) {
        return;
    }

    const projectile = document.createElement('div');
    projectile.className = 'attack-projectile';

    const gameRect = gameScreen.getBoundingClientRect();
    const slotRect = slotElement.getBoundingClientRect();
    const targetRect = opponentLogoContainer.getBoundingClientRect();

    const startX = slotRect.left + slotRect.width / 2 - gameRect.left;
    const startY = slotRect.top + slotRect.height / 2 - gameRect.top;
    const endX = targetRect.left + targetRect.width / 2 - gameRect.left;
    const endY = targetRect.top + targetRect.height / 2 - gameRect.top;

    const size = 44;
    projectile.style.width = `${size}px`;
    projectile.style.height = `${size}px`;
    projectile.style.left = `${startX - size / 2}px`;
    projectile.style.top = `${startY - size / 2}px`;

    gameScreen.appendChild(projectile);

    const deltaX = endX - startX;
    const deltaY = endY - startY;

    projectile.animate([
        { transform: 'translate3d(0, 0, 0) scale(0.65)', opacity: 0.95 },
        { transform: `translate3d(${deltaX * 0.45}px, ${deltaY * 0.45}px, 0) scale(1.06)`, opacity: 1 },
        { transform: `translate3d(${deltaX * 0.7}px, ${deltaY * 0.7}px, 0) scale(1.08)`, opacity: 1 },
        { transform: `translate3d(${deltaX}px, ${deltaY}px, 0) scale(0.65)`, opacity: 0 }
    ], { duration: 980, easing: 'cubic-bezier(0.16, 0.84, 0.24, 1.04)' }).onfinish = () => projectile.remove();
}

// Эффект удара (тряска и вспышка)
function applyHitEffect(sourceSlots, actualDamage) {
    const slots = Array.isArray(sourceSlots) ? sourceSlots.filter(Boolean) : [sourceSlots].filter(Boolean);
    const launchSlots = slots.length ? slots : [document.getElementById('slot1')].filter(Boolean);

    launchSlots.forEach((slot, index) => {
        setTimeout(() => playAttackProjectile(slot), index * 180);
    });

    const opponentInfo = document.querySelector('.opponent-info');
    const opponentLogo = document.getElementById('opponentLogo');
    const gameScreen = document.getElementById('gameScreen');
    
    if (opponentInfo) {
        opponentInfo.classList.add('hit-shake');
        setTimeout(() => {
            opponentInfo.classList.remove('hit-shake');
        }, 500);
    }
    
    if (opponentLogo) {
        opponentLogo.classList.add('hit-flash');
        setTimeout(() => {
            opponentLogo.classList.remove('hit-flash');
        }, 300);

        const shockwave = document.createElement('div');
        shockwave.className = 'hit-shockwave';
        const impactScale = Math.min(3.2, 1 + actualDamage / 800);
        shockwave.style.setProperty('--shockwave-scale', Math.min(3.6, impactScale * 1.3).toFixed(2));
        opponentLogo.appendChild(shockwave);
        shockwave.addEventListener('animationend', () => shockwave.remove());

        const energy = document.createElement('div');
        energy.className = 'hit-energy-lines';
        opponentLogo.appendChild(energy);
        energy.addEventListener('animationend', () => energy.remove());

        const impact = document.createElement('div');
        impact.className = 'hit-impact';
        impact.style.setProperty('--impact-scale', impactScale.toFixed(2));
        opponentLogo.appendChild(impact);
        impact.addEventListener('animationend', () => impact.remove());
    }
    
    const flash = document.createElement('div');
    flash.className = 'hit-flash-overlay';
    document.body.appendChild(flash);
    
    setTimeout(() => {
        flash.remove();
    }, 200);

    if (gameScreen) {
        gameScreen.classList.add('hit-camera-shake');
        setTimeout(() => {
            gameScreen.classList.remove('hit-camera-shake');
        }, 500);
    }
}

async function animateDamageBreakdown(players, contributions, baseDamage, totalDamage, multiplier, comboText, hpBefore, hpAfter, bonusDamage = 0) {
    const damageDisplay = document.getElementById('damageDisplay');
    if (!damageDisplay) {
        return;
    }

    damageDisplay.innerHTML = '';
    damageDisplay.classList.remove('damage-pop');
    damageDisplay.classList.add('damage-display-active', 'damage-breakdown-active');

    const popup = document.createElement('div');
    popup.className = 'damage-popup';
    damageDisplay.appendChild(popup);

    const breakdown = document.createElement('div');
    breakdown.className = 'damage-breakdown';
    popup.appendChild(breakdown);

    const equation = document.createElement('div');
    equation.className = 'damage-equation';
    breakdown.appendChild(equation);

    const chipElements = [];
    const operatorElements = [];
    const sequenceValues = contributions.map(value => Math.round(value));

    players.forEach((player, index) => {
        const chip = document.createElement('div');
        chip.className = 'damage-chip';
        chip.innerHTML = `
            <span class="damage-chip-name">${player.name}</span>
            <span class="damage-chip-value">+${Math.round(contributions[index])}</span>
        `;
        equation.appendChild(chip);
        chipElements.push(chip);

        const operator = document.createElement('div');
        operator.className = 'damage-operator';
        operator.textContent = '+';
        equation.appendChild(operator);
        operatorElements.push(operator);
    });

    if (bonusDamage > 0) {
        if (operatorElements.length) {
            operatorElements[operatorElements.length - 1].textContent = '+';
        }
        const bonusChip = document.createElement('div');
        bonusChip.className = 'damage-chip damage-chip--bonus';
        bonusChip.innerHTML = `
            <span class="damage-chip-name">Sirena Bet</span>
            <span class="damage-chip-value">+${Math.round(bonusDamage)}</span>
        `;
        equation.appendChild(bonusChip);
        chipElements.push(bonusChip);
        sequenceValues.push(Math.round(bonusDamage));

        const bonusOperator = document.createElement('div');
        bonusOperator.className = 'damage-operator';
        bonusOperator.textContent = '=';
        equation.appendChild(bonusOperator);
        operatorElements.push(bonusOperator);
    } else if (operatorElements.length) {
        operatorElements[operatorElements.length - 1].textContent = '=';
    }

    const totalWrapper = document.createElement('div');
    totalWrapper.className = 'damage-total';
    totalWrapper.textContent = '0';
    breakdown.appendChild(totalWrapper);

    await wait(60);

    let runningTotal = 0;
    for (let i = 0; i < chipElements.length; i++) {
        const chip = chipElements[i];
        const operator = operatorElements[i];

        requestAnimationFrame(() => {
            chip.classList.add('enter');
            operator.classList.add('enter');
        });

        const value = sequenceValues[i] || 0;
        runningTotal += value;
        totalWrapper.classList.remove('reveal', 'highlight');
        void totalWrapper.offsetWidth;
        totalWrapper.textContent = `${runningTotal}`;
        totalWrapper.classList.add('reveal');

        await wait(280);
    }

    const baseDamageValue = runningTotal;

    const formatMultiplier = (value) => {
        const rounded = value % 1 === 0 ? value : parseFloat(value.toFixed(2));
        return `${rounded}`.replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1');
    };

    const baseSumRow = document.createElement('div');
    baseSumRow.className = 'damage-sum-row';
    baseSumRow.innerHTML = `
        <span class="damage-sum-label">Сумма ударов</span>
        <span class="damage-sum-value">${baseDamage}</span>
    `;
    breakdown.appendChild(baseSumRow);

    await wait(160);
    baseSumRow.classList.add('reveal');

    const damageAfterMultiplier = Math.round(baseDamage * multiplier);

    if (multiplier > 1) {
        const multiplierDisplay = formatMultiplier(multiplier);
        const comboRow = document.createElement('div');
        comboRow.className = 'damage-combo-row';
        comboRow.innerHTML = `
            <span class="damage-combo-label">${comboText || 'Комбо'}</span>
            <span class="damage-combo-operator">×</span>
            <span class="damage-combo-value">x${multiplierDisplay}</span>
        `;
        breakdown.appendChild(comboRow);

        await wait(200);
        comboRow.classList.add('reveal');

        baseSumRow.querySelector('.damage-sum-value').textContent = `${baseDamage} × ${multiplierDisplay}`;

        totalWrapper.classList.remove('reveal', 'highlight');
        void totalWrapper.offsetWidth;
        totalWrapper.textContent = `${baseDamage} × ${multiplierDisplay} → ${damageAfterMultiplier}`;
        totalWrapper.classList.add('reveal', 'highlight');

        await wait(260);
    } else {
        totalWrapper.classList.add('highlight');
        await wait(180);
    }

    if (bonusDamage > 0) {
        const bonusRow = document.createElement('div');
        bonusRow.className = 'damage-bonus-row';
        bonusRow.innerHTML = `
            <span class="damage-bonus-label">Бонус Sirena Bet</span>
            <span class="damage-bonus-operator">+</span>
            <span class="damage-bonus-value">+${bonusDamage}</span>
        `;
        breakdown.appendChild(bonusRow);

        await wait(200);
        bonusRow.classList.add('reveal');

        totalWrapper.classList.remove('reveal', 'highlight');
        void totalWrapper.offsetWidth;
        totalWrapper.textContent = `${damageAfterMultiplier} + ${bonusDamage} → ${damageAfterMultiplier + bonusDamage}`;
        totalWrapper.classList.add('reveal', 'highlight');

        await wait(220);
    }

    const finalEl = document.createElement('div');
    finalEl.className = 'damage-final';
    finalEl.textContent = `ИТОГОВЫЙ УРОН: ${totalDamage}`;
    breakdown.appendChild(finalEl);

    await wait(100);
    finalEl.classList.add('reveal');

    await wait(560);
}

// Применение урона
async function applyDamageForPlayers(players, sourceSlots = [], options = {}) {
    if (!players || players.length === 0) {
        return;
    }

    const {
        multiplierOverride = 1,
        comboTextOverride = ''
    } = options;

    const contributions = players.map(player => gameState.boostedPlayers.has(player.id) ? player.rating * 2 : player.rating);
    const basePlayerDamage = contributions.reduce((sum, value) => sum + value, 0);
    const bonusDamage = gameState.pendingSirenaBonus || 0;
    
    let multiplier = 1;
    let comboText = '';

    if (players.length === 3 && players.every(p => p.role && p.role === players[0].role)) {
        const role = players[0].role;
        multiplier = ROLE_BONUSES[role] || 1;
        comboText = ROLE_COMBO_NAMES[role] || '';
    }

    if (multiplierOverride > 1) {
        multiplier *= multiplierOverride;
        if (comboText && comboTextOverride) {
            comboText = `${comboText} + ${comboTextOverride}`;
        } else if (comboTextOverride) {
            comboText = comboTextOverride;
        } else if (!comboText) {
            comboText = 'Бонус';
        }
    } else if (!comboText && comboTextOverride) {
        comboText = comboTextOverride;
    }

    const baseDamage = basePlayerDamage;
    const totalDamage = Math.round(basePlayerDamage * multiplier + bonusDamage);
    const hpBefore = gameState.currentOpponentHP;
    const hpAfter = Math.max(0, hpBefore - totalDamage);

    await animateDamageBreakdown(players, contributions, baseDamage, totalDamage, multiplier, comboText, hpBefore, hpAfter, bonusDamage);

    playHitSound();
    applyHitEffect(sourceSlots, totalDamage);

    await wait(520);

    gameState.currentOpponentHP = hpAfter;
    gameState.pendingSirenaBonus = 0;

    const hpBarFill = document.getElementById('opponentHPBar');
    const hpBarContainer = document.querySelector('.hp-bar-container');

    if (hpBarFill) {
        hpBarFill.classList.add('damaged');
        setTimeout(() => {
            hpBarFill.classList.remove('damaged');
        }, 400);
    }

    if (hpBarContainer) {
        hpBarContainer.classList.add('hp-bar-hit');
        setTimeout(() => {
            hpBarContainer.classList.remove('hp-bar-hit');
        }, 400);
    }

    updateGameUI();

    const damageDisplay = document.getElementById('damageDisplay');
    if (damageDisplay && !gameState.awaitingBonusChoice) {
        setTimeout(() => {
            damageDisplay.classList.remove('damage-display-active', 'damage-breakdown-active');
            damageDisplay.innerHTML = '';
        }, 2000);
    }

    return totalDamage;
}

function applyPenaltyBonus(player) {
    const baseDamage = gameState.boostedPlayers.has(player.id) ? player.rating * 2 : player.rating;
    const bonusDamage = baseDamage * 3;
    gameState.currentOpponentHP = Math.max(0, gameState.currentOpponentHP - bonusDamage);
    return bonusDamage;
}

function showPenaltyBonus(baseDamage, bonusDamage) {
    const damageDisplay = document.getElementById('damageDisplay');
    if (!damageDisplay) {
        return;
    }

    damageDisplay.classList.remove('damage-display-active', 'damage-breakdown-active');
    damageDisplay.innerHTML = '';

    const popup = document.createElement('div');
    popup.className = 'damage-popup bonus-damage-popup';

    const breakdown = document.createElement('div');
    breakdown.className = 'damage-breakdown bonus-damage-breakdown';
    breakdown.innerHTML = `
        <div class="bonus-damage-title">Бонус за пенальти</div>
        <div class="bonus-damage-amount">ИКС3 от Sirena Bet: +${bonusDamage}</div>
        <div class="bonus-damage-note">Общий урон с бонусом: ${baseDamage + bonusDamage}</div>
    `;

    popup.appendChild(breakdown);
    damageDisplay.appendChild(popup);
    damageDisplay.classList.add('damage-display-active');

    setTimeout(() => {
        damageDisplay.classList.remove('damage-display-active', 'damage-breakdown-active');
        damageDisplay.innerHTML = '';
    }, 2000);
}

// Проверка состояния игры
function checkGameState() {
    if (gameState.currentOpponentHP <= 0) {
        // Победа над оппонентом
        gameState.defeatedCount++;
        const totalOpponents = gameState.opponentsList ? gameState.opponentsList.length : 19;
        
        if (gameState.defeatedCount >= totalOpponents) {
            showVictory();
        } else {
            showPostRoundScreen();
        }
    } else if (gameState.spinsLeft === 0) {
        showDefeat();
    }
}

function showUpgradeScreen() {
    stopCheerSound();

    const availablePlayers = [...ARSENAL_PLAYERS];
    const upgradeOptions = [];
    for (let i = 0; i < 3 && availablePlayers.length > 0; i++) {
        const randomIndex = Math.floor(Math.random() * availablePlayers.length);
        upgradeOptions.push(availablePlayers.splice(randomIndex, 1)[0]);
    }
    
    const container = document.getElementById('upgradeOptions');
    container.innerHTML = '';
    
    upgradeOptions.forEach(player => {
        const option = document.createElement('div');
        option.className = 'upgrade-option';
        
        const baseRating = player.rating;
        const isBoosted = gameState.boostedPlayers.has(player.id);
        const currentRating = isBoosted ? baseRating * 2 : baseRating;
        const upgradedRating = currentRating * 2;
        const cardMarkup = getPlayerCardMarkup(player, currentRating);
        
        option.innerHTML = cardMarkup;

        const cardElement = option.querySelector('.player-card');
        if (cardElement) {
            const label = document.createElement('div');
            label.className = 'upgrade-card-label';
            label.innerHTML = `
                <span class="upgrade-card-value">${currentRating}</span>
                <span class="upgrade-card-arrow">→</span>
                <span class="upgrade-card-value upgraded">${upgradedRating}</span>
            `;
            cardElement.appendChild(label);
        }
        
        option.addEventListener('click', () => {
            gameState.boostedPlayers.add(player.id);
            gameState.currentOpponentIndex++;
            loadOpponent();
            showScreen('game');
        });
        
        container.appendChild(option);
    });
    
    showScreen('upgrade');
}

function showPostRoundScreen() {
    const opponent = gameState.opponentsList[gameState.currentOpponentIndex];
    const titleEl = document.getElementById('postRoundTitle');
    const subtitleEl = document.getElementById('postRoundSubtitle');
    const mapContainer = document.getElementById('postRoundMap');

    if (titleEl && opponent) {
        titleEl.textContent = `${opponent.name} повержен!`;
    }
    if (subtitleEl) {
        const previous = typeof gameState.lastProgressPercent === 'number' ? gameState.lastProgressPercent : 100;
        const randomDecrease = 3 + Math.random() * 9; // 3-12%
        let nextValue = Math.round(previous - randomDecrease);
        if (nextValue >= previous) {
            nextValue = previous - 1;
        }
        if (nextValue < 2) {
            nextValue = 2;
        }
        gameState.lastProgressPercent = nextValue;

        subtitleEl.innerHTML = `Только <span class="post-round-progress">${nextValue}%</span> игроков доходят до этой стадии. Выбери бонус, чтобы усилить команду перед следующим матчем.`;
    }

    if (mapContainer) {
        const opponentsList = gameState.opponentsList && gameState.opponentsList.length
            ? gameState.opponentsList
            : getOpponentsList(gameState.selectedClub.id);
        if (!gameState.opponentsList || !gameState.opponentsList.length) {
            gameState.opponentsList = opponentsList;
        }
        renderOpponentsMap(mapContainer, opponentsList, { showStatus: true });
    }

    playCheerSound();
    showScreen('postRound');
}

// Показать экран
function showScreen(screenName) {
    Object.values(screens).forEach(screen => {
        screen.classList.remove('active');
    });
    screens[screenName].classList.add('active');

    if (screenName !== 'postRound') {
        const warningEl = document.getElementById('postRoundWarning');
        if (warningEl) {
            warningEl.classList.remove('visible');
            warningEl.textContent = '';
        }
    }
}

// Победа
function showVictory() {
    stopCheerSound();
    document.getElementById('resultTitle').textContent = 'Победа! 🏆';
    const totalOpponents = gameState.opponentsList ? gameState.opponentsList.length : 19;
    document.getElementById('resultMessage').textContent = 
        `Ты победил все ${totalOpponents} команд АПЛ! Ты чемпион!`;
    document.getElementById('sirenaRescueButton').style.display = 'none';
    document.getElementById('continueButton').style.display = 'none';
    document.getElementById('restartButton').style.display = 'inline-block';
    showScreen('result');
}

// Поражение
function showDefeat() {
    if (!gameState.opponentsList || gameState.currentOpponentIndex >= gameState.opponentsList.length) {
        return;
    }
    
    playWhistleSound();
    document.getElementById('resultTitle').textContent = 'Sirena Bet спасёт твою игру';
    document.getElementById('resultMessage').textContent = 
        'Перейди в клиент Sirena Bet и продолжай матч с того же места.';
    document.getElementById('sirenaRescueButton').style.display = 'inline-block';
    document.getElementById('continueButton').style.display = 'none';
    document.getElementById('restartButton').style.display = 'inline-block';
    showScreen('result');
}

function continueAfterRescue() {
    stopCheerSound();
    gameState.spinsLeft = 6;
    gameState.isSpinning = false;
    gameState.penaltyActive = false;
    gameState.penaltyPhase = null;
    gameState.penaltyPlayer = null;
    gameState.penaltySlotIndex = null;
    setMachineTitle(MACHINE_TITLE_DEFAULT);
    setMachineSubtitle('');
    updateGameUI();
    const sirenaButton = document.getElementById('sirenaRescueButton');
    if (sirenaButton) {
        sirenaButton.style.display = 'none';
    }
    showScreen('game');
}

// Настройка обработчиков событий
function setupEventListeners() {
    const spinButton = document.getElementById('spinButton');
    spinButton.addEventListener('click', () => {
        if (spinButton.disabled) return;
        playButtonClickSound();
        spinSlots();
    });
    
    // Активируем аудио контекст при первом взаимодействии пользователя
    const activateAudio = () => {
        ensureBackgroundMusic();
    };
    
    // Активируем при клике на кнопку спина или любой другой элемент
    spinButton.addEventListener('click', activateAudio);
    document.addEventListener('click', activateAudio, { once: true });
    
    // Добавляем эффект нажатия на рычаг
    spinButton.addEventListener('mousedown', function() {
        if (!spinButton.disabled) {
            this.classList.add('pulling');
        }
    });
    
    spinButton.addEventListener('mouseup', function() {
        this.classList.remove('pulling');
    });
    
    spinButton.addEventListener('mouseleave', function() {
        this.classList.remove('pulling');
    });
    
    // Кнопка начала битвы на карте оппонентов
    document.getElementById('startBattleButton').addEventListener('click', () => {
        activateAudio();
        startGame();
    });
    
    document.getElementById('restartButton').addEventListener('click', () => {
        showScreen('clubSelection');
        gameState.boostedPlayers.clear();
        gameState.opponentsList = null;
        const sirenaButton = document.getElementById('sirenaRescueButton');
        if (sirenaButton) {
            sirenaButton.style.display = 'none';
        }
    });

    const chooseBonusButton = document.getElementById('chooseBonusButton');
    if (chooseBonusButton) {
        chooseBonusButton.addEventListener('click', () => {
            showUpgradeScreen();
        });
    }

    const sirenaRescueButton = document.getElementById('sirenaRescueButton');
    if (sirenaRescueButton) {
        sirenaRescueButton.addEventListener('click', () => {
            continueAfterRescue();
        });
    }
}

// Запуск игры
init();

