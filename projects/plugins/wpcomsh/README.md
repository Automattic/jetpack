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

## Installation (testing)

Clone this repository into `wp-content/mu-plugins` of your self-hosted Jetpack site. As the `mu-plugins` loader doesn't parse folders and only `.php` files, create a new file called `at-plugins-loader.php` with the following contents:

```php
<?php

require_once( WPMU_PLUGIN_DIR . '/at-pressable-themes/plugin.php' );
```

That's it! The plugin should be activated.

Now, test the things this plugin should be doing (described above).

## References and links

- 18-gh-Automattic/automated-transfer-api-contracts

