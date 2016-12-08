<?php

/**
 * You also need to define two more constants in the `private-constants.php` file.
 * These constants will point to WPCom pub (free) and premium themes.
 * Example of `private-constants.php` file:
 *
 * define( 'JETPRESS_WPCOM_PUB_THEMES_PATH', '/srv/www/wpcom-pub-themes' );
 * define( 'JETPRESS_WPCOM_PREMIUM_THEMES_PATH', '/srv/www/wpcom-premium-themes' );
 *
 */
require_once( 'private-constants.php' );

define( 'JETPRESS_WPCOM_PUB_THEME_TYPE', 'wpcom_pub_theme_type' );
define( 'JETPRESS_WPCOM_PREMIUM_THEME_TYPE', 'wpcom_premium_theme_type' );
define( 'JETPRESS_NON_WPCOM_THEME', 'non_wpcom_theme' );
