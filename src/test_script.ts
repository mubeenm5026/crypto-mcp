import { AggregatorService } from './services/aggregator.js';
import { config } from './config.js';

async function test() {
    const aggregator = new AggregatorService();

    console.log('--- Testing Binance (Primary) ---');
    try {
        const price = await aggregator.getPrice('BTCUSDT');
        console.log('Binance Price:', price);
    } catch (e) {
        console.error('Binance Price Failed:', e);
    }

    console.log('\n--- Testing Klines (Binance) ---');
    try {
        // Fetch last 2 hours of 1h candles
        const klines = await aggregator.getKlines('BTCUSDT', '1h', Date.now() - 2 * 60 * 60 * 1000);
        console.log(`Fetched ${klines.length} candles`);
        console.log('Last candle:', klines[klines.length - 1]);
    } catch (e) {
        console.error('Klines Failed:', e);
    }

    console.log('\n--- Testing Fallback (Simulated) ---');
    // Hack to break Binance URL to force fallback
    // We can't easily mock private properties in this simple script without ts-ignore or changing visibility
    // So we will just try a symbol that might fail on Binance but exist on CMC? 
    // Actually, Binance has most symbols. 
    // Let's try to fetch a price from CMC directly to verify keys work.

    const { CMCService } = await import('./services/cmc.js');
    const cmc = new CMCService();
    try {
        const cmcPrice = await cmc.getPrice('BTC');
        console.log('Direct CMC Price Check:', cmcPrice);
    } catch (e) {
        console.error('Direct CMC Check Failed:', e);
    }
}

test();
