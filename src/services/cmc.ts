import axios from 'axios';
import { PriceData } from '../types.js';
import { config } from '../config.js';

const BASE_URL = 'https://pro-api.coinmarketcap.com';

export class CMCService {
    private currentKeyIndex = 0;
    private apiKeys = config.cmcApiKeys;

    private getHeaders() {
        if (this.apiKeys.length === 0) {
            throw new Error('No CMC API keys available');
        }
        return {
            'X-CMC_PRO_API_KEY': this.apiKeys[this.currentKeyIndex],
            'Accept': 'application/json'
        };
    }

    private rotateKey() {
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;
        console.log(`Rotated CMC API Key to index ${this.currentKeyIndex}`);
    }

    async getPrice(symbol: string): Promise<PriceData> {
        // CMC often uses symbols like BTC, ETH. 
        // If input is BTCUSDT, we might need to strip USDT or use a map.
        // For simplicity, we'll try to guess the base asset if it ends in USDT/USD, 
        // or just pass the symbol if it looks like a ticker.
        // However, CMC quotes endpoint allows converting to USD.

        let baseSymbol = symbol.toUpperCase();
        if (baseSymbol.endsWith('USDT')) baseSymbol = baseSymbol.replace('USDT', '');
        else if (baseSymbol.endsWith('USD')) baseSymbol = baseSymbol.replace('USD', '');

        // Try up to the number of keys we have
        let attempts = 0;
        while (attempts < this.apiKeys.length) {
            try {
                const response = await axios.get(`${BASE_URL}/v1/cryptocurrency/quotes/latest`, {
                    headers: this.getHeaders(),
                    params: {
                        symbol: baseSymbol,
                        convert: 'USD'
                    }
                });

                const data = response.data.data[baseSymbol];
                if (!data) {
                    throw new Error(`Symbol ${baseSymbol} not found on CMC`);
                }

                const quote = data.quote.USD;

                return {
                    symbol: symbol, // Return original requested symbol
                    price: quote.price,
                    source: 'cmc',
                    timestamp: Date.now() // CMC update time: new Date(quote.last_updated).getTime()
                };

            } catch (error: any) {
                console.error(`CMC getPrice error with key index ${this.currentKeyIndex}:`, error?.response?.data || error.message);

                // Check for rate limit (429) or unauthorized (401 - maybe expired key)
                if (error.response && (error.response.status === 429 || error.response.status === 401 || error.response.status === 402)) {
                    this.rotateKey();
                    attempts++;
                } else {
                    // Other errors (e.g. symbol not found) shouldn't trigger rotation necessarily, but let's throw
                    throw error;
                }
            }
        }

        throw new Error('All CMC API keys exhausted or failed');
    }
}
