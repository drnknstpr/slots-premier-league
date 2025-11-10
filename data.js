// Данные команд АПЛ
const PREMIER_LEAGUE_CLUBS = [
    { id: 'arsenal', name: 'Арсенал', hp: 0, isPlayer: true },
    { id: 'aston', name: 'Астон Вилла', hp: 13000 },
    { id: 'bournemouth', name: 'Борнмут', hp: 18000 },
    { id: 'brentford', name: 'Брентфорд', hp: 9000 },
    { id: 'brighton', name: 'Брайтон', hp: 10000 },
    { id: 'burnley', name: 'Бернли', hp: 2000 },
    { id: 'chelsea', name: 'Челси', hp: 21000 },
    { id: 'crystal', name: 'Кристал Пэлас', hp: 19000 },
    { id: 'everton', name: 'Эвертон', hp: 8000 },
    { id: 'fulham', name: 'Фулхэм', hp: 7000 },
    { id: 'leeds', name: 'Лидс Юнайтед', hp: 3600 },
    { id: 'liverpool', name: 'Ливерпуль', hp: 25000 },
    { id: 'mancity', name: 'Манчестер Сити', hp: 23000 },
    { id: 'manutd', name: 'Манчестер Юнайтед', hp: 15000 },
    { id: 'newcastle', name: 'Ньюкасл Юнайтед', hp: 16000 },
    { id: 'nottingham', name: 'Ноттингем Форест', hp: 2800 },
    { id: 'sunderland', name: 'Сандерленд', hp: 11000 },
    { id: 'tottenham', name: 'Тоттенхэм', hp: 17000 },
    { id: 'westham', name: 'Вест Хэм', hp: 3200 },
    { id: 'wolves', name: 'Вулверхэмптон', hp: 2400 }
];

// Соответствие амплуа и эмодзи
const PLAYER_ROLE_EMOJI_MAP = {
    G: '🥅',
    D: '🛡️',
    M: '⚙️',
    F: '⚽'
};

const PLAYER_ROLE_ALIAS = {
    G: 'G',
    GK: 'G',
    'Г': 'G',
    'ВР': 'G',
    'GOALKEEPER': 'G',
    D: 'D',
    DF: 'D',
    DEF: 'D',
    'З': 'D',
    'CB': 'D',
    'LB': 'D',
    'RB': 'D',
    M: 'M',
    MF: 'M',
    MID: 'M',
    'П': 'M',
    'С': 'M',
    F: 'F',
    FW: 'F',
    ATT: 'F',
    'Н': 'F'
};

const PLAYER_NAME_EMOJI_MAP = {
    'райя': '🧱',
    'уайт': '🐻',
    'салиба': '🛡️',
    'габриэл': '🔥',
    'мартинелли': '🦜',
    'жезус': '🕊️',
    'троссар': '🎯',
    'райс': '🌾',
    'хаверц': '🎩',
    'сака': '🚀',
    'эдегор': '🧠',
    'федорущенко': '🧤',
    'сетфорд': '🦊',
    'москера': '🦂',
    'льюис-скелли': '🦴',
    'инкапиэ': '🧭',
    'калафьори': '🏛️',
    'тимбер': '🌲',
    'нванери': '🦅',
    'нергор': '🌿',
    'доуман': '🎲',
    'субименди': '🛶',
    'мерино': '🐚',
    'мадуэке': '💎',
    'эзе': '🪄',
    'аннус': '🐬',
    'дьокереш': '🐉'
};

// Дефолтные данные игроков Арсенала (используются как fallback)
const ARSENAL_PLAYERS_FALLBACK = [
    { name: 'Райя', rating: 350, rarity: 'Редкий', role: 'G' },
    { name: 'Уайт', rating: 125, rarity: 'Обычный', role: 'D' },
    { name: 'Салиба', rating: 400, rarity: 'Уникальный', role: 'D' },
    { name: 'Габриэл', rating: 450, rarity: 'Уникальный', role: 'D' },
    { name: 'Мартинелли', rating: 100, rarity: 'Обычный', role: 'F' },
    { name: 'Жезус', rating: 50, rarity: 'Обычный', role: 'F' },
    { name: 'Троссар', rating: 150, rarity: 'Обычный', role: 'F' },
    { name: 'Райс', rating: 450, rarity: 'Уникальный', role: 'M' },
    { name: 'Хаверц', rating: 85, rarity: 'Обычный', role: 'M' },
    { name: 'Сака', rating: 550, rarity: 'Уникальный', role: 'M' },
    { name: 'Эдегор', rating: 300, rarity: 'Редкий', role: 'M' },
    { name: 'Федорущенко', rating: 20, rarity: 'Обычный', role: 'G' },
    { name: 'Сетфорд', rating: 35, rarity: 'Обычный', role: 'G' },
    { name: 'Москера', rating: 100, rarity: 'Обычный', role: 'D' },
    { name: 'Льюис-Скелли', rating: 150, rarity: 'Обычный', role: 'D' },
    { name: 'Инкапиэ', rating: 100, rarity: 'Обычный', role: 'D' },
    { name: 'Калафьори', rating: 250, rarity: 'Редкий', role: 'D' },
    { name: 'Тимбер', rating: 300, rarity: 'Редкий', role: 'D' },
    { name: 'Нванери', rating: 150, rarity: 'Обычный', role: 'M' },
    { name: 'Нергор', rating: 90, rarity: 'Обычный', role: 'M' },
    { name: 'Доуман', rating: 75, rarity: 'Обычный', role: 'M' },
    { name: 'Субименди', rating: 250, rarity: 'Редкий', role: 'M' },
    { name: 'Мерино', rating: 250, rarity: 'Редкий', role: 'F' },
    { name: 'Мадуэке', rating: 200, rarity: 'Обычный', role: 'M' },
    { name: 'Эзе', rating: 300, rarity: 'Редкий', role: 'M' },
    { name: 'Аннус', rating: 50, rarity: 'Обычный', role: 'F' },
    { name: 'Дьокереш', rating: 300, rarity: 'Редкий', role: 'F' }
].map((player, index) => ({
    id: createPlayerId(player.name, index),
    name: player.name,
    rating: Number(player.rating) || 0,
    rarity: normalizeRarity(player.rarity),
    role: normalizeRole(player.role),
    emoji: getEmojiForPlayer(player.name, player.role)
}));

let ARSENAL_PLAYERS = [...ARSENAL_PLAYERS_FALLBACK];
let arsenalPlayersLoaded = false;
let arsenalPlayersLoadPromise = null;

function normalizeRole(role) {
    if (!role) {
        return '';
    }

    const cleaned = String(role).trim().toUpperCase();
    if (!cleaned) {
        return '';
    }

    if (PLAYER_ROLE_ALIAS[cleaned]) {
        return PLAYER_ROLE_ALIAS[cleaned];
    }

    const firstChar = cleaned.charAt(0);
    if (PLAYER_ROLE_ALIAS[firstChar]) {
        return PLAYER_ROLE_ALIAS[firstChar];
    }

    return firstChar;
}

function normalizeRarity(rarity) {
    if (!rarity) {
        return 'Обычный';
    }

    const value = String(rarity).trim();
    if (!value) {
        return 'Обычный';
    }

    return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
}

function getEmojiForRole(role) {
    const normalizedRole = normalizeRole(role);
    return PLAYER_ROLE_EMOJI_MAP[normalizedRole] || '⚽';
}

function getEmojiForPlayer(name, role) {
    const slug = createPlayerSlug(name);
    if (slug && PLAYER_NAME_EMOJI_MAP[slug]) {
        return PLAYER_NAME_EMOJI_MAP[slug];
    }
    return getEmojiForRole(role);
}

function createPlayerSlug(name) {
    const base = (name || '').toString().trim().toLowerCase();
    const slug = base
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9а-яё]+/gi, '-')
        .replace(/^-+|-+$/g, '');
    return slug;
}

function createPlayerId(name, index) {
    const slug = createPlayerSlug(name);
    const safeSlug = slug || `player-${index}`;
    return `ars-${index}-${safeSlug}`;
}

function parseArsenalPlayersCSV(csvText) {
    if (!csvText || typeof csvText !== 'string') {
        return [];
    }

    const lines = csvText.split(/\r?\n/).map(line => line.trim());
    if (lines.length <= 1) {
        return [];
    }

    const headerLine = lines[0].replace(/^\uFEFF/, '');
    const delimiter = headerLine.includes(';') ? ';' : ',';
    const header = headerLine.split(delimiter).map(column => column.trim());
    const nameIndex = header.findIndex(col => /фамилия/i.test(col));
    const ratingIndex = header.findIndex(col => /сила/i.test(col));
    const rarityIndex = header.findIndex(col => /редк/i.test(col));
    const roleIndex = header.findIndex(col => /амплуа/i.test(col));

    const players = [];

    for (let i = 1; i < lines.length; i++) {
        const row = lines[i];
        if (!row) {
            continue;
        }

        const columns = row.split(delimiter).map(column => column.trim());
        const name = nameIndex >= 0 ? columns[nameIndex] : '';
        if (!name) {
            continue;
        }

        const ratingRaw = ratingIndex >= 0 ? columns[ratingIndex] : '';
        const ratingValue = parseFloat(String(ratingRaw).replace(',', '.'));
        const rating = Number.isFinite(ratingValue) ? ratingValue : 0;
        const rarity = rarityIndex >= 0 ? columns[rarityIndex] : '';
        const role = roleIndex >= 0 ? columns[roleIndex] : '';

        players.push({
            id: createPlayerId(name, players.length),
            name,
            rating,
            rarity: normalizeRarity(rarity),
            role: normalizeRole(role),
            emoji: getEmojiForPlayer(name, role)
        });
    }

    return players;
}

async function loadArsenalPlayersFromCSV() {
    const cacheBuster = Date.now();
    const response = await fetch(`arsenal_players.csv?v=${cacheBuster}`, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`Не удалось загрузить файл игроков: ${response.status} ${response.statusText}`);
    }

    const csvText = await response.text();
    const parsedPlayers = parseArsenalPlayersCSV(csvText);

    if (!parsedPlayers.length) {
        throw new Error('Файл игроков пуст или не содержит корректных данных');
    }

    return parsedPlayers;
}

function ensureArsenalPlayersLoaded() {
    if (arsenalPlayersLoaded) {
        return Promise.resolve(ARSENAL_PLAYERS);
    }

    if (!arsenalPlayersLoadPromise) {
        arsenalPlayersLoadPromise = loadArsenalPlayersFromCSV()
            .then(players => {
                ARSENAL_PLAYERS = players;
                arsenalPlayersLoaded = true;
                return ARSENAL_PLAYERS;
            })
            .catch(error => {
                console.error('[ArsenalPlayers] Ошибка загрузки CSV, используется запасной состав', error);
                ARSENAL_PLAYERS = [...ARSENAL_PLAYERS_FALLBACK];
                arsenalPlayersLoaded = true;
                return ARSENAL_PLAYERS;
            });
    }

    return arsenalPlayersLoadPromise;
}

function reloadArsenalPlayers() {
    arsenalPlayersLoaded = false;
    arsenalPlayersLoadPromise = null;
    return ensureArsenalPlayersLoaded();
}

// Веса для усиленных игроков (x2 частота)
const BOOSTED_WEIGHT_MULTIPLIER = 2;

// Фиксированный порядок оппонентов (всегда одинаковый)
const OPPONENTS_ORDER = [
    'burnley',      // Бернли
    'wolves',       // Вулверхэмптон
    'nottingham',   // Ноттингем Форест
    'westham',      // Вест Хэм
    'leeds',        // Лидс
    'fulham',       // Фулхэм
    'everton',      // Эвертон
    'brentford',    // Брентфорд
    'brighton',     // Брайтон
    'sunderland',   // Сандерленд
    'aston',        // Астон Вилла
    'manutd',       // Манчестер Юнайтед
    'newcastle',    // Ньюкасл
    'tottenham',    // Тоттенхэм
    'bournemouth',  // Борнмут
    'crystal',      // Кристал Пэлас
    'chelsea',      // Челси
    'mancity',      // Манчестер Сити
    'liverpool',    // Ливерпуль
    'arsenal'       // Арсенал
];

// Функция для получения списка оппонентов (исключая выбранную команду)
function getOpponentsList(selectedClubId) {
    return OPPONENTS_ORDER
        .filter(id => id !== selectedClubId)
        .map(id => PREMIER_LEAGUE_CLUBS.find(club => club.id === id))
        .filter(club => club !== undefined);
}

