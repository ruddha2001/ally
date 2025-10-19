import { ApolloClient, HttpLink, InMemoryCache } from '@apollo/client';
import { CONSTANTS } from '../../constants.js';

export class GqlClient {
    private static client: ApolloClient | null = null;

    private static initClient() {
        GqlClient.client = new ApolloClient({
            link: new HttpLink({
                uri: `${CONSTANTS.pnwBaseUrl}?api_key=${process.env.PNW_API_KEY}`,
            }),
            cache: new InMemoryCache(),
        });
    }

    static getClient(): ApolloClient {
        if (!GqlClient.client) {
            GqlClient.initClient();
        }
        return GqlClient.client as ApolloClient;
    }
}
