<?php
/**
 * Plugin Name: Jetpack E2E direct filesystem method plugin
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Jetpack Team
 * Version: 1.0.0
 * Text Domain: jetpack
 *
 * @package automattic/jetpack
 */

add_filter(
	'filesystem_method',
	function () {
		return 'direct';
	}
);
