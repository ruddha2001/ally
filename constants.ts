export const CONSTANTS = {
    pnwBaseUrl: 'https://api.politicsandwar.com/graphql',
};

export const BUTTONS = {
    APPLY_BUTTON: 'applyForAlliance',
};

export const IMPROVEMENTS = {
    millitary: {
        barrack: {
            perDay: 1000,
            max: 3000,
        },
        factory: {
            perDay: 50,
            max: 250,
        },
        hangar: {
            perDay: 3,
            max: 15,
        },
        drydock: {
            perDay: 1,
            max: 5,
        },
        spy: {
            perDay: 2,
            max: 50,
        },
    },
};

export const CACHE_KEYS = {
    ALL_ALLIANCE_IDS: 'all_alliance_ids',
    ALL_NATION_IDS: 'all_nation_ids',
    GUILD_BY_MANAGED_NATION_ID: 'guild_by_managed_nation_id',
};
