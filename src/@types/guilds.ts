export interface GuildDataInterface {
    guild_name: string;
    guild_id: string;
    alliance_name?: string;
    alliance_id?: string;
    welcome_channel: string;
    verified_role: string;
    unverified_role: string;
    application_settings?: GuildApplicationSettings;
    managed_channels: {
        [channel_id: string]: {
            created_at?: Date;
            type?: string;
            nation_id: string;
        };
    };
    config: {
        dataValidityInMins: number;
        dateFormat: string;
    };
}

export interface GuildApplicationSettings {
    application_category_id?: string;
    membership_role?: string;
    ia_role: string;
}
