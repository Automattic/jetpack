<?php
/**
 * Stats Initial State
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;
use Jetpack_Options;

/**
 * Class Odyssey_Config_Data
 *
 * @package automattic/jetpack-stats-admin
 */
class Odyssey_Config_Data {

	/**
	 * Set configData to window.configData.
	 *
	 * @param string $config_variable_name The config variable name.
	 * @param array  $config_data The config data.
	 */
	public function get_js_config_data( $config_variable_name = 'configData', $config_data = null ) {
		return "window.{$config_variable_name} = " . wp_json_encode(
			$config_data === null ? $this->get_data() : $config_data
		) . ';';
	}

	/**
	 * Return the config for the app.
	 */
	public function get_data() {
		global $wp_version;

		$blog_id      = Jetpack_Options::get_option( 'id' );
		$empty_object = json_decode( '{}' );
		$host         = new Host();

		return array(
			'admin_page_base'                => $this->get_admin_path(),
			'api_root'                       => esc_url_raw( rest_url() ),
			'blog_id'                        => Jetpack_Options::get_option( 'id' ),
			'enable_all_sections'            => false,
			'env_id'                         => 'production',
			'google_analytics_key'           => 'UA-10673494-15',
			'google_maps_and_places_api_key' => '',
			'hostname'                       => wp_parse_url( get_site_url(), PHP_URL_HOST ),
			'i18n_default_locale_slug'       => 'en',
			'i18n_locale_slug'               => $this->get_site_locale(),
			'mc_analytics_enabled'           => false,
			'meta'                           => array(),
			'nonce'                          => wp_create_nonce( 'wp_rest' ),
			'site_name'                      => \get_bloginfo( 'name' ),
			'sections'                       => array(),
			// Features are inlined @see https://github.com/Automattic/wp-calypso/pull/70122
			'features'                       => array(),
			// Intended for apps that do not use redux.
			'gmt_offset'                     => $this->get_gmt_offset(),
			'odyssey_stats_base_url'         => admin_url( 'admin.php?page=stats' ),
			'intial_state'                   => array(
				'currentUser' => array(
					'id'           => 1000,
					'user'         => array(
						'ID'       => 1000,
						'username' => 'no-user',
					),
					'capabilities' => array(
						"$blog_id" => $this->get_current_user_capabilities(),
					),
				),
				'sites'       => array(
					'items'    => array(
						"$blog_id" => array(
							'ID'            => $blog_id,
							'URL'           => site_url(),
							'jetpack'       => true,
							'visible'       => true,
							'capabilities'  => $empty_object,
							'products'      => array(),
							'plan'          => $empty_object, // we need this empty object, otherwise the front end would crash on insight page.
							'options'       => array(
								'wordads'               => ( new Modules() )->is_active( 'wordads' ),
								'admin_url'             => admin_url(),
								'gmt_offset'            => $this->get_gmt_offset(),
								'is_automated_transfer' => $this->is_automated_transfer( $blog_id ),
								'is_wpcom_atomic'       => $host->is_woa_site(),
								'is_vip'                => $host->is_vip_site(),
								'jetpack_version'       => defined( 'JETPACK__VERSION' ) ? JETPACK__VERSION : '',
								'stats_admin_version'   => Main::VERSION,
								'software_version'      => $wp_version,
							),
							// TODO remove this and use API so that we could reduce loading time.
							'stats_notices' => ( new Notices() )->get_notices_to_show(),
						),
					),
					'features' => array( "$blog_id" => array( 'data' => $this->get_plan_features() ) ),
				),
			),
		);
	}

	/**
	 * Defines a filter to set whether a site is an automated_transfer site or not.
	 *
	 * Default is false. On Atomic, this is set to true by `wpcomsh`.
	 *
	 * @param int $blog_id Blog ID.
	 *
	 * @return bool
	 */
	public function is_automated_transfer( $blog_id ) {
		/**
		 * Filter if a site is an automated-transfer site.
		 *
		 * @module json-api
		 *
		 * @since 6.4.0
		 *
		 * @param bool is_automated_transfer( $this->blog_id )
		 * @param int  $blog_id Blog identifier.
		 */
		return apply_filters(
			'jetpack_site_automated_transfer',
			false,
			$blog_id
		);
	}

	/**
	 * Get the current site GMT Offset.
	 *
	 * @return float The current site GMT Offset by hours.
	 */
	protected function get_gmt_offset() {
		return (float) get_option( 'gmt_offset' );
	}

	/**
	 * Page base for the Calypso admin page.
	 */
	protected function get_admin_path() {
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		if ( ! isset( $_SERVER['PHP_SELF'] ) || ! isset( $_SERVER['QUERY_STRING'] ) ) {
			$parsed = wp_parse_url( admin_url( 'admin.php?page=stats' ) );
			return $parsed['path'] . '?' . $parsed['query'];
		}
		// We do this because page.js requires the exactly page base to be set otherwise it will not work properly.
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		return wp_unslash( $_SERVER['PHP_SELF'] ) . '?' . wp_unslash( $_SERVER['QUERY_STRING'] );
	}

	/**
	 * Get locale acceptable by Calypso.
	 */
	protected function get_site_locale() {
		/**
		 * In WP, locales are formatted as LANGUAGE_REGION, for example `en`, `en_US`, `es_AR`,
		 * but Calypso expects language-region, e.g. `en-us`, `en`,  `es-ar`. So we need to convert
		 * them to lower case and replace the underscore with a dash.
		 */
		$locale = strtolower( get_locale() );
		$locale = str_replace( '_', '-', $locale );

		return $locale;
	}

	/**
	 * Get the features of the current plan.
	 */
	protected function get_plan_features() {
		$plan = Jetpack_Plan::get();
		if ( empty( $plan['features'] ) ) {
			return array();
		}
		return $plan['features'];
	}

	/**
	 * Get the capabilities of the current user.
	 *
	 * @return array An array of capabilities.
	 */
	protected function get_current_user_capabilities() {
		$user = wp_get_current_user();
		if ( ! $user || is_wp_error( $user ) ) {
			return array();
		}
		return $user->allcaps;
	}
}
