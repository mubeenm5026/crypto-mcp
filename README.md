# Crypto MCP Server

A Model Context Protocol (MCP) server that provides cryptocurrency data using Binance as the primary source and CoinMarketCap (CMC) as a fallback.

## Features

- **Multi-Source Data**: Fetches real-time prices from Binance.
- **Robust Fallback**: Automatically switches to CoinMarketCap if Binance fails or is rate-limited.
- **API Key Rotation**: Supports multiple CoinMarketCap API keys to handle rate limits and credit usage.
- **Historical Data**: Provides candlestick (kline) data from Binance with automatic pagination for large date ranges.

## Tools

### `get_price`
Get the current price of a cryptocurrency.
- **Arguments**:
  - `symbol` (string): The trading pair symbol (e.g., "BTCUSDT").

### `get_history`
Get historical candlestick data.
- **Arguments**:
  - `symbol` (string): The trading pair symbol.
  - `interval` (string): Time interval (e.g., "1h", "1d").
  - `startTime` (string/number): Start time (ISO string or timestamp).
  - `endTime` (string/number): End time (optional).

## Configuration

Create a `.env` file based on `.env.example`:

```env
BINANCE_API_KEY=your_binance_key
BINANCE_API_SECRET=your_binance_secret
COINMARKETCAP_API_KEYS=key1,key2,key3
```

## Installation

```bash
npm install
npm run build
```

## Usage

```bash
npm start
```
