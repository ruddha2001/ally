export interface NationDataInterface {
    nation_name?: string;
    leader_name?: string;
    discord?: string;
}

export interface NationsInterface {
    data?: NationDataInterface[];
}

export interface StaticNationDataInterface {
    nation_id: number;
    expires_at: Date;
}
