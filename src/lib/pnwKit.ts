import { Kit } from 'pnwkit-2.0';

export class PnwKit {
    private static kit: Kit | null = null;
    static initKit(apiKey: string) {
        PnwKit.kit = new Kit();
        PnwKit.kit.setKeys(apiKey);
    }

    static getKit() {
        if (!PnwKit.kit) {
            PnwKit.initKit(process.env.PNW_API_KEY as string);
        }
        return PnwKit.kit;
    }
}
