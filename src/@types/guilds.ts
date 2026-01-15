export interface AllyGuildDataInterface {
    guild_name: string;
    guild_id: string;
    alliance_name?: string;
    alliance_id?: string;
    welcome_channel: string;
    verified_role: string;
    unverified_role: string;
    application_settings: AllyGuildApplicationSettings;
    managed_channels: {
        [channel_id: string]: AllyManagedChannel;
    };
    config: {
        dataValidityInMins: number;
        dateFormat: string;
    };
    admins: string[];
}

export interface AllyManagedChannel {
    created_at?: Date;
    type?: string;
    nation_id: string;
    templates?: {
        build?: string;
        warChest?: string;
    };
}

export interface AllyGuildApplicationSettings {
    application_category_id?: string;
    membership_role?: string;
    ia_role?: string;
    audit?: {
        audit_role_id: string;
        audit_channel_id: string;
        audit_mmr_slabs: Array<AllyGuildAuditLevel>;
    };
    roles?: {
        audit?: string;
        build?: string;
        warChest?: string;
    };
}

export interface AllyGuildAuditLevel {
    label?: string;
    name: string;
    barracks: number;
    factories: number;
    hangars: number;
    drydocks: number;
    min_city: number;
    max_city: number;
    levelId: string;
}
