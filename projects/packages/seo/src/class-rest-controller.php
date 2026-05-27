<?php
/**
 * REST controller for the `jetpack-seo/v1` namespace.
 *
 * The Overview endpoint aggregates site-wide SEO signals so the admin
 * dashboard can render with a single round-trip. Write endpoints for
 * settings, content, llms.txt, and AI crawlers arrive in later PRs.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Modules;
use Jetpack_SEO_Utils;
use WP_REST_Request;
use WP_REST_Response;
use WP_REST_Server;

/**
 * Registers all routes under `jetpack-seo/v1`.
 */
class REST_Controller {

	const NAMESPACE_ROOT = 'jetpack-seo/v1';

	/**
	 * Register routes.
	 *
	 * @return void
	 */
	public static function register_routes() {
		register_rest_route(
			self::NAMESPACE_ROOT,
			'/overview',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_overview' ),
				'permission_callback' => array( __CLASS__, 'permissions_check' ),
			)
		);
	}

	/**
	 * Default permission gate: site administrators only.
	 *
	 * @return bool
	 */
	public static function permissions_check() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * GET /jetpack-seo/v1/overview.
	 *
	 * Returns the aggregated state the Overview screen renders. Kept in a
	 * single endpoint so the dashboard loads with one request. Later PRs
	 * extend the response shape with additional cards (content health,
	 * AI discoverability, site verification).
	 *
	 * @param WP_REST_Request $request REST request.
	 * @return WP_REST_Response
	 */
	public static function get_overview( WP_REST_Request $request ) {
		unset( $request );

		$modules = new Modules();
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Jetpack_SEO_Utils lives in plugins/jetpack and is guarded by class_exists.
		$seo_enabled      = class_exists( 'Jetpack_SEO_Utils' ) && Jetpack_SEO_Utils::is_enabled_jetpack_seo();
		$seo_tools_active = $modules->is_active( 'seo-tools' );
		$sitemaps_active  = (bool) get_option( 'jetpack_seo_sitemap_enabled', false );
		// @phan-suppress-next-line PhanUndeclaredClassMethod -- Same as above; only invoked when class_exists.
		$front_page_desc = $seo_enabled ? Jetpack_SEO_Utils::get_front_page_meta_description() : '';

		return new WP_REST_Response(
			array(
				'site_visibility' => array(
					'search_engines_visible' => (int) get_option( 'blog_public', 1 ) === 1,
					'sitemap_active'         => $sitemaps_active,
					'sitemap_url'            => home_url( '/sitemap.xml' ),
					'seo_tools_active'       => $seo_tools_active,
					'front_page_description' => $front_page_desc,
				),
				'plan'            => array(
					'seo_enabled_for_site' => $seo_enabled,
				),
			)
		);
	}
}
