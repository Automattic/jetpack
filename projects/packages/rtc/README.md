# RTC

Real-time collaboration websocket transport support using WordPress.com infrastructure.

This package extends Gutenberg's Real-Time Collaboration (RTC) feature with a PingHub WebSocket transport provider, replacing the default HTTP polling with persistent WebSocket connections through the WordPress.com PingHub service.

## How to install rtc

### Installation From Git Repo

## Usage

Add the package as a dependency in your plugin's `composer.json`:

```json
"require": {
    "automattic/jetpack-rtc": "@dev"
}
```

Then initialize it in your plugin:

```php
use Automattic\Jetpack\Rtc;

RTC::init();
```

## Architecture

The package has two main layers:

### PHP (`src/`)

- **`RTC`** — Main class. Manages providers, enqueues assets, registers REST routes, and handles the RTC settings.
- **`REST_Pinghub_Token`** — REST endpoint that generates short-lived JWTs for PingHub WebSocket authentication.

### JavaScript (`src/js/`)

- **`rtc.ts`** — Entry point. Registers the PingHub provider via the `sync.providers` filter.
- **`providers/pinghub/`** — PingHub provider implementation:
  - `pinghub-provider.ts` — Yjs provider (thin shell delegating to the manager).
  - `pinghub-manager.ts` — Per-room sync protocol, awareness, and reconnection logic.
  - `pinghub-bridge.ts` — WebSocket transport layer.

## Contribute

## Get Help

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

rtc is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
