export interface AllyAllianceInterface {
    id: string;
    name?: string;
    acronym?: string;
    score?: number;
    color?: string;
    alliance_positions?: AllyAlliancePositionInterface[];
    discord_link?: string;
    ally_last_updated?: Date;
}

export interface AllyAlliancePositionInterface {
    id: string;
    name?: string;
    position_level?: number;
    is_leader?: boolean;
    permissions: {
        view_bank?: boolean;
        withdraw_bank?: boolean;
        accept_applicants?: boolean;
        remove_members?: boolean;
    };
}
