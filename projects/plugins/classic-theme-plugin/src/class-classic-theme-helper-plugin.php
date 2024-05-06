<?php
/**
 * Primary class file for the Classic Theme Helper plugin.
 *
 * @package automattic/classic-theme-plugin
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class Classic_Theme_Helper_Plugin
 */
class Classic_Theme_Helper_Plugin {

	/**
	 * Constructor.
	 */
	public function __construct() {
		// Init Jetpack packages
		add_action(
			'plugins_loaded',
			function () {
				$config = new Automattic\Jetpack\Config();
				// Connection package.
				$config->ensure(
					'connection',
					array(
						'slug'     => CLASSIC_THEME_PLUGIN_SLUG,
						'name'     => CLASSIC_THEME_PLUGIN_NAME,
						'url_info' => CLASSIC_THEME_PLUGIN_URI,
					)
				);
			},
			1
		);
	}
}
