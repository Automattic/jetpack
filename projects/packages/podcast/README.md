# Podcast for Jetpack

Hosts the wp-admin Podcast experience for Jetpack: the dashboard SPA, REST settings, and RSS feed customization for podcasting.

Podcast ships as a Jetpack plugin module (`Auto Activate: Yes`) that auto-activates on self-hosted Jetpack sites and owns its own admin menu item. It runs everywhere — WordPress.com Simple, WordPress.com Atomic (WoA), and self-hosted Jetpack — and owns the podcasting experience outright, now that the legacy stack it replaced has been removed.

## What's in the box

- **Dashboard SPA** — the wp-admin podcasting UI (`src/dashboard`, `src/admin-pages`).
- **REST settings** — read/write podcast configuration over the REST API.
- **RSS feed customization** — podcast-specific feed tags and metadata.

See [`AGENTS.md`](./AGENTS.md) for architecture notes and the UI-primitive conventions to follow when adding React UI to this package.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-podcast is licensed under [GNU General Public License v2 (or later)](https://www.gnu.org/licenses/gpl-2.0.html).
