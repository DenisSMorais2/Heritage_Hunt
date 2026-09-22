// ============================================================
// Heritage Hunt CV — Niveis do explorador (camada de dominio)
//
// O nivel NAO e um valor guardado: e sempre derivado do XP total
// (xp.js e a fonte de verdade). Este ficheiro so sabe transformar
// um total de XP num nivel e num progresso.
//
// Regras deste ficheiro:
//   - nao toca no DOM;
//   - nao toca em localStorage;
//   - nao conhece traducoes (os nomes e as descricoes vivem no
//     i18n, nas chaves levels.<id>.name / .description);
//   - nenhum limiar (250, 600, 1200) existe fora de LEVEL_CONFIG.
// ============================================================

(function (root, factory) {
    const api = factory();

    if (root) {
        root.Levels = api.Levels;
        root.LEVEL_CONFIG = api.LEVEL_CONFIG;
    }

    if (typeof module === 'object' && module.exports) {
        module.exports = api;
    }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
    'use strict';

    // ==========================================================
    // Configuracao central dos niveis
    //
    // Acrescentar um nivel 5 e acrescentar uma entrada aqui e o
    // texto correspondente no i18n. Nada mais no sistema muda.
    //
    //   id       chave estavel (usada no i18n e na persistencia)
    //   level    ordem visivel, 1..n
    //   minXP    XP a partir do qual o nivel comeca
    //   icon     icone Font Awesome (a app ja carrega a biblioteca)
    //   accent   variante de cor definida no styles.css
    // ==========================================================
    const LEVEL_CONFIG = [
        { id: 'explorer',          level: 1, minXP: 0,    icon: 'fas fa-compass',        accent: 'bronze' },
        { id: 'traveler',          level: 2, minXP: 250,  icon: 'fas fa-map-marked-alt', accent: 'blue'   },
        { id: 'connoisseur',       level: 3, minXP: 600,  icon: 'fas fa-landmark',       accent: 'violet' },
        { id: 'heritage_guardian', level: 4, minXP: 1200, icon: 'fas fa-shield-alt',     accent: 'gold'   }
    ];

    // Ordenados por XP, sempre. Nunca confiamos na ordem escrita.
    const LEVELS = LEVEL_CONFIG.slice().sort(function (a, b) {
        return a.minXP - b.minXP;
    });

    function copyLevel(level) {
        return level ? Object.assign({}, level) : null;
    }

    function toNonNegativeInt(value) {
        const number = Number(value);
        if (!isFinite(number) || number < 0) return 0;
        return Math.floor(number);
    }

    // ==========================================================
    // Leitura do XP (ponto 32)
    //
    // Carteiras antigas guardavam apenas `points`. A interface nunca
    // precisa de saber isto: pergunta aqui.
    // ==========================================================
    function resolveTotalXP(source) {
        if (source === null || source === undefined) return 0;
        if (typeof source === 'number') return toNonNegativeInt(source);

        if (source.xp && typeof source.xp === 'object' && source.xp.total !== undefined) {
            return toNonNegativeInt(source.xp.total);
        }
        if (source.total !== undefined) return toNonNegativeInt(source.total);
        if (source.points !== undefined) return toNonNegativeInt(source.points);
        return 0;
    }

    // ==========================================================
    // Nivel a partir do XP
    // ==========================================================

    // Percorre a configuracao de tras para a frente: o primeiro
    // limiar que o XP alcanca e o nivel actual. Sem cadeias de if.
    function getLevelFromXP(totalXP) {
        const xp = toNonNegativeInt(totalXP);

        for (let i = LEVELS.length - 1; i >= 0; i--) {
            if (xp >= LEVELS[i].minXP) return copyLevel(LEVELS[i]);
        }
        // Defensivo: so acontece se alguem remover o nivel de 0 XP
        return copyLevel(LEVELS[0]);
    }

    // Alias com o nome pedido pelo dominio
    function getCurrentLevel(totalXP) {
        return getLevelFromXP(totalXP);
    }

    // Devolve null quando ja se esta no ultimo nivel configurado
    function getNextLevel(totalXP) {
        const xp = toNonNegativeInt(totalXP);

        for (let i = 0; i < LEVELS.length; i++) {
            if (LEVELS[i].minXP > xp) return copyLevel(LEVELS[i]);
        }
        return null;
    }

    function isMaxLevel(totalXP) {
        return getNextLevel(totalXP) === null;
    }

    // XP ja conquistado DENTRO do nivel actual (nunca o total)
    function getXPIntoCurrentLevel(totalXP) {
        const xp = toNonNegativeInt(totalXP);
        return xp - getLevelFromXP(xp).minXP;
    }

    // Largura do nivel actual: quanto XP separa o inicio deste nivel
    // do inicio do seguinte. null no ultimo nivel.
    function getXPRequiredForNextLevel(totalXP) {
        const xp = toNonNegativeInt(totalXP);
        const next = getNextLevel(xp);
        if (!next) return null;
        return next.minXP - getLevelFromXP(xp).minXP;
    }

    // Quanto falta para o proximo nivel. null no ultimo nivel.
    function getXPRemaining(totalXP) {
        const xp = toNonNegativeInt(totalXP);
        const next = getNextLevel(xp);
        if (!next) return null;
        return Math.max(0, next.minXP - xp);
    }

    /**
     * Progresso ENTRE o nivel actual e o seguinte, de 0 a 1.
     *
     *   (totalXP - actual.minXP) / (seguinte.minXP - actual.minXP)
     *
     * Nunca (totalXP / seguinte.minXP): isso ignorava o inicio do
     * nivel actual e dava sempre uma barra mais cheia do que a real
     * (ponto 7).
     *
     * No ultimo nivel devolve 1: a barra fica completa em vez de
     * partida (ponto 18).
     */
    function getLevelProgress(totalXP) {
        const xp = toNonNegativeInt(totalXP);
        const span = getXPRequiredForNextLevel(xp);
        if (span === null || span <= 0) return 1;
        return Math.min(1, Math.max(0, getXPIntoCurrentLevel(xp) / span));
    }

    /**
     * Retrato completo da progressao. E isto que a interface pede:
     * assim nenhum componente volta a fazer contas com limiares.
     */
    function getProgress(totalXP) {
        const xp = toNonNegativeInt(totalXP);
        const next = getNextLevel(xp);
        const progress = getLevelProgress(xp);

        return {
            currentLevel: getLevelFromXP(xp),
            nextLevel: next,
            totalXP: xp,
            xpInCurrentLevel: getXPIntoCurrentLevel(xp),
            xpRequiredForNextLevel: getXPRequiredForNextLevel(xp),
            xpRemaining: getXPRemaining(xp),
            progress: progress,
            percent: Math.round(progress * 100),
            isMaxLevel: next === null
        };
    }

    // ==========================================================
    // Subida de nivel (pontos 14 e 17)
    //
    // Funciona para saltos de varios niveis de uma so vez: o nivel
    // e sempre recalculado a partir do total, nunca incrementado.
    // ==========================================================
    function detectLevelUp(previousXP, newXP) {
        const before = getLevelFromXP(previousXP);
        const after = getLevelFromXP(newXP);

        return {
            leveledUp: after.level > before.level,
            previousLevel: before,
            newLevel: after,
            levelsGained: Math.max(0, after.level - before.level)
        };
    }

    // ==========================================================
    // Listagem (ponto 25: "A tua jornada")
    // ==========================================================

    // Todos os niveis com o estado face ao XP indicado:
    // 'done' | 'current' | 'locked'
    function getJourney(totalXP) {
        const current = getLevelFromXP(totalXP).level;

        return LEVELS.map(function (level) {
            const entry = copyLevel(level);
            entry.state = level.level < current ? 'done'
                : (level.level === current ? 'current' : 'locked');
            return entry;
        });
    }

    function getLevels() {
        return LEVELS.map(copyLevel);
    }

    function getLevelByNumber(number) {
        return copyLevel(LEVELS.filter(function (level) {
            return level.level === number;
        })[0]);
    }

    function getLevelById(id) {
        return copyLevel(LEVELS.filter(function (level) {
            return level.id === id;
        })[0]);
    }

    function getMaxLevel() {
        return copyLevel(LEVELS[LEVELS.length - 1]);
    }

    const Levels = {
        // Leitura do XP
        resolveTotalXP: resolveTotalXP,

        // Nivel
        getLevelFromXP: getLevelFromXP,
        getCurrentLevel: getCurrentLevel,
        getNextLevel: getNextLevel,
        isMaxLevel: isMaxLevel,

        // Progresso
        getXPIntoCurrentLevel: getXPIntoCurrentLevel,
        getXPRequiredForNextLevel: getXPRequiredForNextLevel,
        getXPRemaining: getXPRemaining,
        getLevelProgress: getLevelProgress,
        getProgress: getProgress,

        // Transicao
        detectLevelUp: detectLevelUp,

        // Listagem
        getJourney: getJourney,
        getLevels: getLevels,
        getLevelByNumber: getLevelByNumber,
        getLevelById: getLevelById,
        getMaxLevel: getMaxLevel,

        CONFIG: LEVEL_CONFIG
    };

    return { Levels: Levels, LEVEL_CONFIG: LEVEL_CONFIG };
});
