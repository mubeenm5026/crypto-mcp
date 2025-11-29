# API Reference

Complete reference for the Crypto MCP Server tools and data formats.

## Available Tools

### `get_price`

Get the current price of a cryptocurrency from Binance or CoinMarketCap.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol (e.g., "BTCUSDT", "ETHUSDT") |

#### Response Format

```typescript
{
  symbol: string;      // Normalized symbol (e.g., "BTCUSDT")
  price: number;       // Current price
  source: string;      // Data source: "binance" or "cmc"
  timestamp: number;   // Unix timestamp in milliseconds
}
```

#### Examples

**Request:**
```json
{
  "symbol": "BTCUSDT"
}
```

**Response (Binance):**
```json
{
  "symbol": "BTCUSDT",
  "price": 43250.50,
  "source": "binance",
  "timestamp": 1701234567890
}
```

**Response (CMC Fallback):**
```json
{
  "symbol": "BTC",
  "price": 43248.12,
  "source": "cmc",
  "timestamp": 1701234567890
}
```

#### Error Handling

If both Binance and CoinMarketCap fail, an error response is returned:

```json
{
  "error": "Failed to fetch price from all sources"
}
```

---

### `get_history`

Get historical candlestick (kline) data for a cryptocurrency from Binance.

#### Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `symbol` | string | Yes | Trading pair symbol (e.g., "BTCUSDT") |
| `interval` | string | Yes | Candlestick interval |
| `startTime` | string/number | No | Start time as ISO string or Unix timestamp |
| `endTime` | string/number | No | End time as ISO string or Unix timestamp (defaults to now) |

#### Supported Intervals

- **Minutes:** `1m`, `3m`, `5m`, `15m`, `30m`
- **Hours:** `1h`, `2h`, `4h`, `6h`, `8h`, `12h`
- **Days:** `1d`, `3d`
- **Weeks:** `1w`
- **Months:** `1M`

#### Response Format

Token-optimized array format to minimize LLM token usage:

```typescript
Array<[
  number,  // 0: Open time (Unix timestamp in ms)
  number,  // 1: Open price
  number,  // 2: High price
  number,  // 3: Low price
  number,  // 4: Close price
  number,  // 5: Volume
  number   // 6: Close time (Unix timestamp in ms)
]>
```

#### Examples

**Request (ISO Date):**
```json
{
  "symbol": "BTCUSDT",
  "interval": "1h",
  "startTime": "2024-01-01T00:00:00Z",
  "endTime": "2024-01-01T12:00:00Z"
}
```

**Request (Unix Timestamp):**
```json
{
  "symbol": "ETHUSDT",
  "interval": "1d",
  "startTime": 1704067200000,
  "endTime": 1704153600000
}
```

**Response:**
```json
[
  [1704067200000, 2300.50, 2350.00, 2280.00, 2340.00, 15234.56, 1704070800000],
  [1704070800000, 2340.00, 2360.00, 2320.00, 2355.00, 14567.89, 1704074400000],
  [1704074400000, 2355.00, 2380.00, 2340.00, 2370.00, 16789.12, 1704078000000]
]
```

#### Automatic Pagination

The `get_history` tool automatically handles Binance's 1000 candle limit per request:

- For large date ranges, multiple requests are made automatically
- Data is fetched in chunks and concatenated
- A small delay (100ms) is added between requests if fetching more than 2000 candles

#### Error Handling

```json
{
  "error": "Invalid symbol or interval"
}
```

## Data Sources

### Primary: Binance Public API

- **Endpoint:** `https://api.binance.com`
- **Rate Limits:** 1200 requests/minute (weight-based)
- **Authentication:** Not required (public endpoints)
- **Advantages:**
  - Real-time data
  - High accuracy
  - Comprehensive historical data
  - No API key needed

### Fallback: CoinMarketCap

- **Endpoint:** `https://pro-api.coinmarketcap.com`
- **Rate Limits:** 333 calls/day (basic plan)
- **Authentication:** API key required
- **Advantages:**
  - Reliable fallback
  - Wide cryptocurrency coverage
  - Professional-grade data

## Token Optimization

This MCP server is designed to minimize token usage:

1. **Compact Data Format**: Historical data uses arrays instead of objects
2. **Numeric Values**: Prices are numbers, not strings
3. **Minimal Metadata**: Only essential fields included
4. **Efficient Structure**: Flat arrays for kline data

### Token Comparison

**Standard JSON format (verbose):**
```json
[
  {
    "openTime": 1704067200000,
    "open": "2300.50",
    "high": "2350.00",
    "low": "2280.00",
    "close": "2340.00",
    "volume": "15234.56",
    "closeTime": 1704070800000
  }
]
```
**Estimated tokens:** ~45 tokens per candle

**Optimized array format:**
```json
[
  [1704067200000, 2300.50, 2350.00, 2280.00, 2340.00, 15234.56, 1704070800000]
]
```
**Estimated tokens:** ~20 tokens per candle

**Savings:** ~55% reduction in token usage

## Rate Limiting

### Binance

- **Weight-based system**: Each endpoint has a weight value
- **Limit:** 1200 weight per minute
- **Klines weight:** 1 per request
- **Price weight:** 1 per request

### CoinMarketCap

- **Basic Plan:** 10,000 calls per month (~333 calls/day)
- **Key Rotation:** Automatically switches between multiple keys when limits are reached
- **Credit-based:** Each call consumes 1 credit

## Best Practices

1. **Use appropriate intervals**: Request the coarsest interval that meets your needs
2. **Limit date ranges**: Avoid requesting years of minute-level data
3. **Cache results**: Cache historical data when possible
4. **Monitor rate limits**: Be aware of CMC's daily limits
5. **Multiple CMC keys**: Configure multiple API keys for higher availability

## Examples

### Get Current Bitcoin Price

```javascript
// MCP Tool Call
{
  "name": "get_price",
  "arguments": {
    "symbol": "BTCUSDT"
  }
}
```

### Get Last 24 Hours of Hourly Data

```javascript
{
  "name": "get_history",
  "arguments": {
    "symbol": "ETHUSDT",
    "interval": "1h",
    "startTime": Date.now() - 24 * 60 * 60 * 1000
  }
}
```

### Get Specific Date Range

```javascript
{
  "name": "get_history",
  "arguments": {
    "symbol": "BTCUSDT",
    "interval": "1d",
    "startTime": "2024-01-01T00:00:00Z",
    "endTime": "2024-01-31T23:59:59Z"
  }
}
```
