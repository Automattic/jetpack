<?php
/**
 * Jetpack Newsletter Dashboard Widget.
 *
 * @package jetpack
 */

use Automattic\Jetpack\Connection\Client;

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
	 * Get the config data for the Jetpack Newsletter widget.
	 *
	 * @return array
	 */
	public static function get_config_data() {
		$subscriber_counts = array();
		$config_data       = array();

		if ( Jetpack::is_connection_ready() ) {
			$site_id  = Jetpack_Options::get_option( 'id' );
			$api_path = sprintf( '/sites/%d/subscribers/stats', $site_id );
			$response = Client::wpcom_json_api_request_as_blog(
				$api_path,
				'2',
				array(),
				null,
				'wpcom'
			);

			if ( 200 === wp_remote_retrieve_response_code( $response ) ) {
				$subscriber_counts = json_decode( wp_remote_retrieve_body( $response ), true );
				if ( isset( $subscriber_counts['counts']['email_subscribers'] ) ) {
					$config_data['emailSubscribers'] = (int) $subscriber_counts['counts']['email_subscribers'];
				}

				if ( isset( $subscriber_counts['counts']['paid_subscribers'] ) ) {
					$config_data['paidSubscribers'] = (int) $subscriber_counts['counts']['paid_subscribers'];
				}

				if ( isset( $subscriber_counts['counts']['all_subscribers'] ) ) {
					$config_data['allSubscribers'] = (int) $subscriber_counts['counts']['all_subscribers'];
				}

				if ( isset( $subscriber_counts['aggregate'] ) ) {
					$config_data['subscriberTotalsByDate'] = $subscriber_counts['aggregate'];
				}
			}
		}

		return $config_data;
	}

	/**
	 * Sets up the Jetpack Newsletter widget in the WordPress admin dashboard.
	 */
	public static function wp_dashboard_setup() {
		// Do not show the widget to non-admins.
		if ( ! current_user_can( 'manage_options' ) ) {
			return;
		}

		if ( Jetpack::is_connection_ready() ) {
			static::load_admin_scripts(
				'jp-newsletter-widget',
				'newsletter-widget',
				array(
					'config_variable_name' => 'jetpackNewsletterWidgetConfigData',
					'config_data'          => static::get_config_data(),
					'load_minified_js'     => false,
				)
			);

			$widget_title = sprintf(
				__( 'Newsletter', 'jetpack' )
			);

			wp_add_dashboard_widget(
				self::$widget_id,
				$widget_title,
				array( static::class, 'render' ),
				// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
				null,
				array(),
				'side',
				'high'
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
			'load_minified_js'     => true,
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

		$file_extension = '.min.js';
		if ( ! $options['load_minified_js'] ) {
			$file_extension = '.js';
		}
		// Register and enqueue the script
		wp_register_script(
			$asset_handle,
			plugins_url( '_inc/build/' . $asset_name . $file_extension, JETPACK__PLUGIN_FILE ),
			$dependencies,
			$version,
			true
		);
		wp_enqueue_script( $asset_handle );
		if ( in_array( 'wp-i18n', $dependencies, true ) ) {
			wp_set_script_translations( $asset_handle, 'jetpack' );
		}

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

add_action(
	'wp_dashboard_setup',
	function () {
		Jetpack_Newsletter_Dashboard_Widget::init();
	}
);
