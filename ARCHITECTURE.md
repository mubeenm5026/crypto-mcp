# Architecture

System design and architecture documentation for the Crypto MCP Server.

## Overview

The Crypto MCP Server is designed as a lightweight, token-efficient Model Context Protocol server that provides cryptocurrency data to LLM applications. The architecture emphasizes reliability, performance, and minimal token consumption.

## Design Philosophy

### 1. **Token Efficiency**
- Compact data formats (arrays vs objects)
- Minimal metadata overhead
- Numeric values instead of strings where possible

### 2. **Reliability**
- Multi-source data with automatic fallback
- Robust error handling
- API key rotation for rate limit management

### 3. **Simplicity**
- No authentication required for primary source
- Straightforward stdio-based MCP communication
- Easy deployment and configuration

## System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    MCP Client (Claude)                  │
└───────────────────────┬─────────────────────────────────┘
                        │ stdio
                        │ (JSON-RPC 2.0)
┌───────────────────────▼─────────────────────────────────┐
│                   MCP Server (Node.js)                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │           Tool Request Handlers                 │   │
│  │  • get_price                                    │   │
│  │  • get_history                                  │   │
│  └──────────────────┬──────────────────────────────┘   │
│                     │                                   │
│  ┌──────────────────▼──────────────────────────────┐   │
│  │        AggregatorService (Orchestrator)         │   │
│  │  • Route requests to appropriate service        │   │
│  │  • Handle fallback logic                        │   │
│  │  • Format responses                             │   │
│  └─────┬─────────────────────────────┬──────────────┘   │
│        │                             │                  │
│  ┌─────▼──────────┐          ┌──────▼──────────────┐   │
│  │ BinanceService │          │   CMCService        │   │
│  │  (Primary)     │          │   (Fallback)        │   │
│  └─────┬──────────┘          └──────┬──────────────┘   │
└────────┼──────────────────────────┼──────────────────────┘
         │                          │
    ┌────▼────────┐          ┌──────▼──────────┐
    │   Binance   │          │  CoinMarketCap  │
    │  Public API │          │   Pro API       │
    └─────────────┘          └─────────────────┘
```

## Component Details

### MCP Server Layer

**File:** `src/index.ts`

**Responsibilities:**
- Initialize MCP server with stdio transport
- Register tool handlers (`get_price`, `get_history`)
- Validate input parameters using Zod schemas
- Format responses according to MCP specification
- Handle errors and return appropriate error responses

**Key Features:**
- JSON-RPC 2.0 communication over stdio
- Type-safe parameter validation
- Standardized error handling

### AggregatorService

**File:** `src/services/aggregator.ts`

**Responsibilities:**
- Orchestrate data fetching across multiple sources
- Implement fallback logic (Binance → CMC)
- Normalize responses from different sources
- Handle service-level errors

**Fallback Logic:**
```
1. Try Binance (fast, no auth required)
   ↓ (on error)
2. Try CoinMarketCap (reliable fallback)
   ↓ (on error)
3. Return error response
```

**Decision Flow:**
```
get_price(symbol)
    │
    ├─→ BinanceService.getPrice()
    │   ├─ Success → Return data
    │   └─ Error ↓
    │
    └─→ CMCService.getPrice()
        ├─ Success → Return data
        └─ Error → Throw error
```

### BinanceService

**File:** `src/services/binance.ts`

**Responsibilities:**
- Fetch real-time prices from Binance
- Retrieve historical kline (candlestick) data
- Handle pagination for large date ranges
- Format data in token-optimized arrays

**Features:**
- **No Authentication**: Uses public endpoints
- **Automatic Pagination**: Handles Binance's 1000-candle limit
- **Rate Limit Respect**: Adds delays for large requests
- **Symbol Normalization**: Formats symbols correctly (BTCUSDT)

**Pagination Algorithm:**
```javascript
while (currentStartTime < targetEndTime) {
  // Fetch up to 1000 candles
  data = await fetchKlines(symbol, interval, currentStartTime, targetEndTime, 1000)
  
  if (data.length === 0) break
  
  allKlines.push(...data)
  
  // Move to next batch
  currentStartTime = lastCandle.closeTime + 1
  
  // Add delay if fetching large dataset
  if (allKlines.length > 2000) {
    await delay(100ms)
  }
}
```

### CMCService

**File:** `src/services/cmc.ts`

**Responsibilities:**
- Fallback price data from CoinMarketCap
- API key rotation for rate limit management
- Symbol mapping and normalization

**Features:**
- **Multi-Key Support**: Rotates through multiple API keys
- **Rate Limit Handling**: Tracks usage per key
- **Symbol Conversion**: Converts trading pairs to CMC format (BTCUSDT → BTC)

**Key Rotation Logic:**
```javascript
keys = [key1, key2, key3]
currentKeyIndex = 0

on request:
  try:
    use keys[currentKeyIndex]
  on rate_limit_error:
    currentKeyIndex = (currentKeyIndex + 1) % keys.length
    retry with new key
```

## Data Flow

### get_price Tool

```
1. Client Request
   ↓
2. MCP Server validates parameters
   ↓
3. AggregatorService.getPrice(symbol)
   ↓
4. BinanceService.getPrice(symbol)
   ├─ HTTP GET /api/v3/ticker/price?symbol=BTCUSDT
   ├─ Parse response
   └─ Return { symbol, price, source: 'binance', timestamp }
   ↓
5. Format as MCP response
   ↓
6. Return to client via stdio
```

### get_history Tool

```
1. Client Request
   ↓
2. MCP Server validates and parses dates
   ↓
3. AggregatorService.getKlines(symbol, interval, start, end)
   ↓
4. BinanceService.getKlines() with pagination
   ├─ Loop until all data fetched:
   │  ├─ HTTP GET /api/v3/klines
   │  ├─ Parse and convert to numbers
   │  ├─ Append to results
   │  └─ Update startTime
   └─ Return array of arrays
   ↓
5. Format as MCP response
   ↓
6. Return to client via stdio
```

## Configuration Management

**File:** `src/config.ts`

```typescript
export const config = {
  binanceApiKey: process.env.BINANCE_API_KEY,      // Optional (not used)
  binanceApiSecret: process.env.BINANCE_API_SECRET, // Optional (not used)
  cmcApiKeys: process.env.COINMARKETCAP_API_KEYS.split(',')
}
```

**Environment Loading:**
- Uses `dotenv` for `.env` file parsing
- Validates required configuration (CMC keys)
- Warns if critical config is missing

## Error Handling

### Levels of Error Handling

1. **Service Level** (Binance/CMC)
   - HTTP errors
   - Invalid responses
   - Rate limiting

2. **Aggregator Level**
   - Fallback coordination
   - Source selection
   - Response normalization

3. **MCP Server Level**
   - Parameter validation
   - Tool execution errors
   - Response formatting

### Error Response Format

```json
{
  "content": [{
    "type": "text",
    "text": "{\"error\": \"Error message\"}"
  }],
  "isError": true
}
```

## Performance Considerations

### Token Optimization

**Array Format vs Object Format:**

❌ **Object Format** (verbose):
```json
{
  "openTime": 1704067200000,
  "open": "2300.50",
  "high": "2350.00"
}
```

✅ **Array Format** (optimized):
```json
[1704067200000, 2300.50, 2350.00, ...]
```

**Benefits:**
- ~55% token reduction
- Faster parsing
- Lower memory footprint

### Memory Management

- **Streaming**: Data is processed in chunks during pagination
- **No Caching**: Stateless design keeps memory usage minimal
- **Automatic GC**: Node.js handles cleanup efficiently

### Network Optimization

- **Connection Reuse**: Axios client instances reuse connections
- **Minimal Payloads**: Request only necessary fields
- **Batch Prevention**: Rate limiting prevents overwhelming APIs

## Security Considerations

### API Key Protection

- Keys stored in environment variables
- Never logged or exposed in responses
- Loaded only at startup

### Input Validation

- Zod schemas validate all inputs
- Symbol sanitization prevents injection
- Date parsing prevents invalid ranges

### Rate Limit Protection

- Automatic delays for large requests
- Multiple CMC keys prevent lockout
- Respects API provider limits

## Future Enhancements

### Potential Improvements

1. **Caching Layer**
   - Redis for frequently requested data
   - TTL-based cache invalidation
   - Reduced API calls

2. **Additional Data Sources**
   - Kraken, Coinbase, etc.
   - More redundancy
   - Better coverage

3. **WebSocket Support**
   - Real-time price streaming
   - Lower latency
   - Reduced polling

4. **Historical Data Cache**
   - Local storage of old klines
   - Faster retrieval
   - Reduced API usage

5. **Metrics & Monitoring**
   - Request logging
   - Error tracking
   - Performance metrics

6. **Advanced Tools**
   - Technical indicators (SMA, RSI, etc.)
   - Order book data
   - Trading volume analysis

## Deployment Architecture

### Standalone Deployment

```
┌─────────────────┐
│  Claude Desktop │
│                 │
│  ┌───────────┐  │
│  │  crypto-  │  │
│  │    mcp    │  │
│  │  (stdio)  │  │
│  └───────────┘  │
└─────────────────┘
```

### Server Deployment (Future)

```
┌─────────────┐         ┌──────────────┐
│   Client    │  HTTP   │  MCP Server  │
│             │◄───────►│   (Node.js)  │
└─────────────┘         └──────────────┘
```

## Technology Stack

- **Runtime:** Node.js (v20+)
- **Language:** TypeScript
- **MCP SDK:** @modelcontextprotocol/sdk v0.6.0
- **HTTP Client:** Axios
- **Validation:** Zod
- **Configuration:** dotenv

## Development Workflow

```bash
# Development
npm run dev        # Watch mode with ts-node

# Production
npm run build      # Compile TypeScript
npm start          # Run compiled code

# Testing
npm test           # (Future: test suite)
```

## Conclusion

The Crypto MCP Server is designed to be a reliable, efficient, and easy-to-deploy solution for cryptocurrency data access in LLM applications. Its layered architecture provides flexibility for future enhancements while maintaining simplicity in its current form.
