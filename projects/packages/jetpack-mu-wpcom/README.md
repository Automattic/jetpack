# WordPress.com Features (jetpack-mu-wpcom)

Note: This package is intended for internal use by WordPress.com only.

Enhances your site with features powered by WordPress.com

Automattician? Read more at: PCYsg-Osp-p2

## Using this package in your WordPress plugin

If you plan on using this package in your WordPress plugin, we would recommend that you use [Jetpack Autoloader](https://packagist.org/packages/automattic/jetpack-autoloader) as your autoloader. This will allow for maximum interoperability with other plugins that use this package as well.

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## Build System

_Note: `cd` to `projects/packages/jetpack-mu-wpcom` before running these commands_

- `npm run build-js`<br>
  Compiles the plugins for development - the files are not minified and we produce a source map.

- `npm run build-production-js`<br>
  Compiles the plugins for production - we produce minified files without source maps.

- `npm run clean`<br>
  Removes all build files.

The entry point is:

- **Plugin**: `projects/packages/jetpack-mu-wpcom/src/features/{{feature-name}}/index.js`

The output is:

- **Plugin**: `/projects/packages/jetpack-mu-wpcom/src/build/{{feature-name}}/{{feature-name}}.js`

### Adding files to the build system

If you're adding a new feature that includes Javascript or Typescript, you will need to add the primary source file to the `entry` section in `projects/packages/jetpack-mu-wpcom/webpack.config.js`, where we'll use the key as the core file name, and the value as the primary input file for that module.

## License

jetpack-mu-wpcom is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt)
