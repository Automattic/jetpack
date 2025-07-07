<?php
/**
 * Plugin Name: Boost E2E Mock Connection
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Heart of Gold
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

add_filter(
	'jetpack_boost_connection_bypass',
	function () {
		return true;
	}
);
