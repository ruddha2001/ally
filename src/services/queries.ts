export enum QUERIES {
    GET_NATION_QUERY = `
        nation_name
        leader_name
        discord
        id
        alliance_position
        alliance {
            id
            name
        }
        spies
        last_active
        color
        num_cities
        cities {
            infrastructure
        }
        `,
    GET_ALLIANCE_QUERY = `
        id
        name
        acronym
        score
        color
        alliance_positions {
            id
            name
            position_level
            leader
            view_bank
            withdraw_bank
            accept_applicants
            remove_members
        }
        discord_link
    `,
}
