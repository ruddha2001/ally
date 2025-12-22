import { MongoClient, Db } from 'mongodb';
import logger from './logger.js';

/**
 * Singleton wrapper for the MongoDB client and database connection.
 *
 * This class manages a single instance of the MongoDB client and provides methods
 * to connect, retrieve the database, and close the connection. It ensures that
 * the client is only initialized and connected once per application lifecycle.
 */
export class Database {
    /**
     * The singleton MongoClient instance, or null if not yet initialized.
     */
    private static client: MongoClient | null = null;

    /**
     * Initializes the MongoClient with the URI from the environment.
     *
     * @private
     */
    private static async initClient() {
        Database.client = new MongoClient(process.env.MONGODB_URI as string);
    }

    /**
     * Retrieves the singleton MongoClient instance, initializing it if needed.
     *
     * @returns {Promise<MongoClient>} The MongoClient instance.
     * @private
     */
    private static async getClient(): Promise<MongoClient> {
        if (!Database.client) {
            await Database.initClient();
        }
        return Database.client as MongoClient;
    }

    /**
     * Connects the MongoClient to the database server.
     *
     * @returns {Promise<void>} Resolves when the connection is established.
     */
    static async connectClient() {
        await (await Database.getClient()).connect();
        logger.info('Database connection is successful');
    }

    /**
     * Retrieves the 'ally' database instance.
     *
     * @returns {Promise<Db>} The MongoDB database instance.
     */
    static async getDatabase(): Promise<Db> {
        return (await Database.getClient()).db('ally');
    }

    /**
     * Closes the MongoClient connection.
     *
     * @returns {Promise<void>} Resolves when the connection is closed.
     */
    static async closeConnection() {
        return (await Database.getClient()).close();
    }
}
