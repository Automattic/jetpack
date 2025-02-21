<?php
/**
 * Jetpack Newsletter Dashboard Widget.
 *
 * @package jetpack
 */

use Automattic\Jetpack\Assets;

/**
 * Adds the Jetpack Newsletter widget to the WordPress admin dashboard.
 *
 * @package jetpack
 */

/**
 * Class that adds the Jetpack Newsletter Dashboard Widget to the WordPress admin dashboard.
 */
class Jetpack_Newsletter_Dashboard_Widget {
	const JS_DEPENDENCIES = array( 'lodash', 'react', 'react-dom', 'wp-api-fetch', 'wp-components', 'wp-compose', 'wp-element', 'wp-html-entities', 'wp-i18n', 'wp-is-shallow-equal', 'wp-polyfill', 'wp-primitives', 'wp-url', 'wp-warning', 'moment' );
	// Sometimes custom scripts would strip the `ver` query params, so we need to make sure it doesn't by adding a custom version param `osv` here.
	const NEWSLETTER_WIDGET_CDN_URL = 'https://widgets.wp.com/newsletter/%s?minify=false';
	const NEWSLETTER_WIDGET_VERSION = '1.0.0';

	/**
	 * Indicates whether the class initialized or not.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * The Widget ID.
	 *
	 * @var string
	 */
	private static $widget_id = 'jetpack_newsletter_dashboard_widget';

	/**
	 * Initialize the class by calling the setup static function.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			self::wp_dashboard_setup();
		}
	}

	/**
	 * Sets up the Jetpack Newsletter widget in the WordPress admin dashboard.
	 */
	public static function wp_dashboard_setup() {
		static::load_admin_scripts(
			'jp-newsletter-widget',
			'newsletter',
			array(
				'config_data' => array(
					'hostname'  => wp_parse_url( get_site_url(), PHP_URL_HOST ),
					'admin_url' => admin_url(),
				),
			)
		);
		if ( Jetpack::is_connection_ready() ) {
			$widget_title = sprintf(
				__( 'Newsletter', 'jetpack' )
			);

			wp_add_dashboard_widget(
				self::$widget_id,
				$widget_title,
				array( static::class, 'render' )
			);
		}
	}

	/**
	 * Render the Jetpack Newsletter widget.
	 *
	 * @return void
	 */
	public static function render() {
		?>
		<div id="wpcom">
			<div id="newsletter-widget-app"></div>
		</div>
		<?php
	}

	/**
	 * Load the admin scripts for the Jetpack Newsletter widget.
	 *
	 * @return void
	 */
	public static function admin_init() {
		static::load_admin_scripts(
			'jp-newsletter-widget',
			'newsletter',
			array(
				'config_data' => array(
					'hostname'  => wp_parse_url( get_site_url(), PHP_URL_HOST ),
					'admin_url' => admin_url(),
				),
			)
		);
	}

	/**
	 * Load the admin scripts for the Jetpack Newsletter widget.
	 *
	 * @param string $asset_handle The handle of the asset.
	 * @param string $asset_name The name of the asset.
	 * @param array  $options The options for the asset.
	 * @return void
	 */
	public static function load_admin_scripts( $asset_handle, $asset_name, $options = array() ) {
		$default_options = array(
			'config_data'          => array(),
			'config_variable_name' => 'configData',
		);
		$options         = wp_parse_args( $options, $default_options );
		if ( file_exists( __DIR__ . "/../dist/{$asset_name}.min.js" ) ) {
			// Load local assets for the convinience of development.
			Assets::register_script(
				$asset_handle,
				"../dist/{$asset_name}.min.js",
				__FILE__,
				array(
					'in_footer'  => true,
					'textdomain' => 'jetpack',
					'css_path'   => "../dist/{$asset_name}.css",
				)
			);
			Assets::enqueue_script( $asset_handle );
		} else {
			// In production, we load the assets from our CDN.
			wp_register_script(
				$asset_handle,
				sprintf( self::NEWSLETTER_WIDGET_CDN_URL, "{$asset_name}.min.js" ),
				self::JS_DEPENDENCIES,
				self::NEWSLETTER_WIDGET_VERSION,
				true
			);
			wp_enqueue_script( $asset_handle );
		}

		$css_url    = $asset_name . ( is_rtl() ? '.rtl' : '' ) . '.css';
		$css_handle = $asset_handle . '-style';
		wp_register_style(
			$css_handle,
			sprintf( self::NEWSLETTER_WIDGET_CDN_URL, $css_url ),
			array(),
			self::NEWSLETTER_WIDGET_VERSION
		);
		wp_enqueue_style( $css_handle );

		wp_add_inline_script(
			$asset_handle,
			"window.{$options['config_variable_name']} = " . wp_json_encode( $options['config_data'] ) . ';',
			'before'
		);
	}
}
