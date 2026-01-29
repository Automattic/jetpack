# Jetpack Public Abilities

Exposes WordPress abilities marked with the `public` annotation via unauthenticated REST endpoints. This is a temporary bridge until the WordPress Abilities API natively supports unauthenticated access for public abilities.

## Endpoints

- `GET /jetpack/v1/public-abilities` — List all public abilities and their schemas.
- `POST /jetpack/v1/public-abilities/{name}` — Execute a public ability with a JSON `input` body.

## Bot Discovery

When a bot visits the site, a machine-readable HTML section is rendered in `wp_footer` listing available public abilities and the REST endpoint URL.

## Usage

Initialize the package from your plugin:

```php
\Automattic\Jetpack\Public_Abilities::init();
```

In the Jetpack plugin this is gated behind the `jetpack_public_abilities_enabled` filter (default `false`).

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Licensed under [GNU General Public License v2 (or later)](./LICENSE.txt).
