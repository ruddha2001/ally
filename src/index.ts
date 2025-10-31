/**
 * @packageDocumentation
 *
 * Entry point for the Ally application. This module is responsible for:
 * - Attaching global process and application event listeners.
 * - Connecting to the MongoDB database.
 * - Initializing external API clients (PNW kit).
 * - Starting and authenticating Discord gateway and REST clients.
 * - Registering command definitions with Discord.
 *
 * Environment variables required (expected to be present):
 * - PNW_API_KEY: API key for the PNW kit.
 * - DISCORD_TOKEN: Bot token used to login to the Discord gateway.
 * - DISCORD_CLIENT_ID: Discord application client ID used to register commands.
 * - DISCORD_TEST_GUILD_ID: (optional) test guild ID for registering commands in a specific guild.
 *
 * The module also installs graceful shutdown handlers for SIGINT and SIGTERM to ensure the
 * database connection is closed before the process exits.
 */

/**
 * Initialize and start the application.
 *
 * This async function performs the following steps in order:
 * 1. Logs startup information (including process id).
 * 2. Attaches global event listeners for uncaught exceptions, unhandled rejections, etc.
 * 3. Connects the MongoDB client.
 * 4. Initializes the PNW kit with the configured API key.
 * 5. Logs the Discord gateway client in using the provided bot token.
 * 6. Registers command definitions with the Discord REST API (optionally for a test guild).
 *
 * @remarks
 * All startup logic is wrapped in a try/catch block. If an error occurs during
 * initialization (such as connection failures or missing environment variables), the error
 * is logged and the shutdown sequence is triggered to ensure a graceful exit.
 *
 * @returns A Promise that resolves when startup tasks have been initiated.
 *
 * @throws Will throw if required environment variables are missing or if the database connection fails.
 */

/**
 * Perform an orderly shutdown of the application and exit the process.
 *
 * This function attempts to:
 * 1. Close the MongoDB connection cleanly.
 * 2. Log shutdown completion.
 * 3. Exit the Node.js process with code 0.
 *
 * @remarks
 * Registered as the handler for SIGINT and SIGTERM to ensure resources are released
 * before the process terminates. The shutdown sequence uses a catch block to log any
 * errors encountered while closing the database, and a finally block to always log
 * shutdown completion and exit the process, even if errors occur.
 *
 * @returns A Promise that resolves when shutdown operations complete and the process exit is initiated.
 */
import { DiscordGatewayClient } from './lib/gatewayClient.js';
import { DiscordRestClient } from './lib/restClient.js';
import { Database } from './lib/mongoDbClient.js';
import { PnwKit } from './lib/pnwKit.js';
import { attachEventListeners } from './events/index.js';

const initApp = async () => {
    console.log(`Starting process on PID ${process.pid}. Check winston log files for all logs.`);

    try {
        attachEventListeners();
        await Database.connectClient();
        PnwKit.initKit(process.env.PNW_API_KEY as string);
        DiscordGatewayClient.getClient().login(process.env.DISCORD_TOKEN);
        DiscordRestClient.registerCommands(
            process.env.DISCORD_TOKEN as string,
            process.env.DISCORD_CLIENT_ID as string,
            process.env.DISCORD_TEST_GUILD_ID as string,
        );
    } catch (error) {
        console.error(
            'Unhandled error for server initialization - Gracefully shutting down',
            error,
        );
        shutdown();
    }
};

const shutdown = () => {
    Database.closeConnection()
        .catch((dbError) => {
            console.error('Encountered an error when trying to close the database', dbError);
        })
        .finally(() => {
            console.log(`Shutdown complete. Exiting process with PID ${process.pid}`);
            process.exit(0);
        });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

initApp();
