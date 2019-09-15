# WordPress.com Site Helper

With the help of this mu-plugin, a Pressable site is transformed into a WP.com site. It lives in `wp-content/mu-plugins/wpcomsh` and is loaded with `wp-content/mu-plugins/wpcomsh-loader.php`.

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

# define 'IS_PRESSABLE' (v1) or 'IS_ATOMIC' (v2) as true so the loader will require wpcomsh
```

To work on wpcomsh, you need a WP.org site and ideally the Jetpack plugin installed and connected to WP.com.
You will also need to install [Composer](https://getcomposer.org/)

1. Clone the [wpcomsh git repo](https://github.com/Automattic/wpcomsh/) into `wp-content/mu-plugins` of that site.
2. Then, either copy or symlink the `wp-content/mu-plugins/wpcomsh/wpcomsh-loader.php` file to `wp-content/mu-plugins`.
It acts as a "loader" for wpcomsh and we need this because plugin folders put into `mu-plugins` are not automatically loaded like plugins in `wp-content/plugins`.
3. Run `git submodule update --init --recursive` to clone and initialize the submodules (you'll need to run this again to pull in later updates to the submodules).
4. From the project root run `composer install` to install composer based dependencies.

Note: if you decide to download the zip of wpcomsh from the GitHub repo, it won't work as that zip doesn't contain all the git submodules which wpcomsh depends on.

If you want to add some new code to wpcomsh, create a new git branch, push to it and then create a Pull Request (PR) against the `master` branch on [wpcomsh GitHub](https://github.com/Automattic/wpcomsh/). After that, send the link to that PR to the Automated Transfer Slack channels for review.

When working on wpcomsh, follow the [WP.org coding standards](https://codex.wordpress.org/WordPress_Coding_Standards) and make sure to add enough logging (either by returning `WP_Error` and/or by using `error_log`) where needed.

## Testing

There are two stages of testing wpcomsh:

The first one is to set up a WP.org site and test on it (more instructions in the [Development section](#development)).
However, it's the best if you also install the Jetpack plugin and connect it to WP.com on the WP.org site as that's how AT sites communicate with WP.com -- many things can be tested only with connected Jetpack. We recommend either using your .wpsandbox.me site (PCYsg-5Q0-p2) or use [Vagrant](https://github.com/Varying-Vagrant-Vagrants/VVV) to set up the WP.org site locally on your machine and share it with world (so WP.com can connect to it).

Note: if you use your `.wpsandbox.me` for testing wpcomsh, use ssh key forwarding so you have all your local ssh keys on the wpsandbox and can clone the wpcomsh GitHub repo. Either run ssh as `ssh -A` or add `ForwardAgent yes` into your `.ssh/config` file. p1490809471078673-slack-C2PDURDSL.

## Deployment

- Update the version number [here](https://github.com/Automattic/wpcomsh/blob/master/wpcomsh.php#L5) and [here](https://github.com/Automattic/wpcomsh/blob/master/wpcomsh.php#L11)
- Add a new tag with the new version e.g. `git tag v1.0.0 && git push origin v1.0.0`
- Build a new release locally with `make build`. The build will be `./build/wpcomsh-{vesion}.zip`
- Create a new release and add the build as an asset. Note the build asset in this [example](https://github.com/Automattic/wpcomsh/releases/tag/v2.3.50)
- Make a systems request to have the lastest version deployed pMz3w-9lN-p2

## Troubleshooting

When something doesn't work as it should, the first thing to do is [enable error logging in WP](https://codex.wordpress.org/Debugging_in_WordPress) or look into the global PHP error log. It's advisable to install and connect Jetpack when working on wpcomsh. Use [MGS](https://mc.a8c.com/mgs/) to search through Slack channels as that's where most of the development work/chats take place. You can also use PCYsg-5mr-p2 (for example, with PhPStorm). If you still can't figure out the problem, drop a message in the Automated Transfer Slack channel and/or ping [wpcomsh devs](https://github.com/Automattic/wpcomsh/graphs/contributors) directly.

## Features

If you add a feature to wpcomsh, please add it to the following list:

### WP.com Footer Credit

- Replaces any footer credit in our themes with "POWERED BY WORDPRESS.COM."
- Allows for customization of that message

### Removal of VaultPress wp-admin notices

Removal of activation notice, connection notice and error notices. Users should not have to manage VaultPress, report its issues, etc -- that’s why we are hiding those notices.

### Hiding plugins links on wp-admin/plugins page

We don’t allow users to deactivate and edit Akismet, Jetpack, VaultPress so that’s why we hide these links.

We also hide the bulk plugins deactivation on the wp-admin/plugins page for all the plugins as it was not easily possible to do it only for the aforementioned plugins.

### Showing that a plugin is auto-managed

We show a similar message to the update one under Akismet, Jetpack and VaultPress telling users that those plugins are auto-managed for them (an explanation why they can’t deactivate or edit them).

### Denoting Plugins to enable WP.com features

Plugins that bridge the gap between WP.com and Atomic, enabling WP.com-only features that are part of users' plans, receive a green banner with that information.
This allows users to make an informed decision when enabling/disabling these plugins. 

### Symlinking WP.com pub (free) and premium themes

We keep the WP.com pub and premium themes checked out on Pressable. When users try to install WP.com themes from within Calypso (not possible from wp-admin), wpcomsh hooks into  Jetpack themes API and symlinks the WP.com themes from the directory where we keep them on Pressable to user’s `wp-admin/themes` folder.

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

### Removal of Pressable wp-admin Dashboard widget

Pressable adds a custom widget to wp-admin’s Dashboard. However, as AT users are still WP.com ones, we need to hide any mention of Pressable from them so wpcomsh removes this custom widget from wp-admin’s Dashboard.
### Points attachment URLs to WP.com

TODO: needs Jennifer’s clarification.

After transferring a site from WP.com to Pressable, the media files (such as images) are not immediately moved there and stay on WP.com servers. That’s why we need to point the attachment URLs to WP.com temporarily. A job to move media files is queued shortly after the transfer process finishes.

### Bypassing Jetpack Single Sign On login form

By default, transferred sites have the Jetpack Single Sing On enabled as it’s the only way for WP.com users to log into the site’s wp-admin. However, we want it to be seamless (like on WP.com) without users having to click on the “Log in with WP.com account” button.

That’s why we bypass this login form with wpcomsh entirely and log the user automatically to wp-admin (or redirect to WP.com if the user is not logged in to WP.com).

### Theme_uri of a WP.com theme always wordpress.com

To distinguish between WP.com themes installed by symlinking and themes uploaded manually, the `theme_uri` of the WP.com symlinked themes is always `wordpress.com` (for example, in Jetpack themes API response).

### Add assets/admin-style.css

All the wp-admin custom styles for transferred sites are in `assets/admin-style.css`. If you need to add some more, please add them to that file.

### Checks for Full Site Editing Site Eligibility

If a site has the `a8c-fse-is-eligible` site option, the site is eligible for Full-Site Editing flows. Flows are only active when a supported theme is active.

### Custom colors and fonts (+ Typekit fonts)

On WP.com, we provide custom colors and fonts in a site's Customizer. In order to get them supported on an AT site, wpcomsh imports the `colors`, `custom-fonts` and `custom-fonts-typekit` codebases.

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

wpcomsh includes [WP CLI](http://wp-cli.org/) commands. They are located in the `./class.cli-commands.php`.

- `wp wpcomsh deactivate-user-plugins`: Bulk deactivate user installed plugins. Supports an `--interactive` mode that asks for each plugin.
- `wp wpcomsh reactivate-user-plugins`: Bulk re-activate user installed plugins. Supports an `--interactive` mode that asks for each plugin.

To learn more about writing WP CLI commands consult the [Commands Cookbook](https://make.wordpress.org/cli/handbook/commands-cookbook/).


### Store support

wpcomsh adds the [wc-api-dev](https://github.com/woocommerce/wc-api-dev) plugin to support Store on WordPress.com
