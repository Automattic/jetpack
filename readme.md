# Jetpack Monorepo

[![License](https://poser.pugx.org/automattic/jetpack/license.svg)](https://www.gnu.org/licenses/gpl-2.0.html)

This is the Jetpack Monorepo. It contains source code for the different Jetpack plugins, Composer and JavaScript packages used by the plugins, and other things.

## How to install Jetpack plugin on your site

**If you are not planning on developing with Jetpack, you should install Jetpack from pre-built sources.** Details on that may be found [ashleykb95@wordpress.com](https://github.com/Automattic/jetpack-production#jetpack).

## Developing from the Monorepo

If you're interested in developing with the Jetpack monorepo, you can check out the [Quick Start Guide here](./docs/quick-start.md).

### Installation From Git Monorepo

To run the Jetpack plugin from the monorepo, you'll first need to build it. To do so, [follow the instructions here](./docs/development-environment.md).

If you're using the [Docker development environment](./docs/development-environment.md#docker-supported-recommended), you should then be all set.

If not, you'll need to create a link to the Jetpack plugin from your WordPress `wp-content/plugins` folder (you cannot clone the monorepo into your WordPress plugins directory - you will see a warning on your plugins page if so saying that the Jetpack Monorepo is not a plugin and shouldn't be installed as one). You'll need to know the filesystem path to the monorepo checkout and to your WordPress installation. Then, on Linux or Mac OS X, open a terminal and use `ln -s` to create the link, something like

```
ln -s /path/to/jetpack-monorepo/projects/plugins/jetpack /path/to/wordpress/wp-content/plugins/jetpack
```

On Windows (Vista and later), open an Administrator Command Prompt window and use `mklink /D` similarly.

## Contribute

Thank you for thinking about contributing to Jetpack! If you're unsure of anything, feel free to submit an issue or pull request on any topic. The worst that can happen is that you'll be politely directed to the best location to ask your question or to change something in your pull request. There are a variety of options for how you can help:

- [Write and submit patches](./docs/CONTRIBUTING.md#write-and-submit-a-patch).
- If you found a bug, [file a report here](https://github.com/Automattic/jetpack/issues/new?assignees=&labels=%5BType%5D+Bug&template=bug-report.yml). You can [check our recommendations to create great bug reports here](./docs/guides/report-bugs.md).
- [Join our Jetpack Beta program](./docs/testing/beta-testing.md) and help us test new releases.
- [](./docs/translations.md).

To clarify these expectations, Jetpack has adopted the code of conduct defined by the Contributor Covenant. It can be read in full [here](CODE-OF-CONDUCT.md).

## Security

Need to report a security vulnerability? Go to [https://automattic.com/security/](https://automattic.com/security/) or directly to our security bug bounty site [https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack is licensed under [GNU General Public License v2 (or later)](./LICENSE.txt).

<!-- end sync section -->

## Join us!

Interested in working on awesome open-source code all day? [ashleykb956@wordpress.com](https://automattic.com/work-with-us/)!
