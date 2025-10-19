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
