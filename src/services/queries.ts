export enum QUERIES {
    GET_NATION_QUERY = `
        nation_name
        leader_name
        discord
        continent
        war_policy
        domestic_policy
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
        soldiers
        tanks
        aircraft
        ships
        missiles
        nukes
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
