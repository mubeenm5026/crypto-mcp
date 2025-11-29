import { BinanceService } from './binance.js';
import { CMCService } from './cmc.js';
import { KlineData, PriceData } from '../types.js';

export class AggregatorService {
    private binance: BinanceService;
    private cmc: CMCService;

    constructor() {
        this.binance = new BinanceService();
        this.cmc = new CMCService();
    }

    async getPrice(symbol: string): Promise<PriceData> {
        try {
            // Primary: Binance
            return await this.binance.getPrice(symbol);
        } catch (error) {
            console.warn(`Binance failed for ${symbol}, switching to CMC fallback...`);
            try {
                // Fallback: CMC
                return await this.cmc.getPrice(symbol);
            } catch (cmcError) {
                console.error(`All sources failed for ${symbol}`);
                throw new Error(`Failed to fetch price for ${symbol} from both Binance and CMC`);
            }
        }
    }

    async getKlines(symbol: string, interval: string, startTime?: number, endTime?: number): Promise<KlineData[]> {
        // For Klines, we primarily rely on Binance as CMC free tier doesn't support OHLCV well.
        // If Binance fails, we might just have to throw error or return empty, 
        // unless we implement a very basic "current price as a candle" fallback which is not useful for history.
        try {
            return await this.binance.getKlines(symbol, interval, startTime, endTime);
        } catch (error) {
            console.error(`Binance getKlines failed for ${symbol}`, error);
            throw new Error(`Failed to fetch klines for ${symbol}. CMC fallback not supported for historical data.`);
        }
    }
}
