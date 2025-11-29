import dotenv from 'dotenv';
import { ServiceConfig } from './types.js';

dotenv.config();

export const config: ServiceConfig = {
    binanceApiKey: process.env.BINANCE_API_KEY,
    binanceApiSecret: process.env.BINANCE_API_SECRET,
    cmcApiKeys: (process.env.COINMARKETCAP_API_KEYS || '').split(',').map(k => k.trim()).filter(k => k.length > 0),
};

if (config.cmcApiKeys.length === 0) {
    console.warn('WARNING: No CoinMarketCap API keys provided. Fallback will not work.');
}
