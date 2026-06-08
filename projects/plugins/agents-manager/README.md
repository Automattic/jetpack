# Jetpack Agents Manager

A standalone WordPress plugin that loads the
[`automattic/jetpack-agents-manager`](https://github.com/Automattic/jetpack/tree/trunk/projects/packages/agents-manager)
Composer package and initializes it via `Agents_Manager::init()`.

The Agents Manager feature was extracted from `jetpack-mu-wpcom` into a shared
package in [#49202](https://github.com/Automattic/jetpack/pull/49202). This
plugin is a thin wrapper that lets the package be installed, run, and tested on
its own — primarily as a development/testing scaffold.

## Requirements

This plugin relies on the [Jetpack](https://jetpack.com/) plugin being **active
and connected** to a WordPress.com account. When that is not the case, the
plugin surfaces an admin notice and the connected Agents Manager features remain
unavailable.

## Installation from the Git repo

This plugin lives in the [Jetpack monorepo](https://github.com/Automattic/jetpack).
After cloning the monorepo, build the plugin's dependencies:

```sh
cd projects/plugins/agents-manager
composer install
```

This generates the Jetpack autoloader (`vendor/autoload_packages.php`) and the
`jetpack_vendor/` tree the plugin loads at runtime. See the
[development environment docs](https://github.com/Automattic/jetpack/blob/trunk/docs/development-environment.md)
for the full monorepo setup.

Then symlink or copy the `projects/plugins/agents-manager` directory into your
site's `wp-content/plugins/` and activate it from **Plugins** in wp-admin.

## Security

Need to report a security vulnerability? Go to
[https://automattic.com/security/](https://automattic.com/security/) or directly
to our security bug bounty site
[https://hackerone.com/automattic](https://hackerone.com/automattic).

## License

Jetpack Agents Manager is licensed under
[GNU General Public License v2 (or later)](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html).
