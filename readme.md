# Jetpack Monorepo

[![License](https://poser.pugx.org/automattic/jetpack/license.svg)](https://www.gnu.org/licenses/gpl-2.0.html)

Welcome to the Jetpack Monorepo! This repository houses the source code for various Jetpack plugins, Composer and JavaScript packages used by these plugins, and more.

## Installation of Jetpack Plugin on Your Site

If you simply want to use Jetpack on your website and do not plan to develop with it, we recommend installing Jetpack from pre-built sources. You can find installation details on [this page](https://github.com/Automattic/jetpack-production#jetpack).

## Developing with the Monorepo

If you're interested in developing with the Jetpack Monorepo, please refer to the [Quick Start Guide](./docs/quick-start.md) for detailed instructions.

### Installation from the Git Monorepo

To run the Jetpack plugin from the Monorepo, you'll need to build it. Follow the instructions provided [here](./docs/development-environment.md) to get started.

If you're using the [Docker development environment](./docs/development-environment.md#docker-supported-recommended), you should be all set.

If not, you'll need to create a symbolic link to the Jetpack plugin from your WordPress `wp-content/plugins` folder (please note that you cannot clone the Monorepo directly into your WordPress plugins directory). To do this, you'll need the filesystem paths for both the Monorepo checkout and your WordPress installation. On Linux or macOS, use the `ln -s` command in your terminal, like this:

```sh
ln -s /path/to/jetpack-monorepo/projects/plugins/jetpack /path/to/wordpress/wp-content/plugins/jetpack
```

On Windows (Vista and later), open an Administrator Command Prompt window and use `mklink /D` similarly.

## Contributing

Thank you for considering contributing to Jetpack! If you have any questions or uncertainties, feel free to submit an issue or pull request on any topic. There are several ways you can contribute:

- Write and submit patches.
- If you find a bug, file a bug report [here](https://github.com/Automattic/jetpack/issues/new?assignees=&labels=%5BType%5D+Bug&template=bug-report.yml). For guidance on creating effective bug reports, see [our recommendations here](./docs/guides/report-bugs.md).
- Join our Jetpack Beta program to help us test new releases.
- Translate Jetpack into your language.

To ensure a positive and welcoming environment, Jetpack adheres to the code of conduct defined by the Contributor Covenant. You can read it in full [here](CODE-OF-CONDUCT.md).

## Security

To report a security vulnerability, please visit [https://automattic.com/security/](https://automattic.com/security/) or directly access our security bug bounty site at [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack is licensed under the GNU General Public License v2 (or later).

## Join Us!

Are you interested in working on awesome open-source code all day? [Join us](https://automattic.com/work-with-us/)!
