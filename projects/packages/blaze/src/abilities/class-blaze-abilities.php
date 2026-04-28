<?php
/**
 * Jetpack Blaze Abilities Registration
 *
 * Single source of truth for Blaze's WordPress Abilities API registration.
 * Registers a read-only ability and opts it into WooCommerce's MCP server
 * tool whitelist so MCP clients (e.g. Claude Desktop) can discover and
 * invoke it alongside Woo's built-in abilities.
 *
 * Both delivery paths invoke this class:
 * - The Jetpack plugin, via `Automattic\Jetpack\Blaze::init()` in this package.
 * - The standalone `blaze-ads` plugin, via its own bootstrap.
 *
 * v1 scope is intentionally Woo-only: the class bails when a Woo MCP server
 * is not detected on the site. See ADS-952 for the broader rollout plan.
 *
 * @package automattic/jetpack-blaze
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; we guard with function_exists()/class_exists() so the file is safe on older WP and on sites without Woo MCP.

namespace Automattic\Jetpack\Blaze\Abilities;

use Automattic\Jetpack\Blaze;
use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_REST_Request;

/**
 * Registers the `blaze-ads` category and the Blaze abilities, and opts
 * each ability into WooCommerce's MCP server.
 */
class Blaze_Abilities extends Registrar {

	const CATEGORY_SLUG           = 'blaze-ads';
	const ABILITY_LIST_CAMPAIGNS  = 'blaze-ads/list-campaigns';
	const ABILITY_CREATE_CAMPAIGN = 'blaze-ads/create-campaign';

	/**
	 * Slugs we own — used by `opt_into_woo_mcp` and the double-register guard.
	 */
	const OWNED_ABILITY_SLUGS = array(
		self::ABILITY_LIST_CAMPAIGNS,
		self::ABILITY_CREATE_CAMPAIGN,
	);

	/**
	 * Wire registration into the Abilities API lifecycle and opt the
	 * ability into Woo's MCP server.
	 *
	 * Bails early when WooCommerce 10.7+ with the bundled MCP adapter is
	 * not present — the v1 surface is Woo-only on purpose.
	 *
	 * Note: deliberately does not call `parent::init()`. The Registrar
	 * base gates registration behind the `jetpack_wp_abilities_enabled`
	 * filter (default false), and toggling that filter would force-enable
	 * registration for *every* future Registrar consumer in the monorepo,
	 * not just Blaze. We mirror parent::init()'s lifecycle wiring directly
	 * so we only opt in our own abilities.
	 *
	 * @return void
	 */
	public static function init() {
		if ( ! self::is_woo_mcp_available() ) {
			return;
		}

		add_filter( 'jetpack_wp_abilities_should_register', array( __CLASS__, 'guard_against_double_register' ), 10, 3 );
		add_filter( 'woocommerce_mcp_include_ability', array( __CLASS__, 'opt_into_woo_mcp' ), 10, 2 );

		// Wrap write-path abilities at registration time with cross-cutting
		// guardrails (TOS, payment, spend ceiling). Inheritable by any future
		// write ability — see `wrap_write_path_execute_callback` for the policy.
		add_filter( 'wp_register_ability_args', array( __CLASS__, 'wrap_write_path_execute_callback' ), 10, 2 );

		// Audit log for write-ability invocations. Read-path abilities are
		// excluded by the listener itself.
		add_action( 'wp_after_execute_ability', array( __CLASS__, 'audit_log_write_invocation' ), 10, 3 );

		if ( did_action( self::CATEGORIES_INIT_ACTION ) ) {
			static::register_category();
		} else {
			add_action( self::CATEGORIES_INIT_ACTION, array( static::class, 'register_category' ) );
		}

		if ( did_action( self::ABILITIES_INIT_ACTION ) ) {
			static::register_abilities();
		} else {
			add_action( self::ABILITIES_INIT_ACTION, array( static::class, 'register_abilities' ) );
		}
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
	 * call, another plugin) has already registered the ability. Belt and
	 * braces: with both delivery paths invoking the same class this should
	 * be a no-op, but keeps us safe against anyone else registering the slug.
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
		if ( 'ability' !== $type || ! in_array( $slug, self::OWNED_ABILITY_SLUGS, true ) ) {
			return $enabled;
		}

		// Kill-switch: write abilities default to enabled but can be turned off
		// centrally via filter without a release if abuse / errors emerge.
		if ( self::ABILITY_CREATE_CAMPAIGN === $slug ) {
			/**
			 * Filters whether the Blaze `create-campaign` write ability is registered.
			 *
			 * Default true. Return false to keep the ability out of the registry —
			 * MCP clients won't see it, REST callers get 404. Use as a kill-switch
			 * if abuse, error rates, or infra issues require centrally disabling
			 * the write path without shipping a release.
			 *
			 * @since $$next-version$$
			 *
			 * @param bool $enabled Whether to register the create-campaign ability. Default true.
			 */
			if ( ! apply_filters( 'blaze_abilities_create_campaign_enabled', true ) ) {
				return false;
			}
		}

		// Defensive: skip if something else has already registered the slug.
		if ( function_exists( 'wp_get_ability' ) && wp_get_ability( $slug ) ) {
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
		if ( in_array( $ability_id, self::OWNED_ABILITY_SLUGS, true ) ) {
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
			self::ABILITY_LIST_CAMPAIGNS  => array(
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
			self::ABILITY_CREATE_CAMPAIGN => array(
				'label'               => __( 'Draft a new Blaze campaign', 'jetpack-blaze' ),
				'description'         => __( 'Draft a new Blaze advertising campaign for an existing post or product on the site. The campaign is created in DRAFT state and requires the merchant to explicitly approve it in the Blaze UI before it goes live — the response includes a deep-link to that UI.', 'jetpack-blaze' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'target_urn', 'budget_total', 'duration_days' ),
					'properties'           => array(
						'target_urn'    => array(
							'type'        => 'string',
							'description' => __( 'The URN of the post or product to promote (e.g. urn:wpcom:post:123456:42).', 'jetpack-blaze' ),
						),
						'budget_total'  => array(
							'type'        => 'number',
							'description' => __( 'Total budget for the campaign in the site\'s currency.', 'jetpack-blaze' ),
							'minimum'     => 1,
						),
						'duration_days' => array(
							'type'        => 'integer',
							'description' => __( 'Number of days the campaign should run.', 'jetpack-blaze' ),
							'minimum'     => 1,
							'maximum'     => 90,
						),
						'objective'     => array(
							'type'        => 'string',
							'description' => __( 'Campaign objective.', 'jetpack-blaze' ),
							'enum'        => array( 'VIEWS', 'CLICKS', 'SALES' ),
							'default'     => 'VIEWS',
						),
					),
					'additionalProperties' => true,
				),
				'output_schema'       => array(
					'type'        => 'object',
					'description' => __( 'Draft campaign reference plus a deep-link to the Blaze UI for merchant approval.', 'jetpack-blaze' ),
					'required'    => array( 'campaign_id', 'status', 'approval_url' ),
					'properties'  => array(
						'campaign_id'  => array(
							'type'        => 'string',
							'description' => __( 'The DSP-assigned ID of the draft campaign.', 'jetpack-blaze' ),
						),
						'status'       => array(
							'type'        => 'string',
							'description' => __( 'Campaign status. Always "draft" for the immediate response.', 'jetpack-blaze' ),
						),
						'approval_url' => array(
							'type'        => 'string',
							'format'      => 'uri',
							'description' => __( 'Deep-link to the Blaze widget where the merchant previews and approves this draft.', 'jetpack-blaze' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'create_campaign' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array(
					'show_in_rest' => true,
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => false,
						'idempotent'  => false,
					),
				),
			),
		);
	}

	/**
	 * Permission gate: store-manager capability plus an active Jetpack user
	 * connection. Both delivery paths route DSP calls through Jetpack
	 * Connect, so the connection check is meaningful regardless of how the
	 * package was loaded.
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

	/**
	 * Draft a new Blaze campaign by delegating to the existing DSP create
	 * route. Returns a draft reference plus a deep-link to the Blaze widget
	 * for merchant approval — the campaign does not go live until the
	 * merchant explicitly approves it there.
	 *
	 * Note: cross-cutting guardrails (TOS, payment, spend ceiling) run
	 * *before* this method via the registration-time wrapper applied in
	 * `wrap_write_path_execute_callback()`. This method only handles the
	 * happy-path delegation.
	 *
	 * @param array $args Ability input — see `get_abilities()` input_schema.
	 * @return array|\WP_Error
	 */
	public static function create_campaign( $args = array() ) {
		$site_id = \Automattic\Jetpack\Connection\Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$route   = sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1.1/campaigns', $site_id );
		$request = new WP_REST_Request( 'POST', $route );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( wp_json_encode( $args, JSON_UNESCAPED_SLASHES ) );

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return $response->as_error();
		}

		$data = $response->get_data();

		return array(
			'campaign_id'  => isset( $data['campaign_id'] ) ? (string) $data['campaign_id'] : ( isset( $data['id'] ) ? (string) $data['id'] : '' ),
			'status'       => 'draft',
			'approval_url' => self::get_approval_url( $args, $data ),
			'campaign'     => $data,
		);
	}

	/**
	 * Build the deep-link the merchant follows to preview and approve a
	 * draft campaign.
	 *
	 * Phase 2 punts to the existing Blaze management URL family — that's
	 * the SPA where drafts can be reviewed today. The exact in-SPA route
	 * for "approve this specific draft" may need a follow-up with the
	 * Calypso team; for now we land the merchant in the advertising
	 * dashboard with the campaign visible.
	 *
	 * @param array $args         Original ability input (used for target_urn fallback).
	 * @param array $dsp_response Response payload from the DSP create route. Reserved for future use (campaign-id-based deep-link lookup).
	 * @return string
	 */
	private static function get_approval_url( array $args, $dsp_response ) {
		unset( $dsp_response );
		// Try to extract a post ID from the target URN to leverage the
		// existing `Blaze::get_campaign_management_url()` helper.
		$post_id = 0;
		$urn     = isset( $args['target_urn'] ) ? (string) $args['target_urn'] : '';
		if ( $urn && preg_match( '/^urn:wpcom:post:\d+:(\d+)$/', $urn, $m ) ) {
			$post_id = (int) $m[1];
		}

		if ( $post_id > 0 && class_exists( '\Automattic\Jetpack\Blaze' ) ) {
			$url_data = Blaze::get_campaign_management_url( $post_id );
			return is_array( $url_data ) && isset( $url_data['link'] ) ? $url_data['link'] : '';
		}

		// Fallback: the bare advertising dashboard.
		return admin_url( 'tools.php?page=advertising' );
	}

	/**
	 * Registration-time wrapper for write-path abilities.
	 *
	 * Applied via the `wp_register_ability_args` filter. For any of our
	 * abilities marked `meta.annotations.readonly => false`, replaces the
	 * configured `execute_callback` with a closure that runs cross-cutting
	 * guardrails first and only delegates to the original callback if all
	 * checks pass.
	 *
	 * v1 guardrails: TOS / Blaze-eligibility check.
	 * Deferred guardrails (tracked separately as ADS-989): per-session
	 * spend ceiling, Picard creative moderation. The wrapper is the
	 * intended insertion point for both.
	 *
	 * Lives at registration time (not via `wp_before_execute_ability`)
	 * because the action hook is fire-and-forget and cannot abort the
	 * call. Lives at the wrapper level (not `permission_callback`)
	 * because the Abilities API strips structured data from permission
	 * errors — the merchant needs to receive a deep-link in the error,
	 * which only works from the execute path.
	 *
	 * Future Phase 3 write abilities inherit this wrapper for free as
	 * long as they're registered with `meta.annotations.readonly => false`.
	 *
	 * @param array  $args         Args being registered for the ability.
	 * @param string $ability_name The fully-qualified ability slug.
	 * @return array
	 */
	public static function wrap_write_path_execute_callback( array $args, string $ability_name ): array {
		// Only touch our own abilities.
		if ( ! in_array( $ability_name, self::OWNED_ABILITY_SLUGS, true ) ) {
			return $args;
		}

		$is_write = isset( $args['meta']['annotations']['readonly'] ) && false === $args['meta']['annotations']['readonly'];
		if ( ! $is_write ) {
			return $args;
		}

		$original_callback = isset( $args['execute_callback'] ) ? $args['execute_callback'] : null;
		if ( ! is_callable( $original_callback ) ) {
			return $args;
		}

		$args['execute_callback'] = static function ( $input = array() ) use ( $original_callback ) {
			$tos_check = self::check_tos_and_payment();
			if ( is_wp_error( $tos_check ) ) {
				return $tos_check;
			}

			// Future write-path guardrails (per-session spend ceiling, Picard
			// moderation gating) plug in here. Tracked separately as ADS-989.

			return call_user_func( $original_callback, $input );
		};

		return $args;
	}

	/**
	 * Verify the site is eligible for Blaze write actions.
	 *
	 * Uses the existing `Blaze::site_supports_blaze()` helper — a coarse
	 * single-call boolean that proxies the WPCOM `/sites/<id>/blaze/status`
	 * endpoint and is true when the site has accepted TOS and is otherwise
	 * eligible to run campaigns. Result is cached for a day inside that
	 * helper, so the per-call cost is a transient lookup.
	 *
	 * On failure, returns a `WP_Error` whose **message** embeds a deep-link
	 * URL the merchant can follow to fix the issue in the Blaze UI.
	 *
	 * Why message-text and not the `data` field: the Woo MCP adapter strips
	 * `WP_Error::data` when forwarding errors to MCP clients
	 * (see vendor/wordpress/mcp-adapter ToolsHandler.php — only `message` +
	 * `code` survive). Embedding the URL in the message ensures Claude /
	 * other MCP clients can present it to the merchant. The `data` field is
	 * kept too as belt-and-braces for direct WP Abilities REST callers,
	 * which preserve it via standard WP REST error serialization.
	 *
	 * @return true|\WP_Error
	 */
	private static function check_tos_and_payment() {
		$site_id = \Automattic\Jetpack\Connection\Manager::get_site_id();
		if ( is_wp_error( $site_id ) || ! $site_id ) {
			// Without a connected site we can't check, and downstream calls
			// will fail anyway — let the underlying execute_callback surface
			// the connection error rather than fabricating one here.
			return true;
		}

		if ( Blaze::site_supports_blaze( $site_id ) ) {
			return true;
		}

		$fix_url = admin_url( 'tools.php?page=advertising' );
		return new \WP_Error(
			'blaze_setup_required',
			sprintf(
				/* translators: %s is a URL the merchant follows to set up Blaze. */
				__( 'This site is not yet eligible to run Blaze campaigns. Complete Blaze setup (accept the terms of service and add a payment method) here: %s', 'jetpack-blaze' ),
				$fix_url
			),
			array(
				'status'    => 403,
				'fix_url'   => $fix_url,
				'fix_label' => __( 'Set up Blaze', 'jetpack-blaze' ),
			)
		);
	}

	/**
	 * Audit-log listener for write-path ability invocations.
	 *
	 * Filters down to slugs we own and that are write-path; ignores
	 * read-only abilities and anything outside our category. Logs to the
	 * standard error log for now — a structured audit store is a follow-up.
	 *
	 * @param string $ability_name The slug of the executed ability.
	 * @param mixed  $input        The input passed to the ability.
	 * @param mixed  $result       The result the ability returned.
	 * @return void
	 */
	public static function audit_log_write_invocation( string $ability_name, $input, $result ): void {
		if ( ! in_array( $ability_name, self::OWNED_ABILITY_SLUGS, true ) ) {
			return;
		}
		// Skip read-only abilities — only audit writes.
		if ( self::ABILITY_LIST_CAMPAIGNS === $ability_name ) {
			return;
		}

		$entry = array(
			'ability'   => $ability_name,
			'user_id'   => get_current_user_id(),
			'site_id'   => \Automattic\Jetpack\Connection\Manager::get_site_id(),
			'input'     => $input,
			'is_error'  => is_wp_error( $result ),
			'timestamp' => time(),
		);

		// TODO(ADS-953): replace with structured audit storage. For now, log
		// to error_log for visibility during development and reviewer testing.
		error_log( '[blaze-abilities-audit] ' . wp_json_encode( $entry, JSON_UNESCAPED_SLASHES ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
	}
}
