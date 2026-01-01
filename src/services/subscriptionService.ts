import {
    subscriptionEvent,
    subscriptionModel,
} from 'pnwkit-2.0/build/src/interfaces/subscriptions/index.js';
import { PnwKit } from '../lib/pnwKit.js';
import { city } from 'pnwkit-2.0/build/src/interfaces/queries/city.js';
import logger from '../lib/logger.js';
import { getAllAllianceIds } from './guildService.js';

const inMemoryChannelMap: Map<subscriptionModel, Map<subscriptionEvent, string>> = new Map<
    subscriptionModel,
    Map<subscriptionEvent, string>
>();
const SupportedSubscriptionList = [subscriptionModel.CITY];
const processSubscriptionChannels = async (
    opType: subscriptionEvent = subscriptionEvent.CREATE,
) => {
    const all_alliance_ids = await getAllAllianceIds();
    for (const model of SupportedSubscriptionList) {
        for (const event of [
            subscriptionEvent.CREATE,
            subscriptionEvent.UPDATE,
            subscriptionEvent.DELETE,
        ]) {
            const channel = await PnwKit.getKit()?.subscriptionChannel(model, opType, {
                alliance_id: all_alliance_ids,
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

const newCityHandler = (data: city[]) => {
    console.log('New City', data[0]);
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
