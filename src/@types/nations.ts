import {} from 'pnwkit-2.0';
import { PnwKit } from '../lib/pnwKit.js';
import { MMR } from 'pnwkit-2.0/build/src/interfaces/data/war.js';

export interface NationDataInterface {
    nation_name?: string;
    leader_name?: string;
    discord?: string;
    alliance_position?: string;
    alliance: {
        id?: string;
        name?: string;
    };
}

export interface NationsInterface {
    data?: NationDataInterface[];
}

export interface StaticNationDataInterface {
    nation_id: number;
    expires_at: Date;
    discord_username: string;
}

export interface AllyNationInterface {
    id?: number;
    nation_name?: string;
    leader_name?: string;
    discord?: string;
    alliance_position?: string;
    alliance: {
        id?: string;
        name?: string;
    };
    resources?: any;
    color_block?: string;
    last_active?: string;
    min_mil_req?: MMR;
    num_cities?: number;
    cities?: {
        infrastructure?: number;
    }[];
    continent?: string;
    war_policy?: string;
    domestic_policy?: string;
    millitary?: {
        soldiers?: number;
        max_soldiers?: number;
        per_day_soldiers?: number;
        tanks?: number;
        max_tanks?: number;
        per_day_tanks?: number;
        aircrafts?: number;
        max_aircrafts?: number;
        per_day_aircrafts?: number;
        ships?: number;
        max_ships?: number;
        per_day_ships?: number;
        missiles?: number;
        max_missiles?: number;
        per_day_missiles?: number;
        nukes?: number;
        max_nukes?: number;
        per_day_nukes?: number;
        spies?: number;
        max_spies?: number;
        per_day_spies?: number;
    };
    ally_last_updated: Date;
}
