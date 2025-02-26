<?php
/**
 * Jetpack Newsletter Dashboard Widget.
 *
 * @package jetpack
 */

/**
 * Adds the Jetpack Newsletter widget to the WordPress admin dashboard.
 *
 * @package jetpack
 */

/**
 * Class that adds the Jetpack Newsletter Dashboard Widget to the WordPress admin dashboard.
 */
class Jetpack_Newsletter_Dashboard_Widget {
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
			'newsletter-widget',
			array(
				'config_variable_name' => 'jetpackNewsletterWidgetConfigData',
				'config_data'          => array(
					'hostname' => wp_parse_url( get_site_url(), PHP_URL_HOST ),
					'adminUrl' => admin_url(),
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
			'newsletter-widget',
			array(
				'config_variable_name' => 'jetpackNewsletterWidgetConfigData',
				'config_data'          => array(
					'hostname' => wp_parse_url( get_site_url(), PHP_URL_HOST ),
					'adminUrl' => admin_url(),
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
			'enqueue_css'          => true,
		);
		$options         = wp_parse_args( $options, $default_options );

		// Get the asset file path
		$asset_path = JETPACK__PLUGIN_DIR . '_inc/build/' . $asset_name . '.min.asset.php';

		// Get dependencies and version from asset file
		$dependencies = array();
		$version      = JETPACK__VERSION;

		if ( file_exists( $asset_path ) ) {
			$asset        = require $asset_path;
			$dependencies = $asset['dependencies'];
			$version      = $asset['version'];
		}

		// Register and enqueue the script
		wp_register_script(
			$asset_handle,
			plugins_url( '_inc/build/' . $asset_name . '.min.js', JETPACK__PLUGIN_FILE ),
			$dependencies,
			$version,
			true
		);
		wp_enqueue_script( $asset_handle );

		// Enqueue the CSS if enabled
		if ( $options['enqueue_css'] ) {
			wp_enqueue_style(
				$asset_handle,
				plugins_url( '_inc/build/' . $asset_name . '.css', JETPACK__PLUGIN_FILE ),
				array(),
				$version
			);

			// Enqueue RTL stylesheet if needed
			if ( is_rtl() ) {
				wp_enqueue_style(
					$asset_handle . '-rtl',
					plugins_url( '_inc/build/' . $asset_name . '.rtl.css', JETPACK__PLUGIN_FILE ),
					array( $asset_handle ),
					$version
				);
			}
		}

		// Add any configuration data if needed
		if ( ! empty( $options['config_data'] ) ) {
			wp_add_inline_script(
				$asset_handle,
				"window.{$options['config_variable_name']} = " . wp_json_encode( $options['config_data'] ) . ';',
				'before'
			);
		}
	}
}