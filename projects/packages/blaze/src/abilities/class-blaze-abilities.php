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
				'description'         => __( 'Draft a Blaze advertising campaign for an existing post or product on the site. The ability does not write to the DSP itself — it derives sensible defaults from the target post (title, excerpt, featured image) and the caller\'s input (budget, duration, optional copy / objective overrides), bundles them into a prefill payload, and returns a deep-link the merchant clicks to land in the existing Blaze UI with every field already populated. The merchant reviews, accepts payment / T&C, and submits from inside the Blaze UI — that\'s where the actual DSP write happens.', 'jetpack-blaze' ),
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
							'description' => __( 'Campaign objective. Defaults to VIEWS.', 'jetpack-blaze' ),
							'enum'        => array( 'VIEWS', 'CLICKS', 'SALES' ),
							'default'     => 'VIEWS',
						),
						'is_evergreen'  => array(
							'type'        => 'boolean',
							'description' => __( 'Run until the merchant stops it. Defaults to true.', 'jetpack-blaze' ),
							'default'     => true,
						),
						'site_name'     => array(
							'type'        => 'string',
							'description' => __( 'Optional ad heading override. Defaults to the post title.', 'jetpack-blaze' ),
						),
						'text_snippet'  => array(
							'type'        => 'string',
							'description' => __( 'Optional ad copy override. Defaults to the post excerpt (or first ~200 chars of content).', 'jetpack-blaze' ),
						),
						'languages'     => array(
							'type'        => 'array',
							'description' => __( 'Optional ISO 639-1 language codes to target (e.g. ["en", "es"]). Defaults to all languages when omitted; pass a non-empty array to narrow targeting.', 'jetpack-blaze' ),
							'items'       => array(
								'type'      => 'string',
								'minLength' => 2,
								'maxLength' => 5,
							),
						),
						'countries'     => array(
							'type'        => 'array',
							'description' => __( 'Optional ISO 3166-1 alpha-2 country codes to target (e.g. ["US", "GB"]). Defaults to worldwide when omitted; pass a non-empty array to limit reach to those countries.', 'jetpack-blaze' ),
							'items'       => array(
								'type'      => 'string',
								'minLength' => 2,
								'maxLength' => 2,
							),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'        => 'object',
					'description' => __( 'Prefill payload plus a deep-link to the Blaze UI for the merchant to review and submit.', 'jetpack-blaze' ),
					'required'    => array( 'status', 'prefill_url', 'prefill' ),
					'properties'  => array(
						'status'      => array(
							'type'        => 'string',
							'description' => __( 'Always "pending_merchant_review" for the immediate response. The campaign is not yet on the DSP — it lands there only when the merchant submits from the Blaze UI.', 'jetpack-blaze' ),
							'enum'        => array( 'pending_merchant_review' ),
						),
						'message'     => array(
							'type'        => 'string',
							'description' => __( 'Human-readable summary suitable for surfacing back to the merchant in chat. Includes the prefill_url verbatim so MCP clients that strip structured fields still surface the link.', 'jetpack-blaze' ),
						),
						'prefill_url' => array(
							'type'        => 'string',
							'format'      => 'uri',
							'description' => __( 'Deep-link the merchant follows to land in the Blaze UI with the campaign form pre-populated. The prefill payload is encoded in the blaze_prefill query parameter.', 'jetpack-blaze' ),
						),
						'prefill'     => array(
							'type'        => 'object',
							'description' => __( 'The structured prefill payload — same data as encoded in prefill_url. Useful for the MCP client to surface a summary of what was drafted before the merchant clicks through.', 'jetpack-blaze' ),
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
	 * Draft a new Blaze campaign by deriving sensible defaults from the
	 * target post and bundling them into a prefill payload. Returns a
	 * deep-link the merchant clicks to land in the existing Blaze widget
	 * with every field already populated; the merchant reviews, accepts
	 * payment / T&C, and submits from inside the widget.
	 *
	 * Phase 2 v1 deliberately does NOT call the DSP create endpoint from
	 * the agent path. The actual DSP write happens when the merchant
	 * submits via the widget — we trust the existing flow for that.
	 *
	 * Cross-cutting guardrails (TOS / Blaze-eligibility) run before this
	 * method via the wrapper installed in `wrap_write_path_execute_callback()`.
	 *
	 * The Blaze widget's prefill-from-URL behaviour is a separate piece
	 * of work in `dsp-client` that this PR doesn't ship; until that
	 * lands the merchant can still follow the link and edit manually.
	 *
	 * @param array $args Ability input — see `get_abilities()` input_schema.
	 * @return array|\WP_Error
	 */
	public static function create_campaign( $args = array() ) {
		$args = is_array( $args ) ? $args : array();

		$urn = isset( $args['target_urn'] ) ? (string) $args['target_urn'] : '';
		if ( '' === $urn || ! preg_match( '/^urn:wpcom:post:\d+:(\d+)$/', $urn, $matches ) ) {
			return new \WP_Error(
				'blaze_invalid_target_urn',
				/* translators: %s: the malformed URN value supplied by the caller. */
				sprintf( __( 'Invalid target_urn %s. Expected format: urn:wpcom:post:<site_id>:<post_id>.', 'jetpack-blaze' ), $urn ),
				array( 'status' => 400 )
			);
		}

		$post = get_post( (int) $matches[1] );
		if ( ! $post ) {
			return new \WP_Error(
				'blaze_post_not_found',
				__( 'Post referenced by target_urn does not exist on this site.', 'jetpack-blaze' ),
				array( 'status' => 404 )
			);
		}

		$prefill     = self::build_prefill_payload( $args, $post );
		$prefill_url = self::build_prefill_url( $post->ID, $prefill );

		return array(
			'status'      => 'pending_merchant_review',
			'message'     => sprintf(
				/* translators: %s: deep-link URL that opens the Blaze widget pre-populated with the drafted campaign. */
				__( 'Draft prepared. The merchant must open the Blaze UI to review, accept payment / T&C, and submit. Open here: %s', 'jetpack-blaze' ),
				$prefill_url
			),
			'prefill_url' => $prefill_url,
			'prefill'     => $prefill,
		);
	}

	/**
	 * Build the campaign prefill payload from the caller's MCP input and
	 * the resolved target post. Pure function — no I/O — so it's easy to
	 * test and easy for callers to inspect in the response.
	 *
	 * Caller input (`site_name`, `text_snippet`, `objective`, `is_evergreen`)
	 * overrides the post-derived defaults. Anything we can't pull from
	 * the post or the input is left out — the widget will fill blanks
	 * with its own defaults at submission time.
	 *
	 * @param array    $args MCP input.
	 * @param \WP_Post $post The target post.
	 * @return array
	 */
	private static function build_prefill_payload( array $args, $post ): array {
		$featured_image_id   = (int) get_post_thumbnail_id( $post->ID );
		$featured_image_url  = $featured_image_id > 0 ? wp_get_attachment_image_url( $featured_image_id, 'full' ) : '';
		$featured_image_mime = $featured_image_id > 0 ? get_post_mime_type( $featured_image_id ) : '';

		// Sensible default snippet: post excerpt, or first ~200 chars of content stripped of HTML.
		$default_snippet = (string) get_the_excerpt( $post );
		if ( '' === $default_snippet ) {
			$stripped        = trim( wp_strip_all_tags( (string) $post->post_content ) );
			$default_snippet = function_exists( 'mb_substr' ) ? mb_substr( $stripped, 0, 200 ) : substr( $stripped, 0, 200 );
		}

		$payload = array(
			'target_urn'    => (string) $args['target_urn'],
			'type'          => (string) $post->post_type,
			'site_name'     => isset( $args['site_name'] ) && '' !== (string) $args['site_name']
				? (string) $args['site_name']
				: (string) get_the_title( $post ),
			'text_snippet'  => isset( $args['text_snippet'] ) && '' !== (string) $args['text_snippet']
				? (string) $args['text_snippet']
				: $default_snippet,
			// Default CTA varies by post type — products get a commerce-flavoured
			// "Shop Now", everything else gets the neutral "Learn More". The widget
			// requires a non-empty CTA to clear validation, so we always send one.
			'cta_text'      => 'product' === (string) $post->post_type ? 'Shop Now' : 'Learn More',
			'target_url'    => (string) get_permalink( $post ),
			'budget'        => array(
				'mode'     => 'total',
				'amount'   => (float) ( $args['budget_total'] ?? 0 ),
				'currency' => self::get_site_currency(),
			),
			'duration_days' => (int) ( $args['duration_days'] ?? 7 ),
			'is_evergreen'  => isset( $args['is_evergreen'] ) ? (bool) $args['is_evergreen'] : true,
			'objective'     => isset( $args['objective'] ) && '' !== (string) $args['objective']
				? (string) $args['objective']
				: 'VIEWS',
		);

		if ( '' !== $featured_image_url ) {
			$payload['main_image'] = array(
				'url'       => $featured_image_url,
				'mime_type' => $featured_image_mime ? $featured_image_mime : 'image/jpeg',
			);
		}

		// Optional targeting overrides. Pass-through normalisation only — the
		// widget resolves country codes to its internal geo records and the
		// language codes map straight to the language picker. Empty arrays
		// are dropped so the widget keeps its "all languages / worldwide"
		// defaults instead of being forced to an empty selection.
		if ( isset( $args['languages'] ) && is_array( $args['languages'] ) ) {
			$languages = array_values(
				array_filter(
					array_map( 'strtolower', array_map( 'strval', $args['languages'] ) ),
					static function ( $code ) {
						return '' !== $code;
					}
				)
			);
			if ( ! empty( $languages ) ) {
				$payload['languages'] = $languages;
			}
		}
		if ( isset( $args['countries'] ) && is_array( $args['countries'] ) ) {
			$countries = array_values(
				array_filter(
					array_map( 'strtoupper', array_map( 'strval', $args['countries'] ) ),
					static function ( $code ) {
						return 2 === strlen( $code );
					}
				)
			);
			if ( ! empty( $countries ) ) {
				$payload['countries'] = $countries;
			}
		}

		return $payload;
	}

	/**
	 * Build the deep-link the merchant follows to land in the Blaze
	 * widget with the campaign form pre-populated.
	 *
	 * URL shape: `<admin>/tools.php?page=advertising&blaze_prefill=<base64-json>#!/advertising/posts/promote/post-<id>/<hostname>`.
	 *
	 * The base path comes from `Blaze::get_campaign_management_url()` so
	 * we stay aligned with how Blaze opens the promote-post flow today;
	 * the `blaze_prefill` query param is the Phase 2 addition the widget
	 * will read on load. The param goes in the query string (not the
	 * hash) so it reaches the SPA on initial bootstrap reliably.
	 *
	 * @param int   $post_id The target post ID.
	 * @param array $prefill The prefill payload to encode.
	 * @return string
	 */
	private static function build_prefill_url( int $post_id, array $prefill ): string {
		$base = '';
		if ( class_exists( '\Automattic\Jetpack\Blaze' ) && method_exists( '\Automattic\Jetpack\Blaze', 'get_campaign_management_url' ) ) {
			$url_data = Blaze::get_campaign_management_url( $post_id );
			if ( is_array( $url_data ) && isset( $url_data['link'] ) ) {
				$base = (string) $url_data['link'];
			}
		}
		if ( '' === $base ) {
			$base = admin_url( 'tools.php?page=advertising' );
		}

		$encoded = self::base64url_encode( (string) wp_json_encode( $prefill, JSON_UNESCAPED_SLASHES ) );
		$param   = 'blaze_prefill=' . rawurlencode( $encoded );

		// Insert the param before the hash if there is one; otherwise append.
		$hash_pos = strpos( $base, '#' );
		if ( false === $hash_pos ) {
			$separator = ( false !== strpos( $base, '?' ) ) ? '&' : '?';
			return $base . $separator . $param;
		}

		$pre_hash  = substr( $base, 0, $hash_pos );
		$hash      = substr( $base, $hash_pos );
		$separator = ( false !== strpos( $pre_hash, '?' ) ) ? '&' : '?';

		return $pre_hash . $separator . $param . $hash;
	}

	/**
	 * URL-safe base64 encode (RFC 4648 §5). Avoids `+` and `/` characters
	 * that would otherwise need percent-encoding inside a URL.
	 *
	 * @param string $input Bytes to encode.
	 * @return string
	 */
	private static function base64url_encode( string $input ): string {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Encoding a structured prefill payload, not obfuscation.
		return rtrim( strtr( base64_encode( $input ), '+/', '-_' ), '=' );
	}

	/**
	 * Currency code for the prefill payload.
	 *
	 * Always USD: the DSP only supports USD for billing, so reading the
	 * Woo store currency would just produce a misleading number for
	 * non-USD merchants (the DSP would re-interpret the amount as USD
	 * regardless). Until the DSP gains multi-currency, normalize here.
	 *
	 * @return string ISO 4217 currency code.
	 */
	private static function get_site_currency(): string {
		return 'USD';
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

		$original_callback = $args['execute_callback'] ?? null;
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
