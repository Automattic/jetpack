<?php
/**
 * Newsletter Widget Assets
 *
 * @package automattic/jetpack-newsletter-widget
 */

namespace Automattic\Jetpack\Newsletter_Widget;

use Automattic\Jetpack\Assets;

/**
 * Class Newsletter_Widget_Assets
 *
 * @package automattic/jetpack-newsletter-widget
 */
class Newsletter_Widget_Assets {
	// This is a fixed list @see https://github.com/Automattic/wp-calypso/pull/71442/
	const JS_DEPENDENCIES = array( 'lodash', 'react', 'react-dom', 'wp-api-fetch', 'wp-components', 'wp-compose', 'wp-element', 'wp-html-entities', 'wp-i18n', 'wp-is-shallow-equal', 'wp-polyfill', 'wp-primitives', 'wp-url', 'wp-warning', 'moment' );
	// Sometimes custom scripts would strip the `ver` query params, so we need to make sure it doesn't by adding a custom version param `osv` here.
	const NEWSLETTER_WIDGET_CDN_URL = 'https://widgets.wp.com/newsletter/%s?minify=false&osv=%s';

	/**
	 * We bump the asset version when the Jetpack back end is not compatible anymore.
	 */
	const NEWSLETTER_WIDGET_VERSION                = 'v1';
	const NEWSLETTER_WIDGET_CACHE_BUSTER_CACHE_KEY = 'newsletter_widget_asset_cache_buster';

	/**
	 * Load the admin scripts.
	 *
	 * @param string $asset_handle The handle of the asset.
	 * @param string $asset_name The name of the asset.
	 * @param array  $options The options.
	 */
	public function load_admin_scripts( $asset_handle, $asset_name, $options = array() ) {
		$default_options = array(
			'config_data'          => ( new Newsletter_Widget_Config_Data() )->get_data(),
			'config_variable_name' => 'configData',
			'enqueue_css'          => true,
		);
		$options         = wp_parse_args( $options, $default_options );
		if ( file_exists( __DIR__ . "/../dist/{$asset_name}.js" ) ) {
			// Load local assets for the convinience of development.
			Assets::register_script(
				$asset_handle,
				"../dist/{$asset_name}.js",
				__FILE__,
				array(
					'in_footer'  => true,
					'textdomain' => 'jetpack-newsletter-widget',
				)
			);
			Assets::enqueue_script( $asset_handle );
		} else {
			// In production, we load the assets from our CDN.
			wp_register_script(
				$asset_handle,
				sprintf( self::NEWSLETTER_WIDGET_CDN_URL, "{$asset_name}.js", self::NEWSLETTER_WIDGET_VERSION ),
				self::JS_DEPENDENCIES,
				self::NEWSLETTER_WIDGET_VERSION,
				true
			);
			wp_enqueue_script( $asset_handle );
		}

		wp_add_inline_script(
			$asset_handle,
			( new Newsletter_Widget_Config_Data() )->get_js_config_data( $options['config_variable_name'], $options['config_data'] ),
			'before'
		);
	}
}
