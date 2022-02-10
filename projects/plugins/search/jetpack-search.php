<?php
/**
 *
 * Plugin Name: Jetpack Search
 * Plugin URI: https://jetpack.com/search/
 * Description: A cloud-powered replacement for WordPress' search.
 * Version: 0.1.0-alpha
 * Author: Automattic
 * Author URI: https://jetpack.com/
 * License: GPLv2 or later
 * Text Domain: jetpack-search
 *
 * @package automattic/jetpack-search
 */

define( 'JETPACK_SEARCH_PLUGIN__VERSION', '0.1.0-alpha' );
define( 'JETPACK_SEARCH_PLUGIN__DIR', __DIR__ . '/' );
define( 'JETPACK_SEARCH_PLUGIN__SLUG', 'search-plugin' );

Automattic\Jetpack\Search\Search_Plugin_Initializer::initialize();
