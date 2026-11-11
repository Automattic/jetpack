<?php
/**
 * Plugin Name: Jetpack E2E Admin Shell
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * Turns on the admin shell flag for the admin shell suite. Only that suite activates it.
 *
 * @package automattic/jetpack
 */

add_filter( 'jetpack_feature_flag_enabled_jetpack-admin-shell', '__return_true' );
