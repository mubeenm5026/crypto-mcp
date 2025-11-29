import axios from 'axios';
import { KlineData, PriceData } from '../types.js';
import { config } from '../config.js';

const BASE_URL = 'https://api.binance.com';

export class BinanceService {
    private client = axios.create({
        baseURL: BASE_URL,
        headers: {
            'X-MBX-APIKEY': config.binanceApiKey,
        },
    });

    async getPrice(symbol: string): Promise<PriceData> {
        // Binance uses BTCUSDT format
        const formattedSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

        try {
            const response = await this.client.get('/api/v3/ticker/price', {
                params: { symbol: formattedSymbol }
            });

            return {
                symbol: formattedSymbol,
                price: parseFloat(response.data.price),
                source: 'binance',
                timestamp: Date.now()
            };
        } catch (error) {
            console.error(`Binance getPrice error for ${symbol}:`, error);
            throw error;
        }
    }

    async getKlines(symbol: string, interval: string, startTime?: number, endTime?: number, limit: number = 1000): Promise<KlineData[]> {
        const formattedSymbol = symbol.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
        const allKlines: KlineData[] = [];

        // Default to last 24h if not specified
        let currentStartTime = startTime || (Date.now() - 24 * 60 * 60 * 1000);
        const targetEndTime = endTime || Date.now();

        // Loop for pagination
        while (currentStartTime < targetEndTime) {
            try {
                const response = await this.client.get('/api/v3/klines', {
                    params: {
                        symbol: formattedSymbol,
                        interval: interval,
                        startTime: currentStartTime,
                        endTime: targetEndTime,
                        limit: limit
                    }
                });

                const data = response.data;
                if (!data || data.length === 0) break;

                const klines: KlineData[] = data.map((k: any[]) => ({
                    openTime: k[0],
                    open: parseFloat(k[1]),
                    high: parseFloat(k[2]),
                    low: parseFloat(k[3]),
                    close: parseFloat(k[4]),
                    volume: parseFloat(k[5]),
                    closeTime: k[6]
                }));

                allKlines.push(...klines);

                // Update startTime to the closeTime of the last candle + 1ms
                const lastCandle = klines[klines.length - 1];
                currentStartTime = lastCandle.closeTime + 1;

                // Safety break if we reached the end or got fewer items than limit (meaning no more data)
                if (klines.length < limit || currentStartTime >= targetEndTime) {
                    break;
                }

                // Small delay to respect weight limits if looping a lot
                if (allKlines.length > 2000) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

            } catch (error) {
                console.error(`Binance getKlines error for ${symbol}:`, error);
                throw error;
            }
        }

        return allKlines;
    }
}
