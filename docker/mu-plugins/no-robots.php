<?php

/*
Plugin Name: No robots
Description: Adds "noindex,follow" meta tag to all the pages even when the site is marked public.
Version: 1.0
Author: Automattic
Author URI: http://automattic.com/
*/

// https://github.com/WordPress/WordPress/blob/31a4369366d6b8ce30045d4c838de2412c77850d/wp-includes/general-template.php#L2833-L2865
add_action( 'wp_head', 'wp_no_robots' );
