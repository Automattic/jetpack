# AT Pressable Themes

This plugin handles everything AT Pressable themes, from installing (symlinking) WPCom premium themes to disabling wp-admin/ Appearance -> Editor for third-party WPCom premium themes.

## Disabling Theme Editor

Business users are entitled for all the WPCom premium themes free of charge. After moving their sites to Pressable
 with AT, they can still select and use a WPCom premium theme. However, "due to our agreement with our third-party
 theme sellers on dotcom, we are allowed to host, but not distribute non-a8c premium themes." 
 ([link](http://wp.me/p58i-4kZ)).

This MU plugin disables theme editing (wp-admin -> Appearance -> Editor ) for such themes.

## Installation (testing)

Clone this repository into `wp-content/mu-plugins` of your self-hosted Jetpack site. As the `mu-plugins` loader doesn't parse folders and only `.php` files, create a new file called `at-plugins-loader.php` with the following contents:

```php
<?php

require_once( WPMU_PLUGIN_DIR . '/at-pressable-themes/plugin.php' );
```

That's it! The plugin should be activated.

## References and links

- 18-gh-Automattic/automated-transfer-api-contracts

