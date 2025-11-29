# Deployment Guide

Complete guide for deploying and configuring the Crypto MCP Server in production and development environments.

## Prerequisites

### System Requirements

- **Node.js:** v20.0.0 or higher
- **npm:** v10.0.0 or higher
- **Operating System:** macOS, Linux, or Windows

### API Keys

- **CoinMarketCap API Key** (Required)
  - Sign up at: https://coinmarketcap.com/api/
  - Free tier provides 10,000 calls/month
  - Multiple keys recommended for higher availability

- **Binance API Key** (Not Required)
  - This server uses Binance public endpoints
  - No authentication needed

## Installation

### 1. Clone or Download

```bash
# If using Git
git clone https://github.com/yourusername/crypto-mcp.git
cd crypto-mcp

# Or download and extract the ZIP file
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your CoinMarketCap API key(s):

```env
# Single key
COINMARKETCAP_API_KEYS=your_api_key_here

# Multiple keys (recommended)
COINMARKETCAP_API_KEYS=key1,key2,key3
```

### 4. Build the Project

```bash
npm run build
```

This compiles TypeScript to JavaScript in the `build/` directory.

### 5. Test the Server

```bash
npm start
```

The server should start and wait for stdio connections. You should see:
```
Server running, waiting for MCP connections...
```

Press `Ctrl+C` to stop.

## MCP Client Configuration

### Claude Desktop (macOS)

1. **Locate the config file:**
   ```
   ~/Library/Application Support/Claude/claude_desktop_config.json
   ```

2. **Edit the configuration:**
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

3. **Replace** `/absolute/path/to/crypto-mcp` with your actual path:
   ```bash
   # Get the absolute path
   cd /path/to/crypto-mcp
   pwd
   ```

4. **Restart Claude Desktop**

### Claude Desktop (Windows)

1. **Locate the config file:**
   ```
   %APPDATA%\Claude\claude_desktop_config.json
   ```

2. **Edit the configuration:**
   ```json
   {
     "mcpServers": {
       "crypto-mcp": {
         "command": "node",
         "args": ["C:\\absolute\\path\\to\\crypto-mcp\\build\\index.js"]
       }
     }
   }
   ```

3. **Use double backslashes** in Windows paths

4. **Restart Claude Desktop**

### Other MCP Clients

For other MCP-compatible clients, refer to their documentation for stdio server configuration. The general pattern is:

```json
{
  "command": "node",
  "args": ["/path/to/crypto-mcp/build/index.js"]
}
```

## Verification

### 1. Check Server Status

In Claude Desktop, you should see the crypto-mcp tools available:
- `get_price`
- `get_history`

### 2. Test get_price

Ask Claude:
```
What's the current price of Bitcoin?
```

Claude should use the `get_price` tool and return current BTC price.

### 3. Test get_history

Ask Claude:
```
Show me the Bitcoin price history for the last 7 days
```

Claude should use the `get_history` tool and return historical data.

## Production Deployment

### Running as a System Service (Linux)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/crypto-mcp.service
```

Add the following:

```ini
[Unit]
Description=Crypto MCP Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/crypto-mcp
ExecStart=/usr/bin/node /path/to/crypto-mcp/build/index.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable crypto-mcp
sudo systemctl start crypto-mcp
sudo systemctl status crypto-mcp
```

### Running with PM2 (Recommended)

PM2 is a production process manager for Node.js:

```bash
# Install PM2 globally
npm install -g pm2

# Start the server
pm2 start build/index.js --name crypto-mcp

# Save the process list
pm2 save

# Setup startup script
pm2 startup
```

**PM2 Commands:**
```bash
pm2 status            # Check status
pm2 logs crypto-mcp   # View logs
pm2 restart crypto-mcp # Restart
pm2 stop crypto-mcp   # Stop
pm2 delete crypto-mcp # Remove
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

CMD ["node", "build/index.js"]
```

Build and run:

```bash
# Build image
docker build -t crypto-mcp .

# Run container
docker run -d \
  --name crypto-mcp \
  --env-file .env \
  crypto-mcp
```

## Configuration Options

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `COINMARKETCAP_API_KEYS` | Yes | - | Comma-separated CMC API keys |

### Multiple API Keys

For high-availability deployments, configure multiple CoinMarketCap API keys:

```env
COINMARKETCAP_API_KEYS=key1,key2,key3,key4
```

**Benefits:**
- Automatic rotation on rate limits
- 4x capacity (40,000 calls/month)
- Better reliability

## Monitoring

### Log Files

The server logs to stdout/stderr. Capture logs using your process manager:

**PM2:**
```bash
pm2 logs crypto-mcp
```

**Systemd:**
```bash
journalctl -u crypto-mcp -f
```

**Docker:**
```bash
docker logs -f crypto-mcp
```

### Health Checks

Monitor server health by checking process status and log output for errors.

**Key indicators:**
- Server starts without errors
- No CMC API key warnings
- Successful responses to tool calls

## Troubleshooting

### Server Won't Start

**Issue:** `Error: Cannot find module`
```bash
# Solution: Rebuild the project
npm run build
```

**Issue:** `WARNING: No CoinMarketCap API keys provided`
```bash
# Solution: Check .env file exists and contains valid keys
cat .env
```

### Claude Desktop Can't Find Server

**Issue:** Tools not appearing in Claude Desktop

1. **Check config path** is absolute:
   ```json
   {
     "command": "node",
     "args": ["/Users/yourname/crypto-mcp/build/index.js"]
   }
   ```

2. **Verify file exists:**
   ```bash
   ls -la /path/to/crypto-mcp/build/index.js
   ```

3. **Restart Claude Desktop** completely

4. **Check Claude Desktop logs** (if available)

### Rate Limit Errors

**Issue:** `Rate limit exceeded` errors

**Solutions:**
1. Add more CoinMarketCap API keys
2. Reduce request frequency
3. Wait for rate limit reset (1 day for CMC)

**Check remaining credits:**
- Log in to CoinMarketCap dashboard
- View API key usage statistics

### Binance Errors

**Issue:** Binance requests failing

1. **Check Binance status:** https://www.binance.com/en/support/announcement
2. **Verify symbol format:** Use correct format (BTCUSDT, not BTC-USDT)
3. **Check internet connectivity**

**Note:** Binance failures automatically fallback to CoinMarketCap

### Invalid Symbol Errors

**Issue:** `Invalid symbol` or empty responses

**Solutions:**
- Use correct trading pair format: `BTCUSDT`, `ETHUSDT`
- Verify symbol exists on Binance
- Check for typos in symbol name

## Upgrading

### Update to Latest Version

```bash
# Pull latest changes (if using Git)
git pull origin main

# Install new dependencies
npm install

# Rebuild
npm run build

# Restart server
pm2 restart crypto-mcp
# or
sudo systemctl restart crypto-mcp
```

## Security Best Practices

### 1. Protect API Keys

- Never commit `.env` file to version control
- Use environment variables in production
- Rotate keys periodically

### 2. Limit Access

- Run server with limited user permissions
- Use firewall rules if exposing network ports
- Monitor access logs

### 3. Keep Updated

- Update Node.js regularly
- Update npm dependencies
- Monitor security advisories

## Performance Optimization

### 1. Node.js Configuration

```bash
# Increase memory limit if needed
node --max-old-space-size=4096 build/index.js
```

### 2. Request Optimization

- Use appropriate intervals for historical data
- Avoid requesting excessive date ranges
- Cache results when possible (in client)

### 3. Rate Limit Management

- Configure multiple CMC API keys
- Monitor usage patterns
- Plan requests within rate limits

## Backup and Recovery

### Configuration Backup

```bash
# Backup .env file (store securely)
cp .env .env.backup

# Backup Claude Desktop config
cp ~/Library/Application\ Support/Claude/claude_desktop_config.json \
   ~/claude_config_backup.json
```

### Recovery

```bash
# Restore .env
cp .env.backup .env

# Rebuild and restart
npm install
npm run build
pm2 restart crypto-mcp
```

## Support and Resources

- **Documentation:** Check [README.md](./README.md), [API_REFERENCE.md](./API_REFERENCE.md), [ARCHITECTURE.md](./ARCHITECTURE.md)
- **Binance API Docs:** https://binance-docs.github.io/apidocs/spot/en/
- **CoinMarketCap API Docs:** https://coinmarketcap.com/api/documentation/v1/
- **MCP Documentation:** https://modelcontextprotocol.io/

## Quick Reference

### Common Commands

```bash
# Development
npm run dev              # Run in development mode
npm run build            # Build for production
npm start                # Start production server

# PM2
pm2 start build/index.js --name crypto-mcp
pm2 status
pm2 logs crypto-mcp
pm2 restart crypto-mcp

# Docker
docker build -t crypto-mcp .
docker run -d --env-file .env crypto-mcp
docker logs -f crypto-mcp
```

### File Locations

- **Project:** `/path/to/crypto-mcp/`
- **Build output:** `./build/`
- **Configuration:** `./.env`
- **Claude Desktop config (macOS):** `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Claude Desktop config (Windows):** `%APPDATA%\Claude\claude_desktop_config.json`
