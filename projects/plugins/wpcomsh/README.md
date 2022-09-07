# WordPress.com Site Helper

![PHP Lint](https://github.com/Automattic/wpcomsh/actions/workflows/linting.yml/badge.svg) ![CircleCI](https://circleci.com/gh/Automattic/wpcomsh.svg?style=shield&circle-token=37baa9fa1a0fa74ad04f30ce58084d2d353a1342)

With the help of this mu-plugin, an Atomic site is transformed into a WP.com site. It lives in `wp-content/mu-plugins/wpcomsh` and is loaded with `wp-content/mu-plugins/wpcomsh-loader.php`.

## Development

### Quick Start

```
# From the root of a wp.org install
$ mkdir -p wp-content/mu-plugins
$ cd wp-content/mu-plugins
$ git clone git@github.com:Automattic/wpcomsh.git
$ cd wpcomsh
$ git submodule update --init --recursive # installs the submodules
$ composer install # installs the composer dependencies
$ cd ..
$ ln -s wpcomsh/wpcomsh-loader.php ./ # or copy the loader to mu-plugins

# define 'IS_ATOMIC', 'ATOMIC_SITE_ID' and 'ATOMIC_CLIENT_ID' as true so the loader will require wpcomsh

define( 'IS_ATOMIC', true );
define( 'ATOMIC_SITE_ID', true );
define( 'ATOMIC_CLIENT_ID', true );
```

To work on wpcomsh, you need a WP.org site and ideally the Jetpack plugin installed and connected to WP.com.
You will also need to install [Composer](https://getcomposer.org/)

1. Clone the [wpcomsh git repo](https://github.com/Automattic/wpcomsh/) into `wp-content/mu-plugins` of that site.
2. Then, either copy or symlink the `wp-content/mu-plugins/wpcomsh/wpcomsh-loader.php` file to `wp-content/mu-plugins`.
   It acts as a "loader" for wpcomsh and we need this because plugin folders put into `mu-plugins` are not automatically loaded like plugins in `wp-content/plugins`.
3. Run `git submodule update --init --recursive` to clone and initialize the submodules (you'll need to run this again to pull in later updates to the submodules).
4. From the project root run `composer install` to install composer based dependencies.

Note: if you decide to download the zip of wpcomsh from the GitHub repo, it won't work as that zip doesn't contain all the git submodules which wpcomsh depends on.

If you want to add some new code to wpcomsh, create a new git branch, push to it and then create a Pull Request (PR) against the `master` branch on [wpcomsh GitHub](https://github.com/Automattic/wpcomsh/). Make sure to test thoroughly on a WoA dev blog and send the PR to your team for review.

When working on wpcomsh, follow the [WP.org coding standards](https://codex.wordpress.org/WordPress_Coding_Standards) and make sure to add enough logging (either by returning `WP_Error` and/or by using `error_log`) where needed.

## Testing

There are two stages of manually testing wpcomsh:

The first one is to set up a WP.org site and test on it (more instructions in the [Development section](#development)).
However, it's the best if you also install the Jetpack plugin and connect it to WP.com on the WP.org site as that's how AT sites communicate with WP.com -- many things can be tested only with connected Jetpack. We recommend either using your .wpsandbox.me site (PCYsg-5Q0-p2) or use [Vagrant](https://github.com/Varying-Vagrant-Vagrants/VVV) to set up the WP.org site locally on your machine and share it with world (so WP.com can connect to it).

Note: if you use your `.wpsandbox.me` for testing wpcomsh, use ssh key forwarding so you have all your local ssh keys on the wpsandbox and can clone the wpcomsh GitHub repo. Either run ssh as `ssh -A` or add `ForwardAgent yes` into your `.ssh/config` file. p1490809471078673-slack-C2PDURDSL.

### Automated Testing

#### Unit Testing

`wpcomsh` runs `phpunit` on CircleCI for every PR.

Please try to add unit tests whenever you are adding new features, or modifying existing ones.

#### Private Site Module

There is an integration suite built on docker that makes testing what clients to "private" (and non-private) sites should and shouldn't be able to see.

If you have `docker` installed on your system, the tests can be run like so:

- `make test-public-access`
- `make test-private-access`

Each of the above:

- Cleans your build directory, etc.
- Builds the plugin from source (as would happen for the regular deployment process )
- Spins up containers for:
  - mysql database
  - WordPress (php-fpm)
  - nginx web server
  - WP-CLI
  - node / jest (for the actual testing)
- Coordinates communication and set up for the above
- Sets a site to be public or private according to the script invocation
- Kicks off test specs to validate that appropriate resources are accessible and, in the case of a site being set to private, inappropriate resources are not

#### Development Mode

You can enter "development mode" by declaring you are doing so via the `WPCOMSH_DEVMODE` environment variable.

For example:

`WPCOMSH_DEVMODE=1 make test-private-access`

This will:

- Instruct `make` to bypass the `check` directive (allowing for rules like `build` to run without a clean working directory)
- Set jest to "watch" for changes to the spec files inside the running container.
- Watch for changes to specific files on your local machine and copy them to the container on changes.
- Leave the services running (until you exit with `cmd+c`, etc.), so you can access the running WordPress site to do manual testing (see below)

In order for WordPress to load the test site correctly, you'll need to access the site with the appropriate site name:

- Add the following to your hosts file: `127.0.0.1 nginx`
- Browse to http://nginx:8989 in your favorite web client / browser

## Deployment

### Dependencies

- The deployment tooling requires [GitHub Hub](https://github.com/github/hub) - `brew install hub`

### Deployment instructions

- Make sure there are no uncommitted changes
- Run `bin/update-version.sh` and provide the new version. This will update the versions in `package.json`, `package-lock.json`, and `wpcomsh.php`. Make sure there are no other changes. Commit these changes and create a PR.
- Once your PR has been reviewed and approved, “Squash and merge” your PR.
- Now checkout the latest master branch with `git checkout master` and `git pull`.
- Tag the release with the command `make tag`.
- Run the git push command suggested by make tag.
- Run `bin/create-github-release.sh` to build a new release zip and create a GitHub release. This reads the version number to use for the build from `wpcomsh.php`, which is set in the first step.
  - Note: This command may ask for a GitHub password. Use a [Personal Access Token](https://github.com/settings/tokens/) (with at least repo scope) instead. If your previous token has expired, update it locally in `~/.config/hub`.
- You can view your [successful release here](https://github.com/Automattic/wpcomsh/releases).
- New versions are deployed when our monitoring detects its release.
  - Note: You can monitor [#atomic](https://a8c.slack.com/archives/C7YPW6K40) channel to see when the new version is deployed.

### Deploying new languages (optional, and mostly Atomic team)

After every deployment, as described above, please create a new
branch and run:

- `make i18n` to update translatable strings and translations and create a new PR
- Follow Deployment instructions

## Troubleshooting

When something doesn't work as it should, the first thing to do is [enable error logging in WP](https://codex.wordpress.org/Debugging_in_WordPress) or look into the global PHP error log. It's advisable to install and connect Jetpack when working on wpcomsh. Use [MGS](https://mc.a8c.com/mgs/) to search through Slack channels as that's where most of the development work/chats take place. You can also use PCYsg-5mr-p2 (for example, with PhPStorm). If you still can't figure out the problem, drop a message in the Automated Transfer Slack channel and/or ping [wpcomsh devs](https://github.com/Automattic/wpcomsh/graphs/contributors) directly.

## Features

If you add a feature to wpcomsh, please add it to the following list:

### WP.com Footer Credit

- Replaces any footer credit in our themes with "POWERED BY WORDPRESS.COM."
- Allows for customization of that message

### WP.com Block Theme Footer Credit

- Footer credits that work on block based themes.

### Removal of VaultPress wp-admin notices

Removal of activation notice, connection notice and error notices. Users should not have to manage VaultPress, report its issues, etc -- that’s why we are hiding those notices.

### Hiding plugins links on wp-admin/plugins page

We don’t allow users to deactivate and edit Akismet, Jetpack, VaultPress so that’s why we hide these links.

We also hide the bulk plugins deactivation on the wp-admin/plugins page for all the plugins as it was not easily possible to do it only for the aforementioned plugins.

### Hiding the Jetpack version number on wp-admin/plugins page

That version is managed by the Atomic platform, so does not need to be displayed to site owners. They always run the latest version, which may be a version that is not yet released in the WordPress.org directory.

### Hiding the Jetpack page "My Jetpack"

This page is mostly about upselling and cross-discovery of Jetpack feature plugins. Not needed on Atomic sites.

### Showing that a plugin is auto-managed

We show a similar message to the update one under Akismet, Jetpack and VaultPress telling users that those plugins are auto-managed for them (an explanation why they can’t deactivate or edit them).

### Denoting Plugins to enable WP.com features

Plugins that bridge the gap between WP.com and Atomic, enabling WP.com-only features that are part of users' plans, receive a green banner with that information.
This allows users to make an informed decision when enabling/disabling these plugins.

### Symlinking WP.com pub (free) and premium themes

We keep the WP.com pub and premium themes checked out on Atomic. When users try to install WP.com themes from within Calypso (not possible from wp-admin), wpcomsh hooks into Jetpack themes API and symlinks the WP.com themes from the directory where we keep them on Atomic to user’s `wp-content/themes` folder.

When a user tries to delete a WP.com theme (only available from Calypso), wpcomsh hooks into Jetpack themes API and unsymlinks the WP.com theme.

If a WP.com theme is a child theme of another WP.com theme, wpcomsh symlinks both the parent and the child themes. Analogously, if users try to delete a child WP.com theme, wpcomsh unsymlinks both the child and the parent themes. However, if only the parent theme is removed/unsymlinked, wpcomsh doesn’t unsymlink the child theme, making it potentially broken (as the parent theme is removed).

### Removal of the “delete” button from WP.com themes in wp-admin

### Removal of Theme Editor access from 3-rd party WP.com premium themes in wp-admin

If a user installs a premium WP.com theme created by a third-party shop (ie not Automattic), we remove access to the Theme Editor as we are prohibited to share the source code of this kind of themes. Both access to wp-admin/theme-editor.php page and the “Editor” link under wp-admin -> Appearance are removed.

### Disabling ability to manage plugins/themes after canceling the Business plan subscription

When a user cancels their Business plan in Calypso, an async job called `at_business_plan_cancellation_flow` is run. This job does various things, such as deactivating all the plugins except Akismet, Jetpack and VaultPress on the transferred site, switching to a WP.com pub theme (which was previously installed on the site) and setting the option `plan_slug` to `free` on the transferred site (options related to Automated Transfer are stored under `at_options` array).

Setting `plan_slug` to `free`, in turn, adds the `do_not_allow` capability to the list of required capabilities for the following capabilities (for all users -- globally):

- `activate_plugins`
- `install_plugins`
- `edit_plugins`
- `delete_plugins`
- `upload_plugins`
- `update_plugins`
- `switch_themes`
- `install_themes`
- `update_themes`
- `delete_themes`
- `upload_themes`
- `edit_themes`

### Points attachment URLs to WP.com

TODO: needs Jennifer’s clarification.

After transferring a site from WP.com to Atomic, the media files (such as images) are not immediately moved there and stay on WP.com servers. That’s why we need to point the attachment URLs to WP.com temporarily. A job to move media files is queued shortly after the transfer process finishes.

### Bypassing Jetpack Single Sign On login form

By default, transferred sites have the Jetpack Single Sing On enabled as it’s the only way for WP.com users to log into the site’s wp-admin. However, we want it to be seamless (like on WP.com) without users having to click on the “Log in with WP.com account” button.

That’s why we bypass this login form with wpcomsh entirely and log the user automatically to wp-admin (or redirect to WP.com if the user is not logged in to WP.com).

### Theme_uri of a WP.com theme always wordpress.com

To distinguish between WP.com themes installed by symlinking and themes uploaded manually, the `theme_uri` of the WP.com symlinked themes is always `wordpress.com` (for example, in Jetpack themes API response).

### Add assets/admin-style.css

All the wp-admin custom styles for transferred sites are in `assets/admin-style.css`. If you need to add some more, please add them to that file.

### Checks for Full Site Editing Site Eligibility

If a site has the `a8c-fse-is-eligible` site option, the site is eligible for Full-Site Editing flows. Flows are only active when a supported theme is active.

### Updates Customizer Save/Publish Labels to be consistent with WordPress.com

Because WordPress.com supports private sites by default, customizer label copy was updated to reduce confusion on what would launch a site or what will save changes on a site.

### Custom colors and fonts (+ Typekit fonts)

On WP.com, we provide custom colors and fonts in a site's Customizer. In order to get them supported on an AT site, wpcomsh imports the `colors`, `custom-fonts` and `custom-fonts-typekit` codebases.

### Media Library used space

Shows space used (e.g. `250MB of 100GB`) in Media library.

### Logging

WPCOMSH provides a hook to log arbitrary information in our Kibana instance.
You cannot use these function by itself, you need to call a proper hook like so:

```php
do_action( 'wpcomsh_log', "test" );
```

You will see the output here:
78d11cc3116d62c53c50ae95c04d265b-logstash

But, logging needs to be turned on via `at_options_logging_on`. You can do that via `/option` endpoint. More tools coming.

### WP CLI Commands

wpcomsh includes [WP CLI](http://wp-cli.org/) commands. They are located in the `./class-wpcomsh-cli-commands.php` file.

- `wp wpcomsh deactivate-user-plugins`: Bulk deactivate user installed plugins. Supports an `--interactive` mode that asks for each plugin.
- `wp wpcomsh reactivate-user-plugins`: Bulk re-activate user installed plugins. Supports an `--interactive` mode that asks for each plugin.
- `wp launch-site`: An easter egg added for WPCOM SSH launch.

To learn more about writing WP CLI commands consult the [Commands Cookbook](https://make.wordpress.org/cli/handbook/commands-cookbook/).

### Store support

wpcomsh adds the [wc-api-dev](https://github.com/woocommerce/wc-api-dev) plugin to support Store on WordPress.com

### Private Site support

Enables setting a site to "private." Doing so prevents viewing or interacting with site content to unauthenticated clients (and anyone without `read` capabilities).

As this module is currently being developed & evaluated, it is only enabled when the `AT_PRIVACY_MODEL` constant is set is set to `wp_uploads` (such that `\Private_Site\is_module_active()` returns `true`).

### Experimental Jetpack Blocks

Enables the "experimental" block bundle [offered in Jetpack](https://github.com/Automattic/jetpack/pull/14104), instead of the default Production bundle.

Those blocks are considered ready for production, but we don't want to serve to all Jetpack sites yet. When you use this bundle, you'll get all production blocks as well as experimental blocks.

### SEO Description Block

Enables the SEO Description Block that is currently only available for WordPress.com sites.

### Navigation Sidebar in the Block Editor

The navigation sidebar in the [WordPress.com Editing Toolkit](https://wordpress.org/plugins/full-site-editing/) is enabled using a filter. The site helper adds the filter and may use WordPress.com and Automattic specific logic to decide whether to enable it.

### Coming Soon

Coming Soon mode and associated functionality is contained within the [WordPress.com Editing Toolkit](https://wordpress.org/plugins/full-site-editing/) and is enabled using a filter. Coming Soon allows users to hide their site behind a Coming Soon page from the site settings page of Calypso.

### Nav Unification

Provides a series of customisations to enable the full Nav Unification experience on Atomic (see pbAPfg-Ou-p2). Includes:

- force enable Masterbar module.
- hide admin color scheme picker and add notice pointing to WordPress.com Account Settings.
- persist important WP.com user data to user_option via Jetpack connected user data.
- activate the Nav Unification feature shipped in Jetpack on Atomic.
- add a WooCommerce install item to the menu when Woo isn't installed.
- force disable Nav Unification feature via query string.
