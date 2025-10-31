import {} from 'pnwkit-2.0';
import { PnwKit } from '../lib/pnwKit.js';

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
    min_mil_req?: any;
    spies?: number;
    num_cities?: number;
    cities?: {
        infrastructure?: number;
    }[];
    ally_last_updated: Date;
}
