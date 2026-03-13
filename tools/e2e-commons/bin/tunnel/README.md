# Tunnel Management

Tunnel management system for E2E testing with support for multiple providers.

## Usage

```bash
# Start tunnel (defaults to localtunnel)
node tunnel-cli.js on

# Start with specific provider
node tunnel-cli.js on --provider cloudflared

# Stop tunnel
node tunnel-cli.js off --provider cloudflared

# Clear stored data
node tunnel-cli.js clear --provider cloudflared

# Print help
node tunnel-cli.js --help
```

## Providers

### LocalTunnel
- Default provider
- No additional setup required, it's already part of node dependencies
- Uses random subdomains
- Can reuse a tunnel subdomain if you need to use the same site with the same URL

### Cloudflared
- Requires cloudflared binary installed. [See docs](https://developers.cloudflare.com/cloudflare-one/connections/connect-networks/do-more-with-tunnels/local-management/create-local-tunnel/#1-download-and-install-cloudflared) for instructions.
- Better concurrency performance

## Stored data

Tunnel state (URL and PID) is stored in files.

- `{temp_dir}/localtunnel-url` - Stored tunnel URL
- `{temp_dir}/localtunnel-pid` - Process ID file
- `{temp_dir}/cloudflared-url` - Cloudflare tunnel URL
- `{temp_dir}/cloudflared-pid` - Cloudflare process ID
