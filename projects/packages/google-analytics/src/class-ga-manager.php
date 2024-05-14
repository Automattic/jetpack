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

/**
 * The Facade class of the package.
 */
class GA_Manager {

	const PACKAGE_VERSION = '0.1.0';

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
	 * This is our constructor, which is private to force the use of get_instance()
	 *
	 * @return void
	 */
	private function __construct() {
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
