<?php
/**
 * Blaze dashboard Initial State
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Status\Host;
use Jetpack_Options;

/**
 * Class Dashboard_Config_Data
 */
class Dashboard_Config_Data {
	/**
	 * Set configData to window.configData.
	 *
	 * @param array $config_data The config data.
	 */
	public function get_js_config_data( $config_data = null ) {
		return 'window.configData = ' . wp_json_encode(
			$config_data === null ? $this->get_data() : $config_data
		) . ';';
	}

	/**
	 * Return the config for the app.
	 */
	public function get_data() {
		$blog_id      = Jetpack_Options::get_option( 'id' );
		$host         = new Host();
		$empty_object = json_decode( '{}' );

		$user = $this->get_connected_user_identity();

		return array(
			'admin_page_base'          => $this->get_admin_path(),
			'api_root'                 => esc_url_raw( rest_url() ),
			'blog_id'                  => $blog_id,
			'enable_all_sections'      => false,
			'env_id'                   => 'production',
			'google_analytics_key'     => 'UA-10673494-15',
			'hostname'                 => wp_parse_url( get_site_url(), PHP_URL_HOST ),
			'i18n_default_locale_slug' => 'en',
			'mc_analytics_enabled'     => false,
			'meta'                     => array(),
			'nonce'                    => wp_create_nonce( 'wp_rest' ),
			'site_name'                => \get_bloginfo( 'name' ),
			'sections'                 => array(),
			// Features are inlined in Calypso Blaze app (wp-calypso/apps/blaze-dashboard)
			'features'                 => array(),
			'initial_state'            => array(
				'currentUser' => array(
					'id'           => $user['ID'],
					'user'         => $user,
					'capabilities' => array(
						"$blog_id" => $this->get_current_user_capabilities(),
					),
				),
				'sites'       => array(
					'items'    => array(
						"$blog_id" => array(
							'ID'           => $blog_id,
							'URL'          => site_url(),
							'jetpack'      => true,
							'visible'      => true,
							'capabilities' => $empty_object,
							'products'     => array(),
							'plan'         => $empty_object, // we need this empty object, otherwise the front end would crash on insight page.
							'options'      => array(
								'admin_url'       => admin_url(),
								'gmt_offset'      => $this->get_gmt_offset(),
								'is_wpcom_atomic' => $host->is_woa_site(),
								'jetpack_version' => Constants::get_constant( 'JETPACK__VERSION' ),
							),
						),
					),
					'features' => array( "$blog_id" => array( 'data' => $this->get_plan_features() ) ),
				),
			),
		);
	}

	/**
	 * Gets the WordPress.com user's identity, if connected.
	 *
	 * @return array|bool
	 */
	protected function get_connected_user_identity() {
		$user_data = ( new Manager() )->get_connected_user_data();
		if ( ! $user_data ) {
			return array(
				'ID'         => 1000,
				'username'   => 'no-user',
				'localeSlug' => $this->get_locale(),
				'site_count' => 1,
			);
		}

		return array(
			'ID'         => $user_data['ID'],
			'username'   => $user_data['login'],
			'email'      => $user_data['email'],
			'localeSlug' => $this->get_locale(),
			'site_count' => 1,
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
			$parsed = wp_parse_url( admin_url( 'tools.php?page=advertising' ) );
			return $parsed['path'] . '?' . $parsed['query'];
		}
		// We do this because page.js requires the exactly page base to be set otherwise it will not work properly.
		// phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotSanitized
		return wp_unslash( $_SERVER['PHP_SELF'] ) . '?' . wp_unslash( $_SERVER['QUERY_STRING'] );
	}

	/**
	 * Get the user's locale acceptable by Calypso.
	 */
	protected function get_locale() {
		/**
		 * In WP, locales are formatted as LANGUAGE_REGION, for example `en`, `en_US`, `es_AR`,
		 * but Calypso expects language-region, e.g. `en-us`, `en`,  `es-ar`. So we need to convert
		 * them to lower case and replace the underscore with a dash.
		 */
		$locale = strtolower( get_user_locale() );
		$locale = str_replace( '_', '-', $locale );

		return $locale;
	}

	/**
	 * Get the features of the current plan.
	 */
	protected function get_plan_features() {
		$plan = Current_Plan::get();
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
