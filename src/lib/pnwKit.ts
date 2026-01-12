import { Kit } from 'pnwkit-2.0';

/**
 * Singleton wrapper for the PNWKit API client.
 *
 * This class manages a single instance of the PNWKit client and provides methods
 * to initialize and retrieve the client. It ensures that the API key is set and
 * the client is only initialized once per application lifecycle.
 */
export class PnwKit {
    /**
     * The singleton PNWKit client instance, or null if not yet initialized.
     */
    private static kit: Kit | null = null;

    /**
     * Initializes the PNWKit client with the provided API key.
     *
     * @param apiKey The API key to authenticate requests to the PNWKit API.
     */
    static initKit(apiKey: string) {
        PnwKit.kit = new Kit();
        PnwKit.kit.setKeys(apiKey);
    }

    /**
     * Retrieves the singleton PNWKit client instance, initializing it with the
     * API key from the environment if necessary.
     *
     * @returns {Kit} The PNWKit client instance.
     */
    static getKit(): Kit {
        if (!PnwKit.kit) {
            PnwKit.initKit(process.env.PNW_API_KEY as string);
        }
        return PnwKit.kit as Kit;
    }
}
