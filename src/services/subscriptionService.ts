import {
    subscriptionEvent,
    subscriptionModel,
} from 'pnwkit-2.0/build/src/interfaces/subscriptions/index.js';
import { PnwKit } from '../lib/pnwKit.js';
import { city } from 'pnwkit-2.0/build/src/interfaces/queries/city.js';
import logger from '../lib/logger.js';
import { getAllNationIds, getGuildIdAndManagedChannelKeyByNationId } from './guildService.js';
import { DiscordGatewayClient } from '../lib/gatewayClient.js';
import { renameChannel } from './channelService.js';
import { getSingleNationByNationId } from './nationService.js';

const inMemoryChannelMap: Map<subscriptionModel, Map<subscriptionEvent, string>> = new Map<
    subscriptionModel,
    Map<subscriptionEvent, string>
>();
const SupportedSubscriptionList = [subscriptionModel.CITY];
const processSubscriptionChannels = async (
    opType: subscriptionEvent = subscriptionEvent.CREATE,
) => {
    const allNationIds = await getAllNationIds();
    console.log(allNationIds);
    for (const model of SupportedSubscriptionList) {
        for (const event of [
            subscriptionEvent.CREATE,
            subscriptionEvent.UPDATE,
            subscriptionEvent.DELETE,
        ]) {
            const channel = await PnwKit.getKit()?.subscriptionChannel(model, opType, {
                nation_id: allNationIds,
            });
            if (channel) {
                if (!inMemoryChannelMap.has(model)) {
                    inMemoryChannelMap.set(model, new Map<subscriptionEvent, string>());
                }
                inMemoryChannelMap.get(model)?.set(event, channel as string);
            }
        }
    }
};

export const subscribe = async () => {
    await processSubscriptionChannels();
    logger.info('Subscribed to events');

    const promiseArray: Array<Promise<void> | undefined> = [];
    inMemoryChannelMap.forEach((eventMap, model) => {
        switch (model) {
            case subscriptionModel.CITY:
                eventMap.forEach((channel, event) => {
                    promiseArray.push(
                        PnwKit?.getKit()?.citySubscription(
                            channel,
                            event,
                            callbackMapper(model, event),
                        ),
                    );
                });
                break;
        }
    });
    Promise.allSettled(promiseArray);
};

export const unsubscribe = async () => {
    await processSubscriptionChannels(subscriptionEvent.DELETE);
};

const newCityHandler = async (data: city[]) => {
    logger.debug(`[NEW CITY] Created by nation: ${data[0].nation_id}`);
    const { nation_id } = data[0];
    const guildAndManagedChannelId = await getGuildIdAndManagedChannelKeyByNationId(
        nation_id as string,
    );
    const nationData = await getSingleNationByNationId(parseInt(nation_id as string, 10));
    if (guildAndManagedChannelId) {
        const { guild_id, managed_channel_keys } = guildAndManagedChannelId;
        const client = DiscordGatewayClient.getClient();
        const guild = await client.guilds.fetch(guild_id);
        if (!guild) {
            return logger.error(
                `[newCityHandler] Did not match any guild with id ${guild_id}. Will not proceed further.`,
            );
        }
        for (const key of managed_channel_keys) {
            const channel = await guild.channels.fetch(key);
            if (!channel) {
                logger.error(
                    `[newCityHandler] Did not match any channel with id ${key}, Will not proceed further for this channel.`,
                );
                continue;
            }
            await renameChannel(channel, `${nationData?.num_cities}-${nationData?.nation_name}`);
        }
    }
    logger.debug(`[NEW CITY] Finished processing for nation: ${data[0].nation_id}`);
};

const updateCityHandler = (data: city[]) => {
    console.log('Update City', data[0]);
};

const deleteCityHandler = (data: city[]) => {
    console.log('Delete City', data[0]);
};

const callbackMapper = (model: subscriptionModel, event: subscriptionEvent): Function => {
    switch (model) {
        case subscriptionModel.CITY:
            switch (event) {
                case subscriptionEvent.CREATE:
                    return newCityHandler;
                case subscriptionEvent.UPDATE:
                    return updateCityHandler;
                case subscriptionEvent.DELETE:
                    return deleteCityHandler;
            }
    }
    return () => {};
};
