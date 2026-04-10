# crypto-ticker-api

Lightweight, self-hostable crypto price & gas API. Perfect for Raspberry Pi, home servers, or any Node.js environment.

## Features

- Real-time crypto prices via CoinGecko (no API key needed)
- Trending coins endpoint
- Ethereum gas prices
- Built-in response caching (1 min TTL)
- Zero dependencies - pure Node.js
- CORS enabled

## Quick Start

```bash
node server.js
# or
PORT=8080 node server.js
```

## API Endpoints

| Endpoint | Description |
|----------|-------------|
| `GET /` | API info and available endpoints |
| `GET /prices` | Top coin prices (default: BTC, ETH, SOL) |
| `GET /prices?ids=bitcoin,dogecoin&vs=eur` | Custom coins and currency |
| `GET /trending` | Trending coins on CoinGecko |
| `GET /gas` | Ethereum gas prices |
| `GET /health` | Server health and uptime |

## Example

```bash
curl http://localhost:3456/prices?ids=bitcoin,ethereum&vs=usd
```

## Deploy

```bash
# systemd service
sudo cp crypto-ticker.service /etc/systemd/system/
sudo systemctl enable --now crypto-ticker
```

## License

MIT
