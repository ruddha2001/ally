import { MongoClient, Db } from 'mongodb';
import logger from './logger.js';

export class Database {
    private static client: MongoClient | null = null;

    private static async initClient() {
        Database.client = new MongoClient(process.env.MONGODB_URI as string);
    }

    private static async getClient(): Promise<MongoClient> {
        if (!Database.client) {
            await Database.initClient();
        }
        return Database.client as MongoClient;
    }

    static async connectClient() {
        await (await Database.getClient()).connect();
        logger.info('Databse connection is successful');
    }

    static async getDatabse(): Promise<Db> {
        return (await Database.getClient()).db('ally');
    }

    static async closeConnection() {
        return (await Database.getClient()).close();
    }
}
