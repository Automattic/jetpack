# Masterbar

The WordPress.com Toolbar feature replaces the default admin bar and offers quick links to the Reader, all your sites, your WordPress.com profile, and notifications.

## Get Started 

Package is published in [Packagist](https://packagist.org/packages/automattic/jetpack-masterbar). We recommend using the latest version there, or you can also test with the latest development versions like below:

```
"require": {
    "automattic/jetpack-autoloader": "dev-trunk",
    "automattic/jetpack-masterbar": "dev-trunk"
}
```

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## Build System

_Note: `cd` to `projects/packages/masterbar` before running these commands_

- `npm run build`<br>
  Compiles the plugins for development - the files are not minified and we produce a source map.

- `npm run build-production`<br>
  Compiles the plugins for production - we produce minified files without source maps.

- `npm run clean`<br>
  Removes all build files.

## License

masterbar is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
