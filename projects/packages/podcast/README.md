# Podcast for Jetpack

Hosts the wp-admin Podcast experience for Jetpack: the dashboard SPA, REST settings, and RSS feed customization for podcasting.

Podcast ships as a Jetpack plugin module (`Auto Activate: Yes`) that auto-activates on self-hosted Jetpack sites and owns its own admin menu item. It runs everywhere — WordPress.com Simple, WordPress.com Atomic (WoA), and self-hosted Jetpack — and owns the podcasting experience outright, now that the legacy stack it replaced has been removed.

## Hierarchy

```
.
├── routes/                                          - Client-side routes for the dashboard SPA.
├── src/
│   ├── admin-pages/                                 - Extra wp-admin pages (e.g. Create AI Podcast).
│   ├── blocks/                                      - Editor blocks (Podcast Episode).
│   ├── dashboard/                                   - The wp-admin podcasting dashboard SPA (React/TS).
│   ├── editor/                                      - Post-editor integrations (post-publish promo).
│   ├── endpoints/                                   - REST API endpoints (settings, distribution, stats).
│   ├── feed/                                        - RSS feed customization and podcast feed tags.
│   ├── class-podcast.php                            - Package entrypoint; self-gates and loads the module.
│   ├── class-admin-page.php                         - Registers the "Jetpack > Podcast" admin menu + screen.
│   ├── class-settings.php                           - Registers the `podcasting_*` options and REST settings.
│   ├── class-podcast-gate.php                       - Premium podcast feature gate.
│   └── class-tracks.php                             - Records podcast lifecycle analytics events.
│
└── tests/                                           - PHPUnit and JS tests.
```

See the individual subdirectories for more information. For architecture notes and the UI-primitive conventions to follow when adding React UI, see [`AGENTS.md`](./AGENTS.md).

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

jetpack-podcast is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
