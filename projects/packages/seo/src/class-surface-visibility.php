<?php
/**
 * The discoverability cohort for the Jetpack SEO surface, and the opt-in
 * that flips it: whether the admin menu registers on this site, and the
 * REST route existing self-hosted installs use to switch over.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Status\Host;

/**
 * Decides whether the SEO surface is discoverable and handles the opt-in.
 */
class Surface_Visibility {

	/**
	 * Whether the Jetpack SEO surface should be discoverable (admin menu registered).
	 *
	 * WordPress.com sites (Simple + Atomic) are always discoverable — how SEO presents
	 * there is a Dotcom decision, independent of the self-hosted rollout. On self-hosted
	 * sites the durable {@see Initializer::VISIBILITY_OPTION} cohort flag decides: fresh installs
	 * are seeded visible, existing installs stay hidden until they opt in. Defaults to
	 * hidden when the option is absent (e.g. before the plugin's seed has run), so an
	 * existing site is never surprised by the new surface before its cohort is recorded.
	 *
	 * @return bool
	 */
	public static function is_visible() {
		if ( class_exists( 'Automattic\\Jetpack\\Status\\Host' ) && ( new Host() )->is_wpcom_platform() ) {
			return true;
		}

		return (bool) get_option( Initializer::VISIBILITY_OPTION, false );
	}

	/**
	 * Whether to offer an existing install the chance to opt into the new SEO experience.
	 *
	 * The single source of truth for the opt-in surfaces (legacy Traffic-page banner, My
	 * Jetpack card). True only when the SEO product is available and the surface isn't
	 * visible yet — and since {@see self::is_visible()} already returns true for
	 * WordPress.com and for self-hosted installs that have opted in, "not visible"
	 * cleanly means "a self-hosted install that hasn't opted in".
	 *
	 * @return bool
	 */
	public static function is_optin_available() {
		return Initializer::is_available() && ! self::is_visible();
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
		// Read by the legacy Traffic page to hide its SEO / Sitemaps sections once the
		// site is on the new experience (fresh install / opted-in / WordPress.com), so the
		// two surfaces never show at once. The legacy sections stay for self-hosted installs
		// that haven't opted in.
		$data[ Initializer::SCRIPT_DATA_KEY ]['surface_visible'] = self::is_visible();

		return $data;
	}

	/**
	 * Register the opt-in REST route that switches an existing self-hosted install over to
	 * the new SEO experience.
	 *
	 * Lives on the `jetpack/v4` namespace and is registered ahead of the cohort gate, so a
	 * site whose SEO surface is still hidden can reach it from the legacy Traffic page or
	 * My Jetpack. See {@see self::handle_optin()}.
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
				'redirect' => admin_url( 'admin.php?page=' . Admin_Page::MENU_SLUG ),
			)
		);
	}
}
