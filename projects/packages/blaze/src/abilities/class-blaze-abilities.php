<?php
/**
 * Jetpack Blaze Abilities Registration
 *
 * Registers a read-only Blaze ability with the WordPress Abilities API and
 * opts it into WooCommerce's MCP server tool whitelist so MCP clients
 * (e.g. Claude Desktop) can discover and invoke it alongside Woo's built-in
 * abilities.
 *
 * v1 scope is intentionally Woo-only: the class bails when a Woo MCP server
 * is not detected on the site. See ADS-952 for the broader rollout plan.
 *
 * @package automattic/jetpack-blaze
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; we guard with function_exists()/class_exists() so the file is safe on older WP and on sites without Woo MCP.

namespace Automattic\Jetpack\Blaze\Abilities;

use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_REST_Request;

/**
 * Registers the `blaze-ads` category and the `blaze-ads/list-campaigns`
 * ability, and opts the ability into WooCommerce's MCP server.
 */
class Blaze_Abilities extends Registrar {

	const CATEGORY_SLUG          = 'blaze-ads';
	const ABILITY_LIST_CAMPAIGNS = 'blaze-ads/list-campaigns';

	/**
	 * Wire registration into the Abilities API lifecycle and opt the
	 * ability into Woo's MCP server.
	 *
	 * Bails early when WooCommerce 10.7+ with the bundled MCP adapter is
	 * not present — the v1 surface is Woo-only on purpose.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::is_woo_mcp_available() ) {
			return;
		}

		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		add_filter( 'jetpack_wp_abilities_should_register', array( __CLASS__, 'guard_against_double_register' ), 10, 3 );
		add_filter( 'woocommerce_mcp_include_ability', array( __CLASS__, 'opt_into_woo_mcp' ), 10, 2 );

		parent::init();
	}

	/**
	 * Detect a Woo MCP server on the site. Single signal: the provider class
	 * was added to WooCommerce in 10.7 and is only loaded when MCP is
	 * available, so its presence is a sufficient gate.
	 *
	 * @return bool
	 */
	private static function is_woo_mcp_available(): bool {
		return class_exists( '\Automattic\WooCommerce\Internal\MCP\MCPAdapterProvider' );
	}

	/**
	 * Defensive `wp_get_ability()` check, wired through the Registrar's
	 * per-slug filter so we skip registration if something else (a previous
	 * call, another plugin) has already registered the ability.
	 *
	 * @param bool   $enabled Whether the registrar would proceed.
	 * @param string $type    'category' or 'ability'.
	 * @param string $slug    The slug being registered.
	 * @return bool
	 */
	public static function guard_against_double_register( $enabled, $type, $slug ) {
		if ( ! $enabled ) {
			return $enabled;
		}
		if ( 'ability' === $type && self::ABILITY_LIST_CAMPAIGNS === $slug && function_exists( 'wp_get_ability' ) && wp_get_ability( $slug ) ) {
			return false;
		}
		return $enabled;
	}

	/**
	 * Opt our ability into Woo's MCP server tool whitelist.
	 *
	 * @param bool   $include    Whether Woo would include the ability by default.
	 * @param string $ability_id The ability ID being considered.
	 * @return bool
	 */
	public static function opt_into_woo_mcp( $include, $ability_id ) {
		if ( self::ABILITY_LIST_CAMPAIGNS === $ability_id ) {
			return true;
		}
		return $include;
	}

	/**
	 * Category slug owned by this registrar.
	 *
	 * @return string
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * Category definition passed to `wp_register_ability_category()`.
	 *
	 * @return array
	 */
	public static function get_category_definition(): array {
		return array(
			// "Blaze" is a product name and should not be translated.
			'label'       => 'Blaze',
			'description' => __( 'Abilities for managing Blaze ad campaigns.', 'jetpack-blaze' ),
		);
	}

	/**
	 * Abilities owned by this registrar, keyed by slug.
	 *
	 * @return array<string, array>
	 */
	public static function get_abilities(): array {
		return array(
			self::ABILITY_LIST_CAMPAIGNS => array(
				'label'               => __( 'List Blaze campaigns', 'jetpack-blaze' ),
				'description'         => __( 'List the Blaze advertising campaigns associated with the current site, including status, schedule, spend, and performance metrics.', 'jetpack-blaze' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => new \stdClass(),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'        => 'object',
					'description' => __( 'Campaigns payload as returned by the Blaze DSP API.', 'jetpack-blaze' ),
				),
				'execute_callback'    => array( __CLASS__, 'list_campaigns' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array(
					'show_in_rest' => true,
					'annotations'  => array(
						'readonly'    => true,
						'destructive' => false,
						'idempotent'  => true,
					),
				),
			),
		);
	}

	/**
	 * Permission gate: store-manager capability plus an active Jetpack user
	 * connection. The user-connection check is what differs from the
	 * standalone Blaze Ads plugin variant of this file.
	 *
	 * @return bool
	 */
	public static function permission_callback() {
		// `manage_woocommerce` is a WooCommerce-defined capability — sniff lacks it in its known list.
		if ( ! current_user_can( 'manage_woocommerce' ) ) { // phpcs:ignore WordPress.WP.Capabilities.Unknown
			return false;
		}

		$connection = new Jetpack_Connection();
		if ( ! $connection->is_user_connected() ) {
			return false;
		}

		return true;
	}

	/**
	 * Return the campaigns payload by delegating to the existing DSP REST
	 * route. Using `rest_do_request()` rather than calling the controller
	 * directly so we inherit the standard request lifecycle, permission
	 * checks, and any third-party filters wired onto that route.
	 *
	 * @param array $args Ability input. Currently unused; reserved for future filtering params.
	 * @return array|\WP_Error
	 */
	public static function list_campaigns( $args = array() ) {
		unset( $args );

		$site_id = \Automattic\Jetpack\Connection\Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$route   = sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1.1/campaigns', $site_id );
		$request = new WP_REST_Request( 'GET', $route );
		$request->set_param( 'api_version', 'v1.1' );

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return $response->as_error();
		}

		return $response->get_data();
	}
}
