<?php
/**
 * The Facade of the package.
 *
 * Copyright 2024 Automattic
 * Based on code originally Copyright 2006 Aaron D. Campbell (email : wp_plugins@xavisys.com)
 *
 * @package automattic/jetpack-google-analytics
 */

namespace Automattic\Jetpack\Google_Analytics;

use Automattic\Jetpack\Modules;
use WP_Error;

/**
 * The Facade class of the package.
 */
class GA_Manager {

	const PACKAGE_VERSION = '0.2.2';

	/**
	 * Jetpack_Google_Analytics singleton instance.
	 *
	 * @var bool|self
	 */
	public static $instance = false;

	/**
	 * Property to hold concrete analytics implementation that does the work (universal or legacy).
	 *
	 * @var Universal|Legacy|bool
	 */
	public static $analytics = false;

	/**
	 * Defaults for the API version >=1.3.
	 *
	 * @var array
	 */
	private $api_defaults = array(
		'1.3' => array(
			'code'                 => '',
			'anonymize_ip'         => false,
			'ec_track_purchases'   => false,
			'ec_track_add_to_cart' => false,
		),
		'1.4' => array(
			'is_active'                     => false, // This default value will most likely be overwritten by the current status of the GA module.
			'code'                          => '',
			'anonymize_ip'                  => false,
			'honor_dnt'                     => false,
			'ec_track_purchases'            => false,
			'ec_track_add_to_cart'          => false,
			'enh_ec_tracking'               => false,
			'enh_ec_track_remove_from_cart' => false,
			'enh_ec_track_prod_impression'  => false,
			'enh_ec_track_prod_click'       => false,
			'enh_ec_track_prod_detail_view' => false,
			'enh_ec_track_checkout_started' => false,
		),
	);

	/**
	 * This is our constructor, which is private to force the use of get_instance()
	 *
	 * @return void
	 */
	private function __construct() {
		$settings = $this->get_google_analytics_settings();

		if ( ! empty( $settings['is_active'] ) ) {
			// At this time, we only leverage universal analytics when enhanced ecommerce is selected and WooCommerce is active.
			// Otherwise, don't bother emitting the tracking ID or fetching analytics.js
			if ( class_exists( 'WooCommerce' ) && Options::enhanced_ecommerce_tracking_is_enabled() ) {
				self::$analytics = new Universal();
				// @phan-suppress-next-line PhanNoopNew
				new AMP_Analytics();
			} else {
				self::$analytics = new Legacy();
			}
		}

		add_filter( 'site_settings_endpoint_get', array( $this, 'site_settings_fetch' ), 10, 2 );
		add_filter( 'site_settings_endpoint_update_wga', array( $this, 'site_settings_update' ), 10, 2 );
		add_filter( 'site_settings_endpoint_update_jetpack_wga', array( $this, 'site_settings_update' ) );
		add_action( 'jetpack_activate_module_google-analytics', array( $this, 'set_status_from_module' ) );
		add_action( 'jetpack_deactivate_module_google-analytics', array( $this, 'set_status_from_module' ) );
	}

	/**
	 * Function to instantiate our class and make it a singleton
	 */
	public static function get_instance() {
		if ( ! self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Includes the GA settings into site settings during a fetch request.
	 *
	 * @phan-suppress PhanUndeclaredTypeParameter,PhanUndeclaredClassInstanceof,PhanUndeclaredClassProperty
	 *
	 * @param array                                  $settings The fetched settings.
	 * @param \WPCOM_JSON_API_Site_Settings_Endpoint $api_handler The API handler object.
	 *
	 * @return array|mixed
	 */
	public function site_settings_fetch( $settings = array(), $api_handler = null ) {
		if ( ! is_array( $settings ) || ! $api_handler instanceof \WPCOM_JSON_API_Site_Settings_Endpoint ) {
			// Safeguard against something that should never happen.
			return $settings;
		}

		$settings['wga'] = $this->get_google_analytics_settings();

		if ( array_key_exists( $api_handler->min_version, $this->api_defaults ) ) {
			$settings['wga'] = wp_parse_args( $settings['wga'], $this->api_defaults[ $api_handler->min_version ] );
		}

		return $settings;
	}

	/**
	 * Modifies the GA settings into site settings during an update request.
	 *
	 * @phan-suppress PhanUndeclaredTypeParameter,PhanUndeclaredClassInstanceof,PhanUndeclaredClassProperty
	 *
	 * @param array                                  $value The settings to update.
	 * @param \WPCOM_JSON_API_Site_Settings_Endpoint $api_handler The API handler object.
	 *
	 * @return array|mixed
	 */
	public function site_settings_update( $value, $api_handler = null ) {
		if ( ! is_array( $value ) || ! $api_handler instanceof \WPCOM_JSON_API_Site_Settings_Endpoint ) {
			// This should never happen.
			return $value;
		}

		if ( ! isset( $value['code'] ) || ! preg_match( '/^$|^(UA-\d+-\d+)|(G-[A-Z0-9]+)$/i', $value['code'] ) ) {
			return new WP_Error( 'invalid_code', 'Invalid UA ID' );
		}

		$option_name = $this->get_google_analytics_option_name();

		$wga         = get_option( $option_name, array() );
		$wga['code'] = $value['code'];

		if ( ! array_key_exists( 'is_active', $wga ) ) {
			// The `is_active` flag is missing from the settings, add a default value based on the module status.
			$wga['is_active'] = ( new Modules() )->is_active( 'google-analytics', false );
		}

		/**
		 * Allow newer versions of this endpoint to filter in additional fields for Google Analytics
		 *
		 * @since Jetpack 5.4.0
		 * @since 0.2.0
		 *
		 * @param array $wga Associative array of existing Google Analytics settings.
		 * @param array $value Associative array of new Google Analytics settings passed to the endpoint.
		 */
		$wga = apply_filters( 'site_settings_update_wga', $wga, $value );

		if ( array_key_exists( $api_handler->min_version, $this->api_defaults ) ) {
			$wga_keys = array_keys( $this->api_defaults[ $api_handler->min_version ] );
			foreach ( $wga_keys as $wga_key ) {
				// Skip code since it's already handled.
				if ( 'code' === $wga_key ) {
					continue;
				}

				// All our new keys are booleans, so let's coerce each key's value
				// before updating the value in settings
				if ( array_key_exists( $wga_key, $value ) ) {
					$wga[ $wga_key ] = Utils::is_truthy( $value[ $wga_key ] );
				}
			}
		}

		$is_updated = update_option( $option_name, $wga );

		$enabled_or_disabled = $wga['code'] ? 'enabled' : 'disabled';

		/**
		 * Fires for each settings update.
		 *
		 * @since Jetpack 3.6.0
		 * @since 0.2.0
		 *
		 * @param string $action_type Type of settings to track.
		 * @param string $val The settings value.
		 */
		do_action( 'jetpack_bump_stats_extras', 'google-analytics', $enabled_or_disabled );

		return $is_updated ? $wga : null;
	}

	/**
	 * Update the `is_active` settings flag depending on the Google Analytics module status.
	 *
	 * @return void
	 */
	public function set_status_from_module() {
		$option_name = $this->get_google_analytics_option_name();

		$wga       = get_option( $option_name, array() );
		$is_active = ( new Modules() )->is_active( 'google-analytics', false );

		if ( ! array_key_exists( 'is_active', $wga ) || $is_active !== $wga['is_active'] ) {
			$wga['is_active'] = $is_active;
		}

		update_option( $option_name, $wga );
	}

	/**
	 * Get the GA settings option name.
	 *
	 * @return string
	 */
	public function get_google_analytics_option_name() {
		/**
		 * Filter whether the current site is a Jetpack site.
		 *
		 * @since Jetpack 3.3.0
		 * @since 0.2.0
		 *
		 * @param bool $is_jetpack Is the current site a Jetpack site. Default to false.
		 * @param int $blog_id Blog ID.
		 */
		$is_jetpack = true === apply_filters( 'is_jetpack_site', false, get_current_blog_id() );
		return $is_jetpack ? 'jetpack_wga' : 'wga';
	}

	/**
	 * Get GA settings.
	 *
	 * @return array
	 */
	public function get_google_analytics_settings() {
		$settings = get_option( $this->get_google_analytics_option_name() );

		// The `is_active` flag is missing from the settings, add a value based on the module status.
		if ( is_array( $settings ) && ! array_key_exists( 'is_active', $settings ) ) {
			$settings['is_active'] = ( new Modules() )->is_active( 'google-analytics', false );
			update_option( $this->get_google_analytics_option_name(), $settings );
		}

		return $settings;
	}

	/**
	 * Add amp-analytics tags.
	 *
	 * @param array $analytics_entries An associative array of the analytics entries.
	 *
	 * @return array
	 */
	public static function amp_analytics_entries( $analytics_entries ) {
		if ( ! is_array( $analytics_entries ) ) {
			$analytics_entries = array();
		}

		$amp_tracking_codes = static::get_amp_tracking_codes( $analytics_entries );
		$jetpack_account    = Options::get_tracking_code();

		// Bypass tracking codes already set on AMP plugin.
		if ( in_array( $jetpack_account, $amp_tracking_codes, true ) ) {
			return $analytics_entries;
		}

		$config_data = wp_json_encode(
			array(
				'vars'     => array(
					'account' => Options::get_tracking_code(),
				),
				'triggers' => array(
					'trackPageview' => array(
						'on'      => 'visible',
						'request' => 'pageview',
					),
				),
			)
		);

		// Generate a hash string to uniquely identify this entry.
		$entry_id = substr( md5( 'googleanalytics' . $config_data ), 0, 12 );

		$analytics_entries[ $entry_id ] = array(
			'type'   => 'googleanalytics',
			'config' => $config_data,
		);

		return $analytics_entries;
	}

	/**
	 * Get AMP tracking codes.
	 *
	 * @param array $analytics_entries The codes available for AMP.
	 *
	 * @return array
	 */
	protected static function get_amp_tracking_codes( $analytics_entries ) {
		$entries  = array_column( $analytics_entries, 'config' );
		$accounts = array();

		foreach ( $entries as $entry ) {
			$entry = json_decode( $entry );

			if ( ! empty( $entry->vars->account ) ) {
				$accounts[] = $entry->vars->account;
			}
		}

		return $accounts;
	}
}
