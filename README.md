# Crypto MCP Server

A Model Context Protocol (MCP) server that provides cryptocurrency data using Binance public API as the primary source and CoinMarketCap (CMC) as a fallback.

## Features

- **Public Data Access**: Fetches real-time prices from Binance public endpoints (no API key required)
- **Robust Fallback**: Automatically switches to CoinMarketCap if Binance fails or is rate-limited
- **API Key Rotation**: Supports multiple CoinMarketCap API keys to handle rate limits and credit usage
- **Historical Data**: Provides candlestick (kline) data from Binance with automatic pagination for large date ranges
- **Token-Optimized**: Returns data in compact array format to minimize LLM token usage

## Available Tools

### `get_price`
Get the current price of a cryptocurrency.

**Parameters:**
- `symbol` (string): Trading pair symbol (e.g., "BTCUSDT", "ETHUSDT")

**Returns:**
```json
{
  "symbol": "BTCUSDT",
  "price": 43250.50,
  "source": "binance",
  "timestamp": 1701234567890
}
```

### `get_history`
Get historical candlestick (kline) data from Binance.

**Parameters:**
- `symbol` (string): Trading pair symbol (e.g., "BTCUSDT")
- `interval` (string): Time interval - `1m`, `5m`, `15m`, `30m`, `1h`, `4h`, `1d`, `1w`, etc.
- `startTime` (string/number, optional): Start time as ISO string or timestamp
- `endTime` (string/number, optional): End time as ISO string or timestamp (defaults to now)

**Returns:** Token-optimized array format
```javascript
[
  [OpenTime, Open, High, Low, Close, Volume, CloseTime],
  [1701234567890, 43250.50, 43500.00, 43100.00, 43400.00, 1234.56, 1701238167890],
  // ... more candles
]
```

## Installation

```bash
npm install
npm run build
```

## Configuration

### Environment Variables

Create a `.env` file in the project root:

```env
# CoinMarketCap API Keys (Required for fallback)
# You can provide multiple keys separated by commas for rotation
COINMARKETCAP_API_KEYS=your_cmc_api_key_1,your_cmc_api_key_2

# Note: Binance API keys are NOT required
# This server uses Binance public endpoints
```

Get your free CoinMarketCap API key at: https://coinmarketcap.com/api/

### MCP Client Configuration

To use this server with Claude Desktop, add to your MCP settings file:

**macOS:** `~/Library/Application Support/Claude/claude_desktop_config.json`

**Windows:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "crypto-mcp": {
      "command": "node",
      "args": ["/absolute/path/to/crypto-mcp/build/index.js"]
    }
  }
}
```

## Usage

### Running the Server

```bash
npm start
```

The server communicates via stdio and will wait for MCP client connections.

### Development Mode

```bash
npm run dev
```

## Documentation

- [API Reference](./API_REFERENCE.md) - Detailed API documentation
- [Architecture](./ARCHITECTURE.md) - System design and architecture
- [Deployment Guide](./DEPLOYMENT.md) - Production deployment instructions

## License

ISC
