import dayjs, { Dayjs } from 'dayjs';
import duration from 'dayjs/plugin/duration.js';
import { IMPROVEMENTS } from '../../constants.js';
import { nation } from 'pnwkit-2.0/build/src/interfaces/queries/nation.js';
import { EmbedBuilder } from 'discord.js';
dayjs.extend(duration);

const parseInputToNumericId = (input: string, type?: 'nation' | 'alliance'): number => {
    let processedInput = input;
    if (input.startsWith('http')) {
        // Input is a link
        if (!input.startsWith('https')) {
            throw new Error(
                `[parseInputToNumericId] A link input was passed that is non-HTTPS. Received: ${input}`,
            );
        }
        if (!type) {
            throw new Error(
                `[parseInputToNumericId] A link input was passed but type is not passed; quit parsing. Received: ${input}`,
            );
        }
        if (!input.includes(type)) {
            throw new Error(
                `[parseInputToNumericId] A link input was passed but type is not matching. Received: ${input} | Expected ${type}`,
            );
        }
        const stringId = input.split('=')?.[1];
        if (!stringId) {
            throw new Error(
                `[parseInputToNumericId] A link input was passed that does not have an ID at the end or has query parameters that are not recognized. Received: ${input}`,
            );
        }
        processedInput = stringId;
    }
    const parsedNumber = Number(processedInput);
    if (Number.isNaN(parsedNumber))
        throw new Error(
            `[parseInputToNumericId] A processed input was passed that is not a number. Received: ${processedInput}`,
        );
    return parsedNumber;
};

export const parseNationLinkInput = (input: string | null): number | null => {
    if (!input) return null;
    return parseInputToNumericId(input, 'nation');
};

export const parseAllianceLinkInput = (input: string | null): number | null => {
    if (!input) return null;
    return parseInputToNumericId(input, 'alliance');
};

export const getColorCircleEmoji = (color: string): string | null => {
    switch (color.toLowerCase()) {
        case 'aqua':
            return '🌊 Aqua';
        case 'black':
            return '⚫ Black';
        case 'blue':
            return '🔵 Blue';
        case 'brown':
            return '🟤 Brown';
        case 'green':
            return '🟢 Green';
        case 'lime':
            return '🍋 Lime';
        case 'maroon':
            return '👜 Maroon';
        case 'olive':
            return '🫒 Olive';
        case 'orange':
            return '🟠 Orange';
        case 'pink':
            return '🌸 Pink';
        case 'purple':
            return '🟣 Purple';
        case 'red':
            return '🔴 Red';
        case 'white':
            return '⚪ White';
        case 'yellow':
            return '🟡 Yellow';
        case 'beige':
            return '🏰 Beige';
        case 'gray':
            return '🪦 Gray';
    }
    return null;
};

export const mapContinentToName = (continent: string): string | null => {
    switch (continent) {
        case 'as':
            return 'Asia';
        case 'na':
            return 'North America';
        case 'sa':
            return 'South America';
        case 'an':
            return 'Antarctica';
        case 'eu':
            return 'Europe';
        case 'af':
            return 'Africa';
        case 'au':
            return 'Australia';
    }
    return null;
};

export const dayDiff = (dayJsDate: Dayjs) => {
    const now = dayjs();
    const diffMs = now.diff(dayJsDate);

    const dur = dayjs.duration(diffMs);

    const weeks = Math.floor(dur.asWeeks());
    const days = dur.days();
    const hours = dur.hours();
    const minutes = dur.minutes();
    const seconds = dur.seconds();

    return `${weeks}w ${days}d ${hours}h ${minutes}m ${seconds}s`;
};

export const calculatePerDayAndMaxMil = (totalMilImprovements: {
    barracks: number;
    factories: number;
    hangars: number;
    drydocks: number;
}) => {
    const { barracks, factories, hangars, drydocks } = totalMilImprovements;
    const { barrack, factory, hangar, drydock, spy } = IMPROVEMENTS.millitary;
    return {
        max_soldiers: barrack.max * barracks,
        per_day_soldiers: barrack.perDay * barracks,
        max_tanks: factory.max * factories,
        per_day_tanks: factory.perDay * factories,
        max_aircrafts: hangar.max * hangars,
        per_day_aircrafts: hangar.perDay * hangars,
        max_ships: drydock.max * drydocks,
        per_day_ships: drydock.perDay * drydocks,
        max_spies: spy.max,
        per_day_spies: spy.perDay,
    };
};

export const calculateTotalMilImprovements = (nation: nation) => {
    let totalMilImprovements = {
        barracks: 0,
        factories: 0,
        hangars: 0,
        drydocks: 0,
    };

    for (let i = 0; i < nation.cities?.length; i++) {
        let city = nation.cities[i];

        totalMilImprovements.barracks += city?.barracks ?? 0;
        totalMilImprovements.factories += city?.factory ?? 0;
        totalMilImprovements.hangars += city?.hangar ?? 0;
        totalMilImprovements.drydocks += city?.drydock ?? 0;
    }

    return totalMilImprovements;
};

export const allyEmbedBuilder = (): EmbedBuilder => {
    const embed = new EmbedBuilder();
    return embed;
};
