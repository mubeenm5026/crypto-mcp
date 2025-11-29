export interface PriceData {
    symbol: string;
    price: number;
    source: 'binance' | 'cmc';
    timestamp: number;
}

export interface KlineData {
    openTime: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    closeTime: number;
}

export interface ServiceConfig {
    binanceApiKey?: string;
    binanceApiSecret?: string;
    cmcApiKeys: string[];
}
