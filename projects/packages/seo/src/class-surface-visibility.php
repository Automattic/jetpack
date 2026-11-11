<?php
/**
 * Legacy discoverability and opt-in APIs for the SEO dashboard.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Modules;

/**
 * Retain discoverability and opt-in contracts for older clients.
 */
class Surface_Visibility {

	/**
	 * Whether the SEO surface is discoverable, independent of install age.
	 *
	 * @return bool
	 */
	public static function is_visible() {
		return true;
	}

	/**
	 * Retain the legacy opt-in contract without offering a redundant migration.
	 *
	 * @return bool
	 */
	public static function is_optin_available() {
		return false;
	}

	/**
	 * Expose whether this install should be offered the SEO opt-in, onto
	 * `window.JetpackScriptData.seo.optin_available` for other admin surfaces (e.g. the
	 * legacy Traffic-page banner). Only hooked when the feature flag is on, so the field is
	 * simply absent otherwise.
	 *
	 * @param array $data Script data being injected onto the page.
	 * @return array
	 */
	public static function inject_optin_availability( $data ) {
		if ( ! is_array( $data ) ) {
			$data = array();
		}

		$data[ Initializer::SCRIPT_DATA_KEY ]['optin_available'] = self::is_optin_available();
		// Hide the legacy Traffic controls now that every install uses the dashboard.
		$data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] = self::is_visible();

		return $data;
	}

	/**
	 * Retain the opt-in REST route for older clients that still offer migration.
	 *
	 * @return void
	 */
	public static function register_optin_route() {
		register_rest_route(
			'jetpack/v4',
			'/seo/opt-in',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( __CLASS__, 'handle_optin' ),
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
			)
		);
	}

	/**
	 * Opt an existing install into the new SEO experience: mark the surface visible and
	 * activate the `seo-tools` module, then hand back the dashboard URL to redirect to.
	 *
	 * Idempotent — re-opting-in is harmless. `Modules::activate()` is called with
	 * `$exit = false, $redirect = false`; the defaults would `exit()` and send a 302,
	 * which break a REST response.
	 *
	 * @return \WP_REST_Response
	 */
	public static function handle_optin() {
		update_option( Initializer::VISIBILITY_OPTION, true );

		if ( class_exists( 'Automattic\\Jetpack\\Modules' ) ) {
			( new Modules() )->activate( 'seo-tools', false, false );
		}

		return rest_ensure_response(
			array(
				'success'  => true,
				'redirect' => Admin_Page::get_url(),
			)
		);
	}
}
