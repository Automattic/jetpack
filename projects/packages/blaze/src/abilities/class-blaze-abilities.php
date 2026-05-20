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
use Automattic\Jetpack\Tracking;
use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_REST_Request;

/**
 * Registers the `blaze-ads` category and the Blaze abilities, and opts
 * each ability into WooCommerce's MCP server.
 */
class Blaze_Abilities extends Registrar {

	const CATEGORY_SLUG                = 'blaze-ads';
	const ABILITY_LIST_CAMPAIGNS           = 'blaze-ads/list-campaigns';
	const ABILITY_GET_CAMPAIGN_STATS       = 'blaze-ads/get-campaign-stats';
	const ABILITY_PREPARE_CAMPAIGN         = 'blaze-ads/prepare-campaign';
	const ABILITY_SUBMIT_PREPARED_CAMPAIGN = 'blaze-ads/submit-prepared-campaign';
	const ABILITY_STOP_CAMPAIGN            = 'blaze-ads/stop-campaign';

	/**
	 * Slugs we own — used by `opt_into_woo_mcp` and the double-register guard.
	 */
	const OWNED_ABILITY_SLUGS = array(
		self::ABILITY_LIST_CAMPAIGNS,
		self::ABILITY_GET_CAMPAIGN_STATS,
		self::ABILITY_PREPARE_CAMPAIGN,
		self::ABILITY_SUBMIT_PREPARED_CAMPAIGN,
		self::ABILITY_STOP_CAMPAIGN,
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
		if ( self::ABILITY_SUBMIT_PREPARED_CAMPAIGN === $slug ) {
			/**
			 * Filters whether the Blaze `submit-prepared-campaign` write ability is registered.
			 *
			 * Default true. Return false to keep the paid chat submit path out
			 * of the registry without hiding prepare/list/stats/stop.
			 *
			 * @since $$next-version$$
			 *
			 * @param bool $enabled Whether to register submit-prepared-campaign. Default true.
			 */
			if ( ! apply_filters( 'blaze_abilities_submit_prepared_campaign_enabled', true ) ) {
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
				'description'         => __( 'List the Blaze advertising campaigns associated with the current site, including numeric campaign_id, campaign title/name, DSP status, schedule, spend, target, and performance context. Use campaign_id for follow-up operations; title/name is human-readable context for the merchant, not as the operation identifier.', 'jetpack-blaze' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'default'              => array(),
					'properties'           => array(
						'status' => array(
							'type'        => 'string',
							'description' => __( 'Optional DSP campaign status filter. Values pass through to the existing Blaze DSP campaigns route; clients should use DSP status vocabulary returned by this ability rather than inventing MCP-only states.', 'jetpack-blaze' ),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'        => 'object',
					'description' => __( 'Campaigns payload as returned by the Blaze DSP API.', 'jetpack-blaze' ),
					'properties'  => array(
						'campaigns' => array(
							'type'        => 'array',
							'description' => __( 'Blaze campaigns returned by DSP. MCP clients should show these fields so the merchant can choose the right campaign before requesting stats or stop operations.', 'jetpack-blaze' ),
							'items'       => array(
								'type'                 => 'object',
								'additionalProperties' => true,
								'properties'           => array(
									'campaign_id'   => array(
										'type'        => 'integer',
										'description' => __( 'The numeric operation identifier for follow-up campaign operations such as stats or stop.', 'jetpack-blaze' ),
									),
									'title'         => array(
										'type'        => 'string',
										'description' => __( 'Campaign title shown as human-readable context for the merchant, not as the operation identifier.', 'jetpack-blaze' ),
									),
									'name'          => array(
										'type'        => 'string',
										'description' => __( 'Campaign name shown as human-readable context for the merchant, not as the operation identifier.', 'jetpack-blaze' ),
									),
									'status'        => array(
										'type'        => 'string',
										'description' => __( 'DSP status for the campaign, using the status vocabulary returned by Blaze/DSP.', 'jetpack-blaze' ),
									),
									'ui_status'     => array(
										'type'        => 'string',
										'description' => __( 'Display status returned by DSP for merchant-facing UI context, when available.', 'jetpack-blaze' ),
									),
									'start_date'    => array(
										'type'        => 'string',
										'description' => __( 'Campaign start date returned by DSP, when available.', 'jetpack-blaze' ),
									),
									'end_date'      => array(
										'type'        => 'string',
										'description' => __( 'Campaign end date returned by DSP, when available.', 'jetpack-blaze' ),
									),
									'target_url'    => array(
										'type'        => 'string',
										'format'      => 'uri',
										'description' => __( 'Target URL promoted by the campaign, when available.', 'jetpack-blaze' ),
									),
									'target_urn'    => array(
										'type'        => 'string',
										'description' => __( 'Target URN promoted by the campaign, when available.', 'jetpack-blaze' ),
									),
									'budget'        => array(
										'type'        => 'object',
										'description' => __( 'Campaign budget details returned by DSP, when available.', 'jetpack-blaze' ),
									),
									'summary_stats' => array(
										'type'        => 'object',
										'description' => __( 'Existing campaign summary stats returned by DSP, when available.', 'jetpack-blaze' ),
									),
								),
							),
						),
					),
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
			self::ABILITY_GET_CAMPAIGN_STATS => array(
				'label'               => __( 'Get Blaze campaign stats', 'jetpack-blaze' ),
				'description'         => __( 'Get raw Blaze display advertising stats for a campaign, plus basic derived CTR, CPM, CPC, and clicks-per-dollar metrics.', 'jetpack-blaze' ),
				'input_schema'        => array(
					'type'                 => 'object',
					'required'             => array( 'campaign_id' ),
					'properties'           => array(
						'campaign_id' => array(
							'type'        => 'integer',
							'description' => __( 'Numeric DSP campaign ID.', 'jetpack-blaze' ),
							'minimum'     => 1,
						),
						'start_date'  => array(
							'type'        => 'string',
							'format'      => 'date',
							'description' => __( 'Optional stats start date in YYYY-MM-DD format.', 'jetpack-blaze' ),
						),
						'end_date'    => array(
							'type'        => 'string',
							'format'      => 'date',
							'description' => __( 'Optional stats end date in YYYY-MM-DD format.', 'jetpack-blaze' ),
						),
						'time_zone'   => array(
							'type'        => 'string',
							'description' => __( 'Optional IANA timezone name used by the DSP stats endpoint.', 'jetpack-blaze' ),
						),
						'resolution'  => array(
							'type'        => 'string',
							'description' => __( 'Optional stats time-series resolution accepted by the DSP stats endpoint.', 'jetpack-blaze' ),
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'        => 'object',
					'description' => __( 'Campaign stats payload with raw totals, time series, country breakdown, derived metrics, and lightweight display-ad context.', 'jetpack-blaze' ),
					'required'    => array( 'raw_stats', 'totals', 'time_series', 'country_breakdown', 'derived_metrics', 'context' ),
					'properties'  => array(
						'raw_stats'         => array(
							'type'        => 'object',
							'description' => __( 'Raw campaign stats payload as returned by the Blaze DSP stats endpoint.', 'jetpack-blaze' ),
						),
						'totals'            => array(
							'type'       => 'object',
							'required'   => array( 'impressions', 'clicks', 'spend' ),
							'properties' => array(
								'impressions' => array(
									'type' => 'integer',
								),
								'clicks'      => array(
									'type' => 'integer',
								),
								'spend'       => array(
									'type' => 'number',
								),
							),
						),
						'time_series'       => array(
							'type'        => 'array',
							'description' => __( 'Raw time-series rows from the stats endpoint, including impressions, clicks, and spend when present.', 'jetpack-blaze' ),
							'items'       => array(
								'type' => 'object',
							),
						),
						'country_breakdown' => array(
							'type'        => 'array',
							'description' => __( 'Raw country breakdown rows from the stats endpoint.', 'jetpack-blaze' ),
							'items'       => array(
								'type' => 'object',
							),
						),
						'derived_metrics'   => array(
							'type'       => 'object',
							'required'   => array( 'ctr', 'cpm', 'cpc', 'clicks_per_dollar' ),
							'properties' => array(
								'ctr'               => array(
									'type'        => array( 'number', 'null' ),
									'description' => __( 'Click-through rate as clicks divided by impressions.', 'jetpack-blaze' ),
								),
								'cpm'               => array(
									'type'        => array( 'number', 'null' ),
									'description' => __( 'Cost per thousand impressions.', 'jetpack-blaze' ),
								),
								'cpc'               => array(
									'type'        => array( 'number', 'null' ),
									'description' => __( 'Cost per click.', 'jetpack-blaze' ),
								),
								'clicks_per_dollar' => array(
									'type'        => array( 'number', 'null' ),
									'description' => __( 'Clicks divided by spend.', 'jetpack-blaze' ),
								),
							),
						),
						'context'           => array(
							'type'        => 'string',
							'description' => __( 'Lightweight display-ad framing for interpreting CTR alongside CPM, CPC, and campaign goals.', 'jetpack-blaze' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'get_campaign_stats' ),
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
					'required'             => array(),
					'properties'           => array(
						'target_urn'           => array(
							'type'        => 'string',
							'description' => __( 'The canonical URN of the post or product to promote (e.g. urn:wpcom:post:123456:42). Advanced callers may pass this directly; other callers should use site_url plus post_id or site_url plus product_id.', 'jetpack-blaze' ),
						),
						'site_url'             => array(
							'type'        => 'string',
							'format'      => 'uri',
							'description' => __( 'Optional public WordPress.com site URL or domain used with post_id or product_id when target_urn is not known.', 'jetpack-blaze' ),
						),
						'post_id'              => array(
							'type'        => 'integer',
							'description' => __( 'Optional WordPress post ID to promote with site_url when target_urn is not known. Do not send post_id and product_id together.', 'jetpack-blaze' ),
							'minimum'     => 1,
						),
						'product_id'           => array(
							'type'        => 'integer',
							'description' => __( 'Optional WooCommerce product_id to promote with site_url when target_urn is not known. This is normalized into the canonical post target URN. Do not send post_id and product_id together.', 'jetpack-blaze' ),
							'minimum'     => 1,
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
						'payment_method_id'    => array(
							'type'        => 'string',
							'description' => __( 'Optional existing saved payment method ID to use for chat-native submit. Omit to let Blaze choose the default saved payment method. This does not add a new payment method.', 'jetpack-blaze' ),
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
								'pattern'   => '^[A-Z]{2}$',
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
					'description' => __( 'Chat-ready prepared campaign package plus a deep-link to the Blaze UI for fallback review and submit.', 'jetpack-blaze' ),
					'required'    => array(
						'status',
						'message',
						'campaign_preview',
						'forecast_summary',
						'prepared_campaign',
						'submit_package',
						'rendered_preview',
						'campaign_summary',
						'fallback_url',
						'submit_eligibility',
						'material_edit_policy',
						'intent',
						'forecast',
						'assumptions',
						'recommendations',
						'prefill_url',
						'prefill',
					),
					'properties'  => array(
						'status'           => array(
							'type'        => 'string',
							'description' => __( 'Always "pending_merchant_review" for the immediate response. The campaign is not yet on the DSP — it lands there only when the merchant submits from the Blaze UI.', 'jetpack-blaze' ),
							'enum'        => array( 'pending_merchant_review' ),
						),
						'message'          => array(
							'type'        => 'string',
							'description' => __( 'Primary human-readable response for the MCP client to show to the merchant. Display this Markdown field verbatim in chat before the review link; it includes a campaign preview table and the prefill_url verbatim so MCP clients that strip structured fields still surface the link.', 'jetpack-blaze' ),
						),
						'campaign_preview' => array(
							'type'        => 'object',
							'description' => __( 'Structured campaign preview rows used by the MCP adapter to render the merchant-readable table.', 'jetpack-blaze' ),
							'required'    => array( 'ad_heading', 'ad_copy', 'call_to_action', 'objective', 'budget', 'duration', 'schedule', 'audience', 'landing_page' ),
							'properties'  => array(
								'ad_heading'     => array(
									'type' => 'string',
								),
								'ad_copy'        => array(
									'type' => 'string',
								),
								'call_to_action' => array(
									'type' => 'string',
								),
								'objective'      => array(
									'type' => 'string',
								),
								'budget'         => array(
									'type' => 'string',
								),
								'duration'       => array(
									'type' => 'string',
								),
								'schedule'       => array(
									'type' => 'string',
								),
								'audience'       => array(
									'type' => 'string',
								),
								'landing_page'   => array(
									'type' => 'string',
								),
							),
						),
						'forecast_summary' => array(
							'type'        => 'string',
							'description' => __( 'Human-readable forecast summary for the recommended option, or a fallback note when forecasts are unavailable.', 'jetpack-blaze' ),
						),
						'prepared_campaign' => array(
							'type'        => 'object',
							'description' => __( 'Immutable prepared package identity. Later submit actions must use this identity so the merchant approves the exact package being submitted.', 'jetpack-blaze' ),
							'required'    => array( 'id', 'hash', 'version' ),
							'properties'  => array(
								'id'      => array(
									'type' => 'string',
								),
								'hash'    => array(
									'type' => 'string',
								),
								'version' => array(
									'type' => 'string',
								),
							),
						),
						'submit_package'   => array(
							'type'        => 'object',
							'description' => __( 'Exact DSP submit payload and policy versions for the submit-prepared-campaign ability. Clients must add the structured approval event after explicit user approval; ordinary chat text is not approval.', 'jetpack-blaze' ),
							'required'    => array( 'prepared_package_id', 'prepared_campaign_hash', 'prepared_campaign', 'accepted_terms_version', 'accepted_policy_version' ),
							'properties'  => array(
								'prepared_package_id' => array(
									'type' => 'string',
								),
								'prepared_campaign_hash' => array(
									'type' => 'string',
								),
								'prepared_campaign' => array(
									'type' => 'object',
								),
								'accepted_terms_version' => array(
									'type' => 'string',
								),
								'accepted_policy_version' => array(
									'type' => 'string',
								),
							),
						),
						'rendered_preview'  => array(
							'type'        => 'object',
							'description' => __( 'Blaze-owned rendered preview artifact for chat clients. Clients should render this instead of composing ad HTML themselves.', 'jetpack-blaze' ),
							'required'    => array( 'type', 'html' ),
							'properties'  => array(
								'type' => array(
									'type' => 'string',
									'enum' => array( 'html' ),
								),
								'html' => array(
									'type' => 'string',
								),
							),
						),
						'campaign_summary' => array(
							'type'        => 'object',
							'description' => __( 'Structured campaign summary for chat display: destination, creative, budget, cadence, schedule, targeting, and source context.', 'jetpack-blaze' ),
							'required'    => array(
								'destination',
								'creative',
								'budget',
								'cadence',
								'schedule',
								'targeting_summary',
								'source_context',
							),
						),
						'fallback_url'     => array(
							'type'        => 'string',
							'format'      => 'uri',
							'description' => __( 'Blaze widget or dashboard URL that can review and submit this prepared package when chat-native submit is unavailable or the merchant wants the full UI.', 'jetpack-blaze' ),
						),
						'submit_eligibility' => array(
							'type'        => 'object',
							'description' => __( 'Hints that tell chat clients whether chat-native submit can proceed or whether the merchant should use fallback_url.', 'jetpack-blaze' ),
							'required'    => array( 'chat_native_submit', 'payment_method', 'reason', 'fallback_url', 'selected_payment_method', 'available_payment_methods' ),
							'properties'  => array(
								'chat_native_submit' => array(
									'type' => 'boolean',
								),
								'payment_method'     => array(
									'type' => array( 'string', 'boolean' ),
								),
								'reason'             => array(
									'type' => array( 'string', 'null' ),
								),
								'fallback_url'       => array(
									'type'   => 'string',
									'format' => 'uri',
								),
								'selected_payment_method' => array(
									'type'        => array( 'object', 'null' ),
									'description' => __( 'Compact safe summary of the saved payment method selected for chat-native submit, or null when unavailable.', 'jetpack-blaze' ),
								),
								'available_payment_methods' => array(
									'type'        => 'array',
									'description' => __( 'Compact safe summaries of usable existing saved payment methods that can be selected by re-running prepare-campaign with payment_method_id.', 'jetpack-blaze' ),
								),
								'supports_payment_method_switching' => array(
									'type'        => 'boolean',
									'description' => __( 'Whether more than one usable existing saved payment method is available for selection.', 'jetpack-blaze' ),
								),
							),
						),
						'approval_block'   => array(
							'type'        => 'object',
							'description' => __( 'Approval wording keys and exact package identity, present when a saved payment method makes chat-native submit eligible.', 'jetpack-blaze' ),
							'required'    => array(
								'prepared_campaign_id',
								'prepared_campaign_hash',
								'title_key',
								'body_key',
								'confirmation_label_key',
								'approval_statement',
								'approval_contract',
								'approval_event',
								'approval_event_required_fields',
								'charge_acknowledgement',
								'requires_exact_identity',
								'requires_reprepare_edits',
							),
							'properties'  => array(
								'prepared_campaign_id' => array(
									'type'        => 'string',
									'description' => __( 'Prepared campaign package ID that must be echoed by the approval event.', 'jetpack-blaze' ),
								),
								'prepared_campaign_hash' => array(
									'type'        => 'string',
									'description' => __( 'Prepared campaign package hash that must be echoed by the approval event.', 'jetpack-blaze' ),
								),
								'title_key'   => array(
									'type'        => 'string',
									'description' => __( 'Localization key for the approval title.', 'jetpack-blaze' ),
								),
								'body_key'    => array(
									'type'        => 'string',
									'description' => __( 'Localization key for the approval body.', 'jetpack-blaze' ),
								),
								'confirmation_label_key' => array(
									'type'        => 'string',
									'description' => __( 'Localization key for the explicit approval control label.', 'jetpack-blaze' ),
								),
								'approval_statement' => array(
									'type'        => 'string',
									'description' => __( 'Canonical fallback approval wording owned by Blaze.', 'jetpack-blaze' ),
								),
								'approval_contract' => array(
									'type'        => 'object',
									'description' => __( 'Language-independent approval contract containing the exact package identity, terms/policy versions, charge terms, cancellation wording version, payment method, user, and site.', 'jetpack-blaze' ),
								),
								'approval_event' => array(
									'type'        => 'object',
									'description' => __( 'Approval event template. Clients must set approved_at and submit the full structured event; normal chat text is not approval.', 'jetpack-blaze' ),
								),
								'approval_event_required_fields' => array(
									'type'        => 'array',
									'description' => __( 'Fields required for a valid structured approval event.', 'jetpack-blaze' ),
									'items'       => array(
										'type' => 'string',
									),
								),
								'charge_acknowledgement' => array(
									'type'        => 'object',
									'description' => __( 'Localization key and live prepared values for rendering the widget-equivalent charge acknowledgement.', 'jetpack-blaze' ),
								),
								'requires_exact_identity' => array(
									'type' => 'boolean',
								),
								'requires_reprepare_edits' => array(
									'type' => 'boolean',
								),
							),
						),
						'material_edit_policy' => array(
							'type'        => 'object',
							'description' => __( 'Fields that require a new prepare-campaign call before approval or submit because they change the prepared package identity.', 'jetpack-blaze' ),
							'required'    => array( 'requires_reprepare', 'material_fields', 'non_material_fields', 'message' ),
						),
						'intent'           => array(
							'type'        => 'string',
							'description' => __( 'Inferred campaign intent used to choose server-owned defaults.', 'jetpack-blaze' ),
							'enum'        => array( 'ecommerce', 'content', 'unknown' ),
						),
						'forecast'         => array(
							'type'        => 'object',
							'description' => __( 'Forecast estimates for the recommended option. Available forecasts include views/impressions and clicks ranges; unavailable forecasts do not block the review URL.', 'jetpack-blaze' ),
						),
						'assumptions'      => array(
							'type'        => 'array',
							'description' => __( 'Plain-language assumptions used while preparing the recommended campaign.', 'jetpack-blaze' ),
							'items'       => array(
								'type' => 'string',
							),
						),
						'recommendations'  => array(
							'type'        => 'array',
							'description' => __( 'Plain-language guidance for reviewing the prepared campaign.', 'jetpack-blaze' ),
							'items'       => array(
								'type' => 'string',
							),
						),
						'budget_options'   => array(
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
						'prefill_url'      => array(
							'type'        => 'string',
							'format'      => 'uri',
							'description' => __( 'Deep-link the merchant follows to land in the Blaze UI with the campaign form pre-populated. The prefill payload is encoded in the blaze_prefill query parameter.', 'jetpack-blaze' ),
						),
						'prefill'          => array(
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
			self::ABILITY_SUBMIT_PREPARED_CAMPAIGN => array(
					'label'               => __( 'Submit an approved prepared Blaze campaign', 'jetpack-blaze' ),
					'description'         => __( 'Submit one previously prepared Blaze campaign package after explicit structured approval from the merchant. This spends real money. Do not call this from a normal chat phrase such as “looks good”; call it only after the client has rendered the exact approval terms from prepare-campaign and captured a structured approval event for the same prepared package hash, payment method, terms version, policy version, and idempotency key.', 'jetpack-blaze' ),
					'input_schema'        => array(
						'type'                 => 'object',
						'required'             => array( 'idempotency_key', 'prepared_package_id', 'prepared_campaign_hash', 'prepared_campaign', 'accepted_terms_version', 'accepted_policy_version', 'approval' ),
						'properties'           => array(
							'idempotency_key'          => array(
								'type'        => 'string',
								'description' => __( 'Durable idempotency key from the prepared package approval event.', 'jetpack-blaze' ),
							),
							'prepared_package_id'      => array(
								'type'        => 'string',
								'description' => __( 'Prepared package ID returned by prepare-campaign.', 'jetpack-blaze' ),
							),
							'prepared_campaign_hash'   => array(
								'type'        => 'string',
								'description' => __( 'Stable hash of the exact prepared_campaign payload returned by prepare-campaign.', 'jetpack-blaze' ),
							),
							'prepared_campaign'        => array(
								'type'        => 'object',
								'description' => __( 'Exact DSP campaign payload returned in prepare-campaign submit_package.prepared_campaign. Do not edit this without preparing a new campaign.', 'jetpack-blaze' ),
							),
							'accepted_terms_version'   => array(
								'type'        => 'string',
								'description' => __( 'Terms version rendered for explicit approval.', 'jetpack-blaze' ),
							),
							'accepted_policy_version'  => array(
								'type'        => 'string',
								'description' => __( 'Advertising policy version rendered for explicit approval.', 'jetpack-blaze' ),
							),
							'approval'                 => array(
								'type'        => 'object',
								'description' => __( 'Structured approval event for this exact package. It must include type prepared_campaign.approved and approved_at; ordinary chat text is not approval.', 'jetpack-blaze' ),
							),
						),
						'additionalProperties' => false,
					),
					'output_schema'       => array(
						'type'        => 'object',
						'description' => __( 'DSP submit response decorated for chat. Success means the campaign was submitted and is pending approval/moderation, not already running.', 'jetpack-blaze' ),
						'required'    => array( 'status', 'message', 'campaign_status', 'dashboard_url', 'widget_url', 'selected_payment_method', 'budget', 'source_tracking', 'submit_response' ),
						'properties'  => array(
							'status'                  => array(
								'type' => 'string',
								'enum' => array( 'submitted_pending_approval' ),
							),
							'message'                 => array(
								'type'        => 'string',
								'description' => __( 'Human-readable pending confirmation for chat clients.', 'jetpack-blaze' ),
							),
							'campaign_status'         => array(
								'type' => 'string',
							),
							'dashboard_url'           => array(
								'type' => 'string',
							),
							'widget_url'              => array(
								'type' => 'string',
							),
							'selected_payment_method' => array(
								'type' => 'object',
							),
							'budget'                  => array(
								'type' => 'object',
							),
							'source_tracking'         => array(
								'type' => 'object',
							),
							'submit_response'         => array(
								'type' => 'object',
							),
						),
					),
					'execute_callback'    => array( __CLASS__, 'submit_prepared_campaign' ),
					'permission_callback' => array( __CLASS__, 'permission_callback' ),
					'meta'                => array(
						'show_in_rest' => true,
						'annotations'  => array(
							'readonly'    => false,
							'destructive' => true,
							'idempotent'  => true,
						),
					),
				),
			self::ABILITY_STOP_CAMPAIGN        => array(
					'label'               => __( 'Stop a Blaze campaign', 'jetpack-blaze' ),
					'description'         => __( 'Preview or confirm stopping delivery for an existing Blaze campaign. Pass the numeric DSP campaign_id. By default this returns the current campaign context and consequence text without calling the DSP stop endpoint. Set confirm to true only after the merchant explicitly confirms they want to stop serving; confirm mode re-fetches campaign context and delegates stop eligibility to the existing DSP stop endpoint.', 'jetpack-blaze' ),
					'input_schema'        => array(
						'type'                 => 'object',
						'required'             => array( 'campaign_id' ),
						'properties'           => array(
							'campaign_id' => array(
								'type'        => 'integer',
							'description' => __( 'Numeric DSP campaign ID to stop.', 'jetpack-blaze' ),
							'minimum'     => 1,
						),
						'confirm'     => array(
							'type'        => 'boolean',
							'description' => __( 'Set to true only after the merchant explicitly confirms they want this campaign stopped from serving. Defaults to false, which previews the consequence without stopping the campaign.', 'jetpack-blaze' ),
							'default'     => false,
						),
					),
					'additionalProperties' => false,
				),
				'output_schema'       => array(
					'type'        => 'object',
					'description' => __( 'Stop-campaign preview or confirmation response with campaign context and merchant-facing wording.', 'jetpack-blaze' ),
					'required'    => array( 'status', 'message', 'campaign' ),
					'properties'  => array(
						'status'      => array(
							'type'        => 'string',
							'description' => __( 'pending_confirmation for preview responses, or stopped for successful confirm responses.', 'jetpack-blaze' ),
							'enum'        => array( 'pending_confirmation', 'stopped' ),
						),
						'message'     => array(
							'type'        => 'string',
							'description' => __( 'Primary human-readable response for the MCP client to show to the merchant.', 'jetpack-blaze' ),
						),
						'campaign'    => array(
							'type'        => 'object',
							'description' => __( 'Current campaign context fetched from the Blaze DSP API.', 'jetpack-blaze' ),
						),
						'consequence' => array(
							'type'        => 'string',
							'description' => __( 'Clear consequence text explaining that confirmation stops the campaign from serving.', 'jetpack-blaze' ),
						),
					),
				),
				'execute_callback'    => array( __CLASS__, 'stop_campaign' ),
				'permission_callback' => array( __CLASS__, 'permission_callback' ),
				'meta'                => array(
					'show_in_rest' => true,
					'annotations'  => array(
						'readonly'    => false,
						'destructive' => true,
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
	 * @param array $args Ability input.
	 * @return array|\WP_Error
	 */
	public static function list_campaigns( $args = array() ) {
		$args = is_array( $args ) ? $args : array();

		$site_id = \Automattic\Jetpack\Connection\Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$route   = sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1.1/campaigns', $site_id );
		$request = new WP_REST_Request( 'GET', $route );
		$request->set_param( 'api_version', 'v1.1' );
		if ( isset( $args['status'] ) ) {
			$request->set_param( 'status', $args['status'] );
		}

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return $response->as_error();
		}

		return $response->get_data();
	}

	/**
	 * Return a Blaze campaign stats payload.
	 *
	 * @param array $args Ability input — see `get_abilities()` input_schema.
	 * @return array|\WP_Error
	 */
	public static function get_campaign_stats( $args = array() ) {
		$args            = is_array( $args ) ? $args : array();
		$raw_campaign_id = isset( $args['campaign_id'] ) ? $args['campaign_id'] : null;
		$campaign_id     = 0;

		if ( is_int( $raw_campaign_id ) ) {
			$campaign_id = $raw_campaign_id;
		} elseif ( is_string( $raw_campaign_id ) && ctype_digit( $raw_campaign_id ) ) {
			$campaign_id = (int) $raw_campaign_id;
		}

		if ( $campaign_id < 1 ) {
			return new \WP_Error(
				'blaze_invalid_campaign_id',
				__( 'A numeric DSP campaign ID is required.', 'jetpack-blaze' ),
				array( 'status' => 400 )
			);
		}

		$site_id = \Automattic\Jetpack\Connection\Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$route   = sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1/stats/%d', $site_id, $campaign_id );
		$request = new WP_REST_Request( 'GET', $route );
		$request->set_param( 'api_version', 'v1' );

		foreach ( array( 'start_date', 'end_date', 'time_zone', 'resolution' ) as $param ) {
			if ( isset( $args[ $param ] ) && '' !== $args[ $param ] ) {
				$request->set_param( $param, $args[ $param ] );
			}
		}

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return $response->as_error();
		}

		$stats  = $response->get_data();
		$totals = is_array( $stats ) ? self::extract_campaign_stats_totals( $stats ) : array(
			'impressions' => 0,
			'clicks'      => 0,
			'spend'       => 0.0,
		);

		return array(
			'raw_stats'         => $stats,
			'totals'            => $totals,
			'time_series'       => is_array( $stats ) ? self::extract_campaign_stats_time_series( $stats ) : array(),
			'country_breakdown' => is_array( $stats ) ? self::extract_campaign_stats_country_breakdown( $stats ) : array(),
			'derived_metrics'   => self::derive_campaign_stats_metrics( $totals ),
			'context'           => __( 'Blaze is display advertising. A low CTR should be interpreted alongside CPM, CPC, and campaign goals before drawing conclusions.', 'jetpack-blaze' ),
		);
	}

	/**
	 * Extract raw total metrics from known stats payload shapes.
	 *
	 * @param array $stats Raw stats payload.
	 * @return array
	 */
	private static function extract_campaign_stats_totals( array $stats ): array {
		$source = isset( $stats['totals'] ) && is_array( $stats['totals'] ) ? $stats['totals'] : $stats;

		return array(
			'impressions' => (int) self::get_first_numeric_value( $source, array( 'impressions', 'total_impressions' ) ),
			'clicks'      => (int) self::get_first_numeric_value( $source, array( 'clicks', 'total_clicks' ) ),
			'spend'       => (float) self::get_first_numeric_value( $source, array( 'spend', 'total_spend' ) ),
		);
	}

	/**
	 * Extract time-series rows from known stats payload shapes.
	 *
	 * @param array $stats Raw stats payload.
	 * @return array
	 */
	private static function extract_campaign_stats_time_series( array $stats ): array {
		if ( isset( $stats['series'] ) && is_array( $stats['series'] ) ) {
			return $stats['series'];
		}

		if ( isset( $stats['time_series'] ) && is_array( $stats['time_series'] ) ) {
			return $stats['time_series'];
		}

		return array();
	}

	/**
	 * Extract country breakdown rows from known stats payload shapes.
	 *
	 * @param array $stats Raw stats payload.
	 * @return array
	 */
	private static function extract_campaign_stats_country_breakdown( array $stats ): array {
		if ( isset( $stats['countries'] ) && is_array( $stats['countries'] ) ) {
			return $stats['countries'];
		}

		if ( isset( $stats['country_breakdown'] ) && is_array( $stats['country_breakdown'] ) ) {
			return $stats['country_breakdown'];
		}

		return array();
	}

	/**
	 * Derive simple campaign stats metrics from totals.
	 *
	 * @param array $totals Normalized totals.
	 * @return array
	 */
	private static function derive_campaign_stats_metrics( array $totals ): array {
		$impressions = isset( $totals['impressions'] ) ? (int) $totals['impressions'] : 0;
		$clicks      = isset( $totals['clicks'] ) ? (int) $totals['clicks'] : 0;
		$spend       = isset( $totals['spend'] ) ? (float) $totals['spend'] : 0.0;

		return array(
			'ctr'               => $impressions > 0 ? $clicks / $impressions : null,
			'cpm'               => $impressions > 0 ? ( $spend / $impressions ) * 1000 : null,
			'cpc'               => $clicks > 0 ? $spend / $clicks : null,
			'clicks_per_dollar' => $spend > 0 ? $clicks / $spend : null,
		);
	}

	/**
	 * Return the first numeric value found in an array.
	 *
	 * @param array $source Source data.
	 * @param array $keys Candidate keys.
	 * @return float|int
	 */
	private static function get_first_numeric_value( array $source, array $keys ) {
		foreach ( $keys as $key ) {
			if ( isset( $source[ $key ] ) && is_numeric( $source[ $key ] ) ) {
				return $source[ $key ];
			}
		}

		return 0;
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

		return array(
			'status'           => $proposal['status'],
			'message'          => self::format_prepare_campaign_message( $proposal ),
			'campaign_preview' => self::build_campaign_preview( $proposal ),
			'forecast_summary' => self::build_forecast_summary( $proposal ),
		) + $proposal;
	}

	/**
	 * Submit an explicitly approved prepared campaign through the DSP proxy.
	 *
	 * @param array $args Ability input — see `get_abilities()` input_schema.
	 * @return array|\WP_Error
	 */
	public static function submit_prepared_campaign( $args = array() ) {
		$args = is_array( $args ) ? $args : array();

		foreach ( array( 'idempotency_key', 'prepared_package_id', 'prepared_campaign_hash', 'prepared_campaign', 'accepted_terms_version', 'accepted_policy_version', 'approval' ) as $field ) {
			if ( ! array_key_exists( $field, $args ) || null === $args[ $field ] || '' === $args[ $field ] ) {
				return new \WP_Error(
					'blaze_submit_prepared_campaign_missing_field',
					sprintf(
						/* translators: %s: missing submit field name. */
						__( 'The approved prepared campaign submit request is missing %s.', 'jetpack-blaze' ),
						$field
					),
					array( 'status' => 400 )
				);
			}
		}

		if ( ! is_array( $args['prepared_campaign'] ) || ! is_array( $args['approval'] ) ) {
			return new \WP_Error(
				'blaze_submit_prepared_campaign_invalid_payload',
				__( 'The prepared campaign and approval event must be structured objects.', 'jetpack-blaze' ),
				array( 'status' => 400 )
			);
		}

		$route = self::get_dsp_submit_prepared_campaign_route();
		if ( is_wp_error( $route ) ) {
			return $route;
		}

		$request = new WP_REST_Request( 'POST', $route );
		$request->set_body_params(
			array(
				'idempotency_key'          => (string) $args['idempotency_key'],
				'prepared_package_id'      => (string) $args['prepared_package_id'],
				'prepared_campaign_hash'   => (string) $args['prepared_campaign_hash'],
				'prepared_campaign'        => $args['prepared_campaign'],
				'accepted_terms_version'   => (string) $args['accepted_terms_version'],
				'accepted_policy_version'  => (string) $args['accepted_policy_version'],
				'approval'                 => self::build_dsp_submit_approval_event( $args ),
			)
		);

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return $response->as_error();
		}

		$status = $response->get_status();
		$data   = $response->get_data();
		if ( $status >= 400 ) {
			return self::rest_response_to_wp_error( is_array( $data ) ? $data : array(), $status );
		}

		$submit_response = is_array( $data ) ? $data : array();
		return self::format_submit_prepared_campaign_response( $submit_response );
	}

	/**
	 * Reduce Blaze's rich approval event to the DSP submit contract.
	 *
	 * @param array $args Submit ability input.
	 * @return array
	 */
	private static function build_dsp_submit_approval_event( array $args ): array {
		$approval = isset( $args['approval'] ) && is_array( $args['approval'] ) ? $args['approval'] : array();

		return array(
			'type'                    => 'prepared_campaign.approved',
			'prepared_package_id'     => isset( $approval['prepared_package_id'] ) ? (string) $approval['prepared_package_id'] : (string) $args['prepared_package_id'],
			'prepared_campaign_hash'  => isset( $approval['prepared_campaign_hash'] ) ? (string) $approval['prepared_campaign_hash'] : (string) $args['prepared_campaign_hash'],
			'idempotency_key'         => isset( $approval['idempotency_key'] ) ? (string) $approval['idempotency_key'] : (string) $args['idempotency_key'],
			'payment_method_id'       => isset( $approval['payment_method_id'] ) ? (string) $approval['payment_method_id'] : self::get_first_string_value( $args['prepared_campaign'], array( 'payment_method_id' ) ),
			'accepted_terms_version'  => isset( $approval['accepted_terms_version'] ) ? (string) $approval['accepted_terms_version'] : (string) $args['accepted_terms_version'],
			'accepted_policy_version' => isset( $approval['accepted_policy_version'] ) ? (string) $approval['accepted_policy_version'] : (string) $args['accepted_policy_version'],
			'approved_at'             => isset( $approval['approved_at'] ) ? (string) $approval['approved_at'] : '',
		);
	}

	/**
	 * Preview or confirm stopping a Blaze campaign from serving.
	 *
	 * Preview mode fetches current campaign context and returns consequence
	 * text without calling the DSP stop endpoint. Confirm mode re-fetches the
	 * same context, then delegates stop eligibility and state handling to DSP.
	 *
	 * @param array $args Ability input — see `get_abilities()` input_schema.
	 * @return array|\WP_Error
	 */
	public static function stop_campaign( $args = array() ) {
		$args = is_array( $args ) ? $args : array();

		$campaign_id = isset( $args['campaign_id'] ) ? (int) $args['campaign_id'] : 0;
		if ( $campaign_id < 1 ) {
			return new \WP_Error(
				'blaze_invalid_campaign_id',
				__( 'A numeric DSP campaign_id is required to stop a Blaze campaign.', 'jetpack-blaze' ),
				array( 'status' => 400 )
			);
		}

		$context = self::fetch_stop_campaign_context( $campaign_id );
		if ( is_wp_error( $context ) ) {
			return $context;
		}

		$campaign    = self::normalize_stop_campaign_context( $campaign_id, $context );
		$consequence = self::build_stop_campaign_consequence( $campaign );
		$confirmed   = isset( $args['confirm'] ) && true === $args['confirm'];

		if ( ! $confirmed ) {
			return array(
				'status'      => 'pending_confirmation',
				'message'     => self::format_stop_campaign_preview_message( $campaign, $consequence ),
				'campaign'    => $campaign,
				'consequence' => $consequence,
			);
		}

		$stop_response = self::call_stop_campaign_endpoint( $campaign_id );
		if ( is_wp_error( $stop_response ) ) {
			return $stop_response;
		}

		return array(
			'status'        => 'stopped',
			'message'       => self::format_stop_campaign_confirmation_message( $campaign ),
			'campaign'      => $campaign,
			'consequence'   => __( 'The campaign was stopped from serving immediately.', 'jetpack-blaze' ),
			'stop_response' => $stop_response,
		);
	}

	/**
	 * Fetch current campaign context through the existing Blaze proxy route.
	 *
	 * @param int $campaign_id Numeric DSP campaign ID.
	 * @return array|\WP_Error
	 */
	private static function fetch_stop_campaign_context( int $campaign_id ) {
		$route = self::get_dsp_campaign_route( $campaign_id );
		if ( is_wp_error( $route ) ) {
			return $route;
		}

		$request = new WP_REST_Request( 'GET', $route );
		return self::dispatch_stop_campaign_rest_request( $request );
	}

	/**
	 * Call the existing DSP stop endpoint through the Blaze proxy route.
	 *
	 * @param int $campaign_id Numeric DSP campaign ID.
	 * @return array|\WP_Error
	 */
	private static function call_stop_campaign_endpoint( int $campaign_id ) {
		$route = self::get_dsp_campaign_route( $campaign_id, '/stop' );
		if ( is_wp_error( $route ) ) {
			return $route;
		}

		$request = new WP_REST_Request( 'POST', $route );
		return self::dispatch_stop_campaign_rest_request( $request );
	}

	/**
	 * Build the local REST proxy route for prepared campaign submit.
	 *
	 * @return string|\WP_Error
	 */
	private static function get_dsp_submit_prepared_campaign_route() {
		$site_id = \Automattic\Jetpack\Connection\Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		return sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1.1/campaigns/submit-prepared-campaign', $site_id );
	}

	/**
	 * Build the local REST proxy route for a DSP campaign endpoint.
	 *
	 * @param int    $campaign_id Numeric DSP campaign ID.
	 * @param string $suffix      Optional subpath suffix, e.g. /stop.
	 * @return string|\WP_Error
	 */
	private static function get_dsp_campaign_route( int $campaign_id, string $suffix = '' ) {
		$site_id = \Automattic\Jetpack\Connection\Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		return sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1.1/campaigns/%d%s', $site_id, $campaign_id, $suffix );
	}

	/**
	 * Dispatch a stop-campaign REST proxy request and normalize error output.
	 *
	 * @param WP_REST_Request $request Request to dispatch.
	 * @return array|\WP_Error
	 */
	private static function dispatch_stop_campaign_rest_request( WP_REST_Request $request ) {
		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return $response->as_error();
		}

		$status = $response->get_status();
		$data   = $response->get_data();
		if ( $status >= 400 ) {
			return self::rest_response_to_wp_error( is_array( $data ) ? $data : array(), $status );
		}

		return is_array( $data ) ? $data : array();
	}

	/**
	 * Convert non-2xx REST proxy responses into WP_Error for Abilities/MCP.
	 *
	 * @param array $data   REST response data.
	 * @param int   $status HTTP status.
	 * @return \WP_Error
	 */
	private static function rest_response_to_wp_error( array $data, int $status ): \WP_Error {
		$code = isset( $data['code'] ) ? (string) $data['code'] : 'blaze_dsp_error';

		$message = '';
		foreach ( array( 'message', 'errorMessage', 'error' ) as $message_key ) {
			if ( isset( $data[ $message_key ] ) && '' !== (string) $data[ $message_key ] ) {
				$message = (string) $data[ $message_key ];
				break;
			}
		}
		if ( '' === $message ) {
				$message = __( 'The Blaze DSP API could not complete this campaign request.', 'jetpack-blaze' );
			}

		$data['status'] = $status;
		return new \WP_Error( $code, $message, $data );
	}

	/**
	 * Decorate DSP submit response with chat-safe pending confirmation copy.
	 *
	 * @param array $submit_response Raw DSP submit response.
	 * @return array
	 */
	private static function format_submit_prepared_campaign_response( array $submit_response ): array {
		$dashboard_url = self::get_first_string_value( $submit_response, array( 'dashboard_url', 'widget_url' ) );
		$widget_url    = self::get_first_string_value( $submit_response, array( 'widget_url', 'dashboard_url' ) );

		return array(
			'status'                  => 'submitted_pending_approval',
			'message'                 => self::build_submit_prepared_campaign_message( $submit_response, $dashboard_url ),
			'campaign_status'         => self::get_first_string_value( $submit_response, array( 'campaign_status', 'status' ) ),
			'dashboard_url'           => $dashboard_url,
			'widget_url'              => $widget_url,
			'selected_payment_method' => isset( $submit_response['selected_payment_method'] ) && is_array( $submit_response['selected_payment_method'] ) ? $submit_response['selected_payment_method'] : array(),
			'budget'                  => isset( $submit_response['budget'] ) && is_array( $submit_response['budget'] ) ? $submit_response['budget'] : array(),
			'source_tracking'         => isset( $submit_response['source_tracking'] ) && is_array( $submit_response['source_tracking'] ) ? $submit_response['source_tracking'] : array(),
			'submit_response'         => $submit_response,
		);
	}

	/**
	 * Build chat-facing submit confirmation.
	 *
	 * @param array  $submit_response Raw DSP submit response.
	 * @param string $dashboard_url   Dashboard URL, when available.
	 * @return string
	 */
	private static function build_submit_prepared_campaign_message( array $submit_response, string $dashboard_url ): string {
		$campaign_id = self::get_first_string_value( $submit_response, array( 'id', 'campaign_id' ) );

		$message = __( 'Your Blaze campaign has been submitted and is pending approval/moderation. It is not running yet.', 'jetpack-blaze' );
		if ( '' !== $campaign_id ) {
			$message .= "\n\n" . sprintf(
				/* translators: %s: campaign ID. */
				__( 'Campaign ID: %s', 'jetpack-blaze' ),
				$campaign_id
			);
		}
		if ( '' !== $dashboard_url ) {
			$message .= "\n\n" . sprintf(
				/* translators: %s: Blaze dashboard URL. */
				__( 'You can view it in Blaze here: %s', 'jetpack-blaze' ),
				$dashboard_url
			);
		}

		$message .= "\n\n" . __( 'You should also receive the normal email confirmation for this campaign.', 'jetpack-blaze' );
		return $message;
	}

	/**
	 * Normalize the DSP campaign shape into the MCP-facing context fields.
	 *
	 * @param int   $campaign_id Numeric DSP campaign ID requested by the caller.
	 * @param array $context     Raw DSP campaign context.
	 * @return array
	 */
	private static function normalize_stop_campaign_context( int $campaign_id, array $context ): array {
		$campaign = isset( $context['campaign'] ) && is_array( $context['campaign'] ) ? $context['campaign'] : $context;

		return array(
			'campaign_id' => self::get_first_integer_value( $campaign, array( 'campaign_id', 'id' ), $campaign_id ),
			'title'       => self::get_first_string_value( $campaign, array( 'title', 'name', 'campaign_name' ) ),
			'status'      => self::get_first_string_value( $campaign, array( 'status', 'state' ) ),
			'start_date'  => self::get_first_string_value( $campaign, array( 'start_date', 'startDate', 'start_at', 'startAt', 'start' ) ),
			'end_date'    => self::get_first_string_value( $campaign, array( 'end_date', 'endDate', 'end_at', 'endAt', 'end' ) ),
			'target_url'  => self::get_first_string_value( $campaign, array( 'target_url', 'targetUrl', 'destination_url', 'destinationUrl', 'landing_page', 'landingPage', 'url' ) ),
			'target_urn'  => self::get_first_string_value( $campaign, array( 'target_urn', 'targetUrn', 'urn' ) ),
		);
	}

	/**
	 * Return the first non-empty string value for a set of keys.
	 *
	 * @param array $source Source array.
	 * @param array $keys   Candidate keys.
	 * @return string
	 */
	private static function get_first_string_value( array $source, array $keys ): string {
		foreach ( $keys as $key ) {
			if ( isset( $source[ $key ] ) && '' !== (string) $source[ $key ] ) {
				return (string) $source[ $key ];
			}
		}

		if ( isset( $source['target'] ) && is_array( $source['target'] ) ) {
			foreach ( $keys as $key ) {
				if ( isset( $source['target'][ $key ] ) && '' !== (string) $source['target'][ $key ] ) {
					return (string) $source['target'][ $key ];
				}
			}
		}

		return '';
	}

	/**
	 * Return the first positive integer value for a set of keys.
	 *
	 * @param array $source  Source array.
	 * @param array $keys    Candidate keys.
	 * @param int   $default Default value.
	 * @return int
	 */
	private static function get_first_integer_value( array $source, array $keys, int $default ): int {
		foreach ( $keys as $key ) {
			if ( isset( $source[ $key ] ) && (int) $source[ $key ] > 0 ) {
				return (int) $source[ $key ];
			}
		}

		return $default;
	}

	/**
	 * Build consequence text for preview mode.
	 *
	 * @param array $campaign Normalized campaign context.
	 * @return string
	 */
	private static function build_stop_campaign_consequence( array $campaign ): string {
		return sprintf(
			/* translators: %s: campaign title or ID. */
			__( 'If confirmed, campaign "%s" will be stopped from serving immediately. This MCP tool cannot resume the campaign after it is stopped.', 'jetpack-blaze' ),
			self::get_stop_campaign_display_name( $campaign )
		);
	}

	/**
	 * Format the preview response for chat clients.
	 *
	 * @param array  $campaign    Normalized campaign context.
	 * @param string $consequence Consequence text.
	 * @return string
	 */
	private static function format_stop_campaign_preview_message( array $campaign, string $consequence ): string {
		$message  = __( 'Preview only: this campaign has not been stopped.', 'jetpack-blaze' ) . "\n\n";
		$message .= self::format_stop_campaign_context_table( $campaign );
		$message .= "\n" . $consequence;
		$message .= "\n\n" . __( 'To stop serving, call this ability again with confirm set to true after the merchant explicitly confirms.', 'jetpack-blaze' );

		return $message;
	}

	/**
	 * Format the confirmation response for chat clients.
	 *
	 * @param array $campaign Normalized campaign context.
	 * @return string
	 */
	private static function format_stop_campaign_confirmation_message( array $campaign ): string {
		return sprintf(
			/* translators: %s: campaign title or ID. */
			__( 'Campaign "%s" was stopped from serving.', 'jetpack-blaze' ),
			self::get_stop_campaign_display_name( $campaign )
		);
	}

	/**
	 * Format normalized campaign context as a compact Markdown table.
	 *
	 * @param array $campaign Normalized campaign context.
	 * @return string
	 */
	private static function format_stop_campaign_context_table( array $campaign ): string {
		$message  = '| ' . __( 'Campaign', 'jetpack-blaze' ) . ' | ' . __( 'Current value', 'jetpack-blaze' ) . " |\n";
		$message .= "| --- | --- |\n";

		$rows = array(
			__( 'ID', 'jetpack-blaze' )         => $campaign['campaign_id'] ?? '',
			__( 'Title', 'jetpack-blaze' )      => $campaign['title'] ?? '',
			__( 'Status', 'jetpack-blaze' )     => $campaign['status'] ?? '',
			__( 'Start date', 'jetpack-blaze' ) => $campaign['start_date'] ?? '',
			__( 'End date', 'jetpack-blaze' )   => $campaign['end_date'] ?? '',
			__( 'Target URL', 'jetpack-blaze' ) => $campaign['target_url'] ?? '',
			__( 'Target URN', 'jetpack-blaze' ) => $campaign['target_urn'] ?? '',
		);

		foreach ( $rows as $label => $value ) {
			if ( '' === (string) $value ) {
				continue;
			}
			$message .= '| ' . self::format_markdown_table_cell( $label ) . ' | ' . self::format_markdown_table_cell( $value ) . " |\n";
		}

		return rtrim( $message, "\n" );
	}

	/**
	 * Human-readable campaign name fallback.
	 *
	 * @param array $campaign Normalized campaign context.
	 * @return string
	 */
	private static function get_stop_campaign_display_name( array $campaign ): string {
		if ( ! empty( $campaign['title'] ) ) {
			return (string) $campaign['title'];
		}

		return sprintf(
			/* translators: %d: numeric DSP campaign ID. */
			__( 'Campaign %d', 'jetpack-blaze' ),
			(int) ( $campaign['campaign_id'] ?? 0 )
		);
	}

	/**
	 * Build structured preview values for clients that do not want to parse the
	 * raw widget prefill payload.
	 *
	 * @param array $proposal Structured campaign proposal.
	 * @return array
	 */
	private static function build_campaign_preview( array $proposal ): array {
		$prefill = isset( $proposal['prefill'] ) && is_array( $proposal['prefill'] ) ? $proposal['prefill'] : array();
		$budget  = isset( $prefill['budget'] ) && is_array( $prefill['budget'] ) ? $prefill['budget'] : array();

		$budget_amount   = isset( $budget['amount'] ) ? (float) $budget['amount'] : 0.0;
		$budget_currency = isset( $budget['currency'] ) ? (string) $budget['currency'] : 'USD';
		$duration_days   = isset( $prefill['duration_days'] ) ? max( 1, (int) $prefill['duration_days'] ) : 1;

		return array(
			'ad_heading'     => isset( $prefill['site_name'] ) ? (string) $prefill['site_name'] : '',
			'ad_copy'        => isset( $prefill['text_snippet'] ) ? (string) $prefill['text_snippet'] : '',
			'call_to_action' => isset( $prefill['cta_text'] ) ? (string) $prefill['cta_text'] : '',
			'objective'      => self::format_objective( isset( $prefill['objective'] ) ? (string) $prefill['objective'] : '' ),
			'budget'         => sprintf(
				/* translators: 1: formatted currency amount, 2: formatted daily currency amount. */
				__( '%1$s total (%2$s/day)', 'jetpack-blaze' ),
				self::format_currency_amount( $budget_amount, $budget_currency ),
				self::format_currency_amount( $budget_amount / $duration_days, $budget_currency )
			),
			'duration'       => self::format_days( $duration_days ),
			'schedule'       => ! isset( $prefill['is_evergreen'] ) || (bool) $prefill['is_evergreen']
				? __( 'Run until the merchant stops it', 'jetpack-blaze' )
				: __( 'Run for the selected duration', 'jetpack-blaze' ),
			'audience'       => self::format_audience_summary( $prefill ),
			'landing_page'   => isset( $prefill['target_url'] ) ? (string) $prefill['target_url'] : '',
		);
	}

	/**
	 * Format the prepare-campaign response as adapter-owned Markdown for chat
	 * clients.
	 *
	 * @param array $proposal Structured campaign proposal.
	 * @return string
	 */
	private static function format_prepare_campaign_message( array $proposal ): string {
		$preview          = self::build_campaign_preview( $proposal );
		$forecast_summary = self::build_forecast_summary( $proposal );
		$message          = __( 'Campaign proposal prepared for review in Blaze.', 'jetpack-blaze' ) . "\n\n";

		$message .= '| ' . __( 'Campaign preview', 'jetpack-blaze' ) . ' | ' . __( 'Prepared value', 'jetpack-blaze' ) . " |\n";
		$message .= "| --- | --- |\n";

		$rows = array(
			array(
				'label' => __( 'Ad heading', 'jetpack-blaze' ),
				'value' => $preview['ad_heading'],
			),
			array(
				'label' => __( 'Ad copy', 'jetpack-blaze' ),
				'value' => $preview['ad_copy'],
			),
			array(
				'label' => __( 'Call to action', 'jetpack-blaze' ),
				'value' => $preview['call_to_action'],
			),
			array(
				'label' => __( 'Objective', 'jetpack-blaze' ),
				'value' => $preview['objective'],
			),
			array(
				'label' => __( 'Budget', 'jetpack-blaze' ),
				'value' => $preview['budget'],
			),
			array(
				'label' => __( 'Duration', 'jetpack-blaze' ),
				'value' => $preview['duration'],
			),
			array(
				'label' => __( 'Schedule', 'jetpack-blaze' ),
				'value' => $preview['schedule'],
			),
			array(
				'label' => __( 'Audience', 'jetpack-blaze' ),
				'value' => $preview['audience'],
			),
			array(
				'label' => __( 'Landing page', 'jetpack-blaze' ),
				'value' => $preview['landing_page'],
			),
		);

		foreach ( $rows as $row ) {
			$message .= '| ' . self::format_markdown_table_cell( $row['label'] ) . ' | ' . self::format_markdown_table_cell( $row['value'] ) . " |\n";
		}

		$message .= "\n" . __( 'Forecast:', 'jetpack-blaze' ) . ' ' . $forecast_summary . "\n";

		if ( ! empty( $proposal['budget_options'] ) && is_array( $proposal['budget_options'] ) ) {
			$message .= "\n" . __( 'Budget options:', 'jetpack-blaze' ) . "\n";
			$message .= '| ' . __( 'Option', 'jetpack-blaze' ) . ' | ' . __( 'Total budget', 'jetpack-blaze' ) . ' | ' . __( 'Daily budget', 'jetpack-blaze' ) . ' | ' . __( 'Duration', 'jetpack-blaze' ) . ' | ' . __( 'Recommendation', 'jetpack-blaze' ) . " |\n";
			$message .= "| --- | --- | --- | --- | --- |\n";

			foreach ( $proposal['budget_options'] as $option ) {
				if ( ! is_array( $option ) ) {
					continue;
				}

				$budget         = isset( $option['budget'] ) && is_array( $option['budget'] ) ? $option['budget'] : array();
				$daily_budget   = isset( $option['daily_budget'] ) && is_array( $option['daily_budget'] ) ? $option['daily_budget'] : array();
				$currency       = isset( $budget['currency'] ) ? (string) $budget['currency'] : 'USD';
				$daily_currency = isset( $daily_budget['currency'] ) ? (string) $daily_budget['currency'] : $currency;

				$message .= '| ' . self::format_markdown_table_cell( $option['label'] ?? '' );
				$message .= ' | ' . self::format_markdown_table_cell( self::format_currency_amount( isset( $budget['amount'] ) ? (float) $budget['amount'] : 0.0, $currency ) );
				$message .= ' | ' . self::format_markdown_table_cell( self::format_currency_amount( isset( $daily_budget['amount'] ) ? (float) $daily_budget['amount'] : 0.0, $daily_currency ) );
				$message .= ' | ' . self::format_markdown_table_cell( self::format_days( isset( $option['duration_days'] ) ? (int) $option['duration_days'] : 1 ) );
				$message .= ' | ' . self::format_markdown_table_cell( $option['rationale'] ?? '' ) . " |\n";
			}
		}

		$message .= self::format_text_list( __( 'Assumptions:', 'jetpack-blaze' ), $proposal['assumptions'] ?? array() );
		$message .= self::format_text_list( __( 'Recommendations:', 'jetpack-blaze' ), $proposal['recommendations'] ?? array() );
		$message .= "\n" . __( 'Review URL:', 'jetpack-blaze' ) . ' ' . (string) ( $proposal['prefill_url'] ?? '' );

		return $message;
	}

	/**
	 * Build a compact human-readable forecast sentence.
	 *
	 * @param array $proposal Structured campaign proposal.
	 * @return string
	 */
	private static function build_forecast_summary( array $proposal ): string {
		$forecast = isset( $proposal['forecast'] ) && is_array( $proposal['forecast'] ) ? $proposal['forecast'] : array();
		if ( 'available' !== ( $forecast['status'] ?? '' ) ) {
			return isset( $forecast['message'] ) && '' !== (string) $forecast['message']
				? (string) $forecast['message']
				: __( 'Forecast estimates are unavailable, but the campaign proposal can still be reviewed in Blaze.', 'jetpack-blaze' );
		}

		$primary_metric   = isset( $forecast['primary_metric'] ) ? (string) $forecast['primary_metric'] : 'views';
		$secondary_metric = isset( $forecast['secondary_metric'] ) ? (string) $forecast['secondary_metric'] : 'clicks';

		return sprintf(
			/* translators: 1: primary metric range, 2: primary metric label, 3: secondary metric range, 4: secondary metric label. */
			__( 'Estimated %1$s %2$s and %3$s %4$s for the recommended option.', 'jetpack-blaze' ),
			self::format_metric_range( isset( $forecast[ $primary_metric ] ) && is_array( $forecast[ $primary_metric ] ) ? $forecast[ $primary_metric ] : array() ),
			self::format_metric_label( $primary_metric ),
			self::format_metric_range( isset( $forecast[ $secondary_metric ] ) && is_array( $forecast[ $secondary_metric ] ) ? $forecast[ $secondary_metric ] : array() ),
			self::format_metric_label( $secondary_metric )
		);
	}

	/**
	 * Format an array of natural-language strings as a Markdown list.
	 *
	 * @param string $heading List heading.
	 * @param mixed  $items   List items.
	 * @return string
	 */
	private static function format_text_list( string $heading, $items ): string {
		if ( empty( $items ) || ! is_array( $items ) ) {
			return '';
		}

		$message = "\n\n" . $heading . "\n";
		foreach ( $items as $item ) {
			$message .= '- ' . str_replace( array( "\r\n", "\r", "\n" ), ' ', (string) $item ) . "\n";
		}

		return rtrim( $message, "\n" );
	}

	/**
	 * Format a value for safe use inside a Markdown table cell.
	 *
	 * @param mixed $value Cell value.
	 * @return string
	 */
	private static function format_markdown_table_cell( $value ): string {
		$value = str_replace( array( "\r\n", "\r", "\n" ), ' ', (string) $value );
		return str_replace( '|', '\\|', $value );
	}

	/**
	 * Format a currency amount.
	 *
	 * @param float  $amount   Amount.
	 * @param string $currency ISO 4217 currency code.
	 * @return string
	 */
	private static function format_currency_amount( float $amount, string $currency ): string {
		return sprintf( '%s %s', strtoupper( $currency ), number_format_i18n( $amount, 2 ) );
	}

	/**
	 * Format campaign duration.
	 *
	 * @param int $days Duration in days.
	 * @return string
	 */
	private static function format_days( int $days ): string {
		$days = max( 1, $days );
		return sprintf(
			/* translators: %d: number of campaign days. */
			_n( '%d day', '%d days', $days, 'jetpack-blaze' ),
			$days
		);
	}

	/**
	 * Format the server-owned objective for display.
	 *
	 * @param string $objective DSP objective code.
	 * @return string
	 */
	private static function format_objective( string $objective ): string {
		if ( 'CLICKS' === strtoupper( $objective ) ) {
			return __( 'Clicks', 'jetpack-blaze' );
		}
		if ( 'VIEWS' === strtoupper( $objective ) ) {
			return __( 'Views', 'jetpack-blaze' );
		}
		return '' === $objective ? __( 'Not specified', 'jetpack-blaze' ) : $objective;
	}

	/**
	 * Format a forecast metric range.
	 *
	 * @param array $range Metric range with min/max values.
	 * @return string
	 */
	private static function format_metric_range( array $range ): string {
		$min = isset( $range['min'] ) ? (int) $range['min'] : 0;
		$max = isset( $range['max'] ) ? (int) $range['max'] : $min;

		if ( $min === $max ) {
			return number_format_i18n( $min );
		}

		return number_format_i18n( $min ) . '-' . number_format_i18n( $max );
	}

	/**
	 * Format a forecast metric label.
	 *
	 * @param string $metric Metric code.
	 * @return string
	 */
	private static function format_metric_label( string $metric ): string {
		if ( 'clicks' === $metric ) {
			return __( 'clicks', 'jetpack-blaze' );
		}
		return __( 'views', 'jetpack-blaze' );
	}

	/**
	 * Summarize audience overrides without exposing implementation-shaped JSON.
	 *
	 * @param array $prefill Prefill payload.
	 * @return string
	 */
	private static function format_audience_summary( array $prefill ): string {
		$parts = array();

		$parts[] = empty( $prefill['countries'] ) ? __( 'all locations', 'jetpack-blaze' ) : sprintf(
			/* translators: %s: comma-separated country codes. */
			__( 'countries: %s', 'jetpack-blaze' ),
			implode( ', ', array_map( 'strval', (array) $prefill['countries'] ) )
		);
		$parts[] = empty( $prefill['languages'] ) ? __( 'all languages', 'jetpack-blaze' ) : sprintf(
			/* translators: %s: comma-separated language codes. */
			__( 'languages: %s', 'jetpack-blaze' ),
			implode( ', ', array_map( 'strval', (array) $prefill['languages'] ) )
		);
		$parts[] = empty( $prefill['devices'] ) ? __( 'all devices', 'jetpack-blaze' ) : sprintf(
			/* translators: %s: comma-separated device codes. */
			__( 'devices: %s', 'jetpack-blaze' ),
			implode( ', ', array_map( 'strval', (array) $prefill['devices'] ) )
		);

		if ( ! empty( $prefill['page_topics'] ) ) {
			$parts[] = sprintf(
				/* translators: %s: comma-separated page topic codes. */
				__( 'topics: %s', 'jetpack-blaze' ),
				implode( ', ', array_map( 'strval', (array) $prefill['page_topics'] ) )
			);
		}

		return implode( '; ', $parts );
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

		$args['execute_callback'] = static function ( $input = array() ) use ( $ability_name, $original_callback ) {
			if ( self::ABILITY_PREPARE_CAMPAIGN === $ability_name ) {
				self::record_prepare_campaign_event( 'called', is_array( $input ) ? $input : array() );
			}

			$tos_check = self::check_tos_and_payment();
			if ( is_wp_error( $tos_check ) ) {
				if ( self::ABILITY_PREPARE_CAMPAIGN === $ability_name ) {
					self::record_prepare_campaign_event( 'failed', is_array( $input ) ? $input : array(), $tos_check );
				}
				return $tos_check;
			}

			// Future write-path guardrails (per-session spend ceiling, Picard
			// moderation gating) plug in here. Tracked separately as ADS-989.

			$payment_methods_filter = null;
			if ( self::ABILITY_PREPARE_CAMPAIGN === $ability_name ) {
				$payment_methods        = self::get_prepare_campaign_payment_methods();
				$payment_methods_filter = static function () use ( $payment_methods ) {
					return $payment_methods;
				};
				add_filter( 'jetpack_blaze_prepare_campaign_payment_methods', $payment_methods_filter );
			}

			try {
				$result = call_user_func( $original_callback, $input );
			} finally {
				if ( null !== $payment_methods_filter ) {
					remove_filter( 'jetpack_blaze_prepare_campaign_payment_methods', $payment_methods_filter );
				}
			}

			if ( self::ABILITY_PREPARE_CAMPAIGN === $ability_name ) {
				self::record_prepare_campaign_event( is_wp_error( $result ) ? 'failed' : 'succeeded', is_array( $input ) ? $input : array(), $result );
			}

			return $result;
		};

		return $args;
	}

	/**
	 * Fetch usable saved payment methods through the existing Blaze REST proxy.
	 *
	 * @return array|null
	 */
	private static function get_prepare_campaign_payment_methods() {
		$site_id = Jetpack_Connection::get_site_id();
		if ( is_wp_error( $site_id ) || ! $site_id ) {
			return null;
		}

		$route   = sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1.1/payment-methods', (int) $site_id );
		$request = new WP_REST_Request( 'GET', $route );

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			return null;
		}

		return self::extract_payment_methods_response( $response->get_data() );
	}

	/**
	 * Extract a payment-method list from known DSP response shapes.
	 *
	 * @param mixed $data REST response data.
	 * @return array|null
	 */
	private static function extract_payment_methods_response( $data ) {
		if ( ! is_array( $data ) ) {
			return null;
		}

		if ( self::is_list_array( $data ) ) {
			return $data;
		}

		foreach ( array( 'payment_methods', 'paymentMethods', 'methods', 'data' ) as $key ) {
			if ( isset( $data[ $key ] ) && is_array( $data[ $key ] ) ) {
				return $data[ $key ];
			}
		}

		return null;
	}

	/**
	 * Polyfill array_is_list() for the package PHP support floor.
	 *
	 * @param array $array Array to inspect.
	 * @return bool
	 */
	private static function is_list_array( array $array ): bool {
		if ( array() === $array ) {
			return true;
		}

		return array_keys( $array ) === range( 0, count( $array ) - 1 );
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
	 * Record safe server-side telemetry for prepare-campaign.
	 *
	 * Never records caller prompts, ad copy, URLs, or the full prefill payload.
	 * Keep properties deliberately low-cardinality so MCP and direct REST calls
	 * are useful in aggregate without carrying merchant-sensitive data.
	 *
	 * @param string          $result  called|succeeded|failed.
	 * @param array           $input   Ability input.
	 * @param array|\WP_Error $outcome Optional callback result.
	 * @return void
	 */
	private static function record_prepare_campaign_event( string $result, array $input, $outcome = null ): void {
		$props = array(
			'result'            => in_array( $result, array( 'called', 'succeeded', 'failed' ), true ) ? $result : 'unknown',
			'target_type'       => self::get_prepare_campaign_target_type( $outcome ),
			'inferred_intent'   => self::get_prepare_campaign_intent( $outcome ),
			'budget_provided'   => array_key_exists( 'budget_total', $input ),
			'duration_provided' => array_key_exists( 'duration_days', $input ),
		);

		if ( is_wp_error( $outcome ) ) {
			$props['failure_category'] = self::get_prepare_campaign_failure_category( $outcome );
		}

		$event = array(
			'name'  => 'blaze_prepare_campaign_' . $props['result'],
			'props' => $props,
		);

		/**
		 * Filters the prepare-campaign Tracks event before it is emitted.
		 *
		 * Returning false prevents emission. Primarily useful for tests and for
		 * emergency suppression if the event contract ever needs to be disabled.
		 *
		 * @since $$next-version$$
		 *
		 * @param array|false     $event   Event name and safe props, or false to suppress.
		 * @param string          $result  called|succeeded|failed.
		 * @param array           $input   Ability input.
		 * @param array|\WP_Error $outcome Optional callback result.
		 */
		$event = apply_filters( 'jetpack_blaze_prepare_campaign_tracks_event', $event, $result, $input, $outcome );
		if ( false === $event || ! is_array( $event ) || empty( $event['name'] ) || ! isset( $event['props'] ) || ! is_array( $event['props'] ) ) {
			return;
		}

		$tracking = new Tracking( 'jetpack' );
		$tracking->record_user_event( (string) $event['name'], $event['props'] );
	}

	/**
	 * Get the safe target type from a successful prepare outcome.
	 *
	 * @param mixed $outcome Callback result.
	 * @return string
	 */
	private static function get_prepare_campaign_target_type( $outcome ): string {
		$target_type = is_array( $outcome ) && isset( $outcome['prefill']['type'] ) ? (string) $outcome['prefill']['type'] : 'unknown';
		return in_array( $target_type, array( 'post', 'page', 'product' ), true ) ? $target_type : 'unknown';
	}

	/**
	 * Get the safe inferred intent from a successful prepare outcome.
	 *
	 * @param mixed $outcome Callback result.
	 * @return string
	 */
	private static function get_prepare_campaign_intent( $outcome ): string {
		$intent = is_array( $outcome ) && isset( $outcome['intent'] ) ? (string) $outcome['intent'] : 'unknown';
		return in_array( $intent, array( 'ecommerce', 'content', 'unknown' ), true ) ? $intent : 'unknown';
	}

	/**
	 * Map error codes to low-cardinality failure categories.
	 *
	 * @param \WP_Error $error Error returned by the prepare path.
	 * @return string
	 */
	private static function get_prepare_campaign_failure_category( \WP_Error $error ): string {
		switch ( $error->get_error_code() ) {
			case 'blaze_invalid_target_urn':
			case 'blaze_missing_target':
			case 'blaze_ambiguous_target':
				return 'invalid_target';
			case 'blaze_site_lookup_failed':
			case 'blaze_site_not_connected':
				return 'site_lookup_failed';
			case 'blaze_post_not_found':
				return 'target_not_found';
			case 'blaze_setup_required':
				return 'setup_required';
			default:
				return 'prepare_failed';
		}
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
