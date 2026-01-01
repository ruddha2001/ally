import Keyv from 'keyv';

export class Cache {
    private static instance: Keyv | null = null;

    private static initCache() {
        Cache.instance = new Keyv();
    }

    static getCache() {
        if (!Cache.instance) {
            Cache.initCache();
        }
        return Cache.instance as Keyv;
    }
}
