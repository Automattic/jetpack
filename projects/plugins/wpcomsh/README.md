# AT Pressable Themes

This plugin handles everything AT Pressable themes, from installing (symlinking) WPCom premium themes to disabling wp-admin/ Appearance -> Editor for third-party WPCom premium themes.

## Installing/deleting WPCom themes (both pub (free) and premium)

This plugin manages the installation/deletion of WPCom themes by hooking into the Jetpack theme installation/deletion endpoints and symlinking/unsymlinking the particular theme.

## Disabling Theme Editor

Business users are entitled for all the WPCom premium themes free of charge. After moving their sites to Pressable
 with AT, they can still select and use a WPCom premium theme. However, "due to our agreement with our third-party
 theme sellers on dotcom, we are allowed to host, but not distribute non-a8c premium themes." 
 ([link](http://wp.me/p58i-4kZ)).

This MU plugin disables theme editing (wp-admin -> Appearance -> Editor ) for such themes.

![selection_237](https://cloud.githubusercontent.com/assets/4988512/20633850/19a79450-b34b-11e6-9cd8-337ce120cc8a.png)

## Remove the WPCom theme "Delete" button

This plugin removes the "Delete" button of all the WPCom themes (both pub and premium) as these themes require special mechanism for deletion. They can be deleted only through Calypso.

![selection_236](https://cloud.githubusercontent.com/assets/4988512/20633839/0595383c-b34b-11e6-9d13-135e0d751bae.png)

## Installation and testing instructions

### Requirements

1. Self-hosted WordPress site with the Jetpack plugin connected to your WP.com account;
2. The Jetpack plugin needs to be checked out from the Jetpack git repo and be on the `add/theme-install-hooks` branch (until it gets merged to `master`). [The PR link is here](https://github.com/Automattic/jetpack/pull/5704);
2. WPCom pub and premium themes (not needed for our testing, though)

### Installation

Clone this repository into `wp-content/mu-plugins` of your self-hosted Jetpack site. As the `mu-plugins` loader doesn't parse folders and only `.php` files, create a new file called `at-plugins-loader.php` with the following contents:

```php
<?php

require_once( WPMU_PLUGIN_DIR . '/at-pressable-themes/plugin.php' );
```

Now, make two folders named `wpcom-premium-themes` and `wpcom-pub-themes` somewhere on your filesystem (e.g. `/home/<your-user-name>/`) and put two different themes into these folders (e.g. put twentyfifteen to the premium themes folder and twentyfourteen to the pub themes folder) so you know which theme is where.

Rename the directory names of the two themes so they have the `-wpcom` suffix (e.g. `twentyfifteen-wpcom`). `-wpcom` suffix indicates that the theme is a WPCom one.

Open the `constants.php` file located in the main folder of this plugin and edit the `WPCOM_PUB_THEMES_PATH` and `WPCOM_PREMIUM_THEMES_PATH` to point to your newly created directories.

At this moment, the plugin is ready for testing.

### Testing WPCom theme installation

#### Theme installation

1. Open the [WPCom API Dev Console](https://developer.wordpress.com/docs/api/console/);
2. Make a `POST` request to the following endpoint on your self-hosted connected site: `/sites/<your-site>/themes/<your-wpcom-pub-theme>/install` (e.g. `/sites/lamosty.wpsandbox.me/themes/edin-wpcom/install`);
3. The theme should be installed (symlinked) and the endpoint should return info about the newly installed theme;
4. Repeat the 2. point but change the theme slug to your WPCom premium theme slug;
5. Repeat the 3. point;

#### Theme deletion

1. Open the [WPCom API Dev Console](https://developer.wordpress.com/docs/api/console/);
2. Make a `POST` request to the following endpoint on your self-hosted connected site: `/sites/<your-site>/themes/<your-wpcom-pub-theme>/delete` (e.g. `/sites/lamosty.wpsandbox.me/themes/edin-wpcom/delete`);
3. The theme should be deleted (unsymlinked) and the endpoint should return info about the deleted theme;
4. Repeat the 2. point but change the theme slug to your WPCom premium theme slug;
5. Repeat the 3. point.

After making any request to the self-hosted site, check the theme origin (source) folder, whether it is intact, whether no files have been deleted from it (in case of the delete endpoint). Also, check whether the theme was symlinked correctly by going to the `wp-content/themes` directory and writing the `ls -la` command.

### Testing removal of the "Delete" button on WPCom themes

1. Install any of the WPCom themes through the install endpoint;
2. Navigate to `https://<your-testing-site>/wp-admin/themes.php`;
3. Open the installed WPCom theme and verify that the "Delete" button is not present in the bottom right-hand corner of your screen.

### Testing disabling themes editor if the active theme is a third-party WPCom premium one

1. Install any of the premium WPCom themes through the install endpoint;
2. Activate the installed WPCom theme;
3. Make sure that the theme's Author is not Automattic (in the theme's `style.css` file)
4. Navigate to `https://<your-testing-site>/wp-admin/themes.php` and verify that the "Editor" menu item is missing from the "Appearance" menu list;
5. Navigate to `https://<your-testing-site>/wp-admin/theme-editor.php` and verify that you are presented with an error that "you are not allowed to view this page";
6. Edit the theme's Author (in the theme's `style.css` file) to `Automattic`;
7. Verify that you can navigate to the theme Editor (it is allowed to view the source code of WPCom premium themes made by Automattic);

The WPCom themes will be read-only on the filesystem. If a theme is read-only, the theme Editor doesn't show the "Save" button so the theme's source code can be viewed only. You can verify this by giving your WPCom theme read-execute permissions with this command (`chmod -R 555 <your-wpcom-theme-dir>`) and then navigating to the theme's Editor.

If you have any questions regarding the testing/installation instructions, don't hesitate to contact me directly on Slack: @lamosty.

## References and links

- 18-gh-Automattic/automated-transfer-api-contracts

