# Jetpack Forms

All things forms. This package currently contains the implementation for Jetpack's Contact Form module, Form blocks, and the new Jetpack Forms feedback dashboard.

## Hierarchy

```
.
├── src/
│   ├── blocks/                                      - Form blocks.
│   ├── contact-form/                                - Contact form module implementation.
│   ├── dashboard/                                   - Implementation for the new forms dashboard.
│   ├── service/                                     - Helpers for 3rd-party service integrations.
│   ├── class-jetpack-forms.php                      - Package entrypoint.
│
└── tools/                                           - Webpack configuration for all bundles in the package.
```

See the individual subdirectories for more information.

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

forms is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
