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
use Automattic\Jetpack\Blaze\Campaign_Preparer;
use Automattic\Jetpack\Connection\Manager as Jetpack_Connection;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_REST_Request;

/**
 * Registers the `blaze-ads` category and the Blaze abilities, and opts
 * each ability into WooCommerce's MCP server.
 */
class Blaze_Abilities extends Registrar {

	const CATEGORY_SLUG            = 'blaze-ads';
	const ABILITY_LIST_CAMPAIGNS   = 'blaze-ads/list-campaigns';
	const ABILITY_PREPARE_CAMPAIGN = 'blaze-ads/prepare-campaign';

	/**
	 * Slugs we own — used by `opt_into_woo_mcp` and the double-register guard.
	 */
	const OWNED_ABILITY_SLUGS = array(
		self::ABILITY_LIST_CAMPAIGNS,
		self::ABILITY_PREPARE_CAMPAIGN,
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
		if ( self::ABILITY_PREPARE_CAMPAIGN === $slug ) {
			/**
			 * Filters whether the Blaze `prepare-campaign` write ability is registered.
			 *
			 * Default true. Return false to keep the ability out of the registry —
			 * MCP clients won't see it, REST callers get 404. Use as a kill-switch
			 * if abuse, error rates, or infra issues require centrally disabling
			 * the write path without shipping a release.
			 *
			 * @since $$next-version$$
			 *
			 * @param bool $enabled Whether to register the prepare-campaign ability. Default true.
			 */
			if ( ! apply_filters( 'blaze_abilities_prepare_campaign_enabled', true ) ) {
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
			self::ABILITY_LIST_CAMPAIGNS   => array(
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
			self::ABILITY_PREPARE_CAMPAIGN => array(
				'label'               => __( 'Prepare a Blaze campaign', 'jetpack-blaze' ),
				'description'         => __( 'Prepare a Blaze advertising campaign proposal for an existing post or product on the site. The ability does not write to the DSP itself. It takes a target plus optional natural-language goal, budget, duration, copy, image, and safe audience overrides; derives sensible defaults from the target post; bundles the result into a prefill payload; and returns a deep-link the merchant clicks to review and submit in the existing Blaze UI. Audience overrides must use stable codes or closed enums: supported language codes, ISO country codes, supported device values, and Blaze public page topic IDs. Unsupported or ambiguous targeting should be omitted and handled by Blaze defaults or the review UI. The merchant reviews, accepts payment / T&C, and submits from inside the Blaze UI — that\'s where the actual DSP write happens.', 'jetpack-blaze' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'target_urn' ),
					'properties'           => array(
						'target_urn'           => array(
							'type'        => 'string',
							'description' => __( 'The URN of the post or product to promote (e.g. urn:wpcom:post:123456:42).', 'jetpack-blaze' ),
						),
						'goal'                 => array(
							'type'        => 'string',
							'description' => __( 'Optional natural-language campaign goal or intent. Blaze uses this as context while still owning the DSP objective internally.', 'jetpack-blaze' ),
						),
						'budget_total'         => array(
							'type'        => 'number',
							'description' => __( 'Optional total budget for the campaign in USD. If omitted, Blaze applies its default budget for this proposal.', 'jetpack-blaze' ),
							'minimum'     => 1,
						),
						'duration_days'        => array(
							'type'        => 'integer',
							'description' => __( 'Optional number of days the campaign should run. If omitted, Blaze applies its default duration for this proposal.', 'jetpack-blaze' ),
							'minimum'     => 1,
							'maximum'     => 90,
						),
						'revision_instruction' => array(
							'type'        => 'string',
							'description' => __( 'Optional natural-language instruction for revising a previous proposal, such as “make it less salesy”.', 'jetpack-blaze' ),
						),
						'is_evergreen'         => array(
							'type'        => 'boolean',
							'description' => __( 'Run until the merchant stops it. Defaults to true.', 'jetpack-blaze' ),
							'default'     => true,
						),
						'site_name'            => array(
							'type'        => 'string',
							'description' => __( 'Optional ad heading override. Defaults to the post title.', 'jetpack-blaze' ),
						),
						'text_snippet'         => array(
							'type'        => 'string',
							'description' => __( 'Optional ad copy override. Defaults to the post excerpt (or first ~200 chars of content).', 'jetpack-blaze' ),
						),
						'cta_text'             => array(
							'type'        => 'string',
							'description' => __( 'Optional call-to-action text override. Defaults to a post-type-aware Blaze choice.', 'jetpack-blaze' ),
						),
						'main_image_url'       => array(
							'type'        => 'string',
							'format'      => 'uri',
							'description' => __( 'Optional image URL override. Defaults to the target post featured image when available.', 'jetpack-blaze' ),
						),
						'main_image_mime_type' => array(
							'type'        => 'string',
							'description' => __( 'Optional MIME type for main_image_url. Defaults to image/jpeg when omitted.', 'jetpack-blaze' ),
						),
						'languages'            => array(
							'type'        => 'array',
							'description' => __( 'Optional ISO 639-1 language codes supported by Blaze/DSP (e.g. ["en", "es"]). Infer from the user\'s natural language request when clear, but omit when unsure or unsupported. Defaults to all languages when omitted; the merchant can adjust language targeting in the Blaze review UI.', 'jetpack-blaze' ),
							'items'       => array(
								'type'      => 'string',
								'minLength' => 2,
								'maxLength' => 5,
								'enum'      => array( 'zh', 'nl', 'en', 'fr', 'de', 'hi', 'id', 'it', 'ja', 'ko', 'pl', 'pt', 'ru', 'es', 'tr' ),
							),
						),
						'countries'            => array(
							'type'        => 'array',
							'description' => __( 'Optional ISO 3166-1 alpha-2 country codes to target (e.g. ["US", "GB"]). Infer from the user\'s natural-language location request, but emit country codes rather than localized country names. Defaults to worldwide when omitted; pass a non-empty array to limit reach to those countries.', 'jetpack-blaze' ),
							'items'       => array(
								'type'      => 'string',
								'minLength' => 2,
								'maxLength' => 2,
							),
						),
						'devices'              => array(
							'type'        => 'array',
							'description' => __( 'Optional narrowed device targeting value. Supported values are "mobile" and "desktop"; omit to target all devices. Tablet is not exposed until Blaze widget prefill support is verified end-to-end.', 'jetpack-blaze' ),
							'maxItems'    => 1,
							'items'       => array(
								'type' => 'string',
								'enum' => array( 'mobile', 'desktop' ),
							),
						),
						'interests'            => array(
							'type'        => 'array',
							'description' => __( 'Optional Blaze public page topic IDs to target. Supported IDs are the public DSP topic groups: IAB1, IAB8_IAB18, IAB19, IAB5_IAB15, IAB6_IAB7_IAB16, IAB3_IAB4_IAB13, IAB11_IAB12, IAB14_IAB23, IAB17, IAB2_IAB20, IAB10_IAB21_IAB13, and IAB9_IAB22. If a user asks for a bare included IAB category such as fashion (IAB18), use the matching public group ID, e.g. IAB8_IAB18. Do not send free-form interest names. Invalid or unsupported IDs are ignored.', 'jetpack-blaze' ),
							'items'       => array(
								'type' => 'string',
								'enum' => array( 'IAB1', 'IAB8_IAB18', 'IAB19', 'IAB5_IAB15', 'IAB6_IAB7_IAB16', 'IAB3_IAB4_IAB13', 'IAB11_IAB12', 'IAB14_IAB23', 'IAB17', 'IAB2_IAB20', 'IAB10_IAB21_IAB13', 'IAB9_IAB22' ),
							),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'        => 'object',
					'description' => __( 'Prefill payload plus a deep-link to the Blaze UI for the merchant to review and submit.', 'jetpack-blaze' ),
					'required'    => array( 'status', 'intent', 'assumptions', 'recommendations', 'prefill_url', 'prefill' ),
					'properties'  => array(
						'status'          => array(
							'type'        => 'string',
							'description' => __( 'Always "pending_merchant_review" for the immediate response. The campaign is not yet on the DSP — it lands there only when the merchant submits from the Blaze UI.', 'jetpack-blaze' ),
							'enum'        => array( 'pending_merchant_review' ),
						),
						'message'         => array(
							'type'        => 'string',
							'description' => __( 'Human-readable summary suitable for surfacing back to the merchant in chat. Includes the prefill_url verbatim so MCP clients that strip structured fields still surface the link.', 'jetpack-blaze' ),
						),
						'intent'          => array(
							'type'        => 'string',
							'description' => __( 'Inferred campaign intent used to choose server-owned defaults.', 'jetpack-blaze' ),
							'enum'        => array( 'ecommerce', 'content', 'unknown' ),
						),
						'assumptions'     => array(
							'type'        => 'array',
							'description' => __( 'Plain-language assumptions used while preparing the recommended campaign.', 'jetpack-blaze' ),
							'items'       => array(
								'type' => 'string',
							),
						),
						'recommendations' => array(
							'type'        => 'array',
							'description' => __( 'Plain-language guidance for reviewing the prepared campaign.', 'jetpack-blaze' ),
							'items'       => array(
								'type' => 'string',
							),
						),
						'budget_options'  => array(
							'type'        => 'array',
							'description' => __( 'Lower, recommended, and higher budget options returned when budget or duration is omitted. The recommended option is encoded in prefill_url.', 'jetpack-blaze' ),
							'items'       => array(
								'type'       => 'object',
								'properties' => array(
									'key'           => array(
										'type' => 'string',
										'enum' => array( 'lower', 'recommended', 'higher' ),
									),
									'label'         => array(
										'type' => 'string',
									),
									'budget'        => array(
										'type' => 'object',
									),
									'daily_budget'  => array(
										'type' => 'object',
									),
									'duration_days' => array(
										'type' => 'integer',
									),
									'rationale'     => array(
										'type' => 'string',
									),
								),
							),
						),
						'prefill_url'     => array(
							'type'        => 'string',
							'format'      => 'uri',
							'description' => __( 'Deep-link the merchant follows to land in the Blaze UI with the campaign form pre-populated. The prefill payload is encoded in the blaze_prefill query parameter.', 'jetpack-blaze' ),
						),
						'prefill'         => array(
							'type'        => 'object',
							'description' => __( 'The structured prefill payload — same data as encoded in prefill_url. Useful for the MCP client to surface a summary of what was prepared before the merchant clicks through.', 'jetpack-blaze' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'prepare_campaign' ),
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
	 * Prepare a Blaze campaign proposal by deriving sensible defaults from the
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
	public static function prepare_campaign( $args = array() ) {
		$args = is_array( $args ) ? $args : array();

		$proposal = Campaign_Preparer::prepare( $args );
		if ( is_wp_error( $proposal ) ) {
			return $proposal;
		}

		return array_merge(
			$proposal,
			array(
				'message' => sprintf(
					/* translators: %s: deep-link URL that opens the Blaze widget pre-populated with the prepared campaign proposal. */
					__( 'Campaign proposal prepared. The merchant must open the Blaze UI to review, accept payment / T&C, and submit. Open here: %s', 'jetpack-blaze' ),
					$proposal['prefill_url']
				),
			)
		);
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
