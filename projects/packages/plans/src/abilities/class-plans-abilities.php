<?php
/**
 * Jetpack Plans Abilities Registration
 *
 * Registers Jetpack Plans abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-plans
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Plans\Abilities;

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Plans;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\WP_Abilities\Registrar;

/**
 * Registers Jetpack Plans abilities with the WordPress Abilities API.
 *
 * Exposes two read-only abilities so AI agents can inspect the site's active
 * Jetpack plan and enumerate the Jetpack plans the site could move to. Both
 * abilities are idempotent and free of side effects.
 */
class Plans_Abilities extends Registrar {

	/**
	 * Category slug for all Plans abilities.
	 *
	 * Shared with the rest of the Jetpack plugin's abilities (modules, etc.)
	 * so everything groups under a single "jetpack" category in the
	 * Abilities API surface.
	 */
	const CATEGORY_SLUG = 'jetpack';

	/**
	 * Accepted category filter values for list-plans.
	 */
	const PLAN_CATEGORIES = array( 'all', 'security', 'performance' );

	/**
	 * Plan slugs that count as "security"-category plans for list-plans filtering.
	 *
	 * Mirrors the membership of {@see Current_Plan::PLAN_DATA}'s `security`
	 * bucket, which is the canonical Jetpack-side enumeration.
	 */
	private static function security_plan_slugs(): array {
		$data = Current_Plan::PLAN_DATA['security'] ?? array( 'plans' => array() );
		return isset( $data['plans'] ) && is_array( $data['plans'] ) ? $data['plans'] : array();
	}

	/**
	 * Whether a catalog product slug belongs to a Jetpack plan.
	 *
	 * Every Jetpack plan WordPress.com sells has a `jetpack_`-prefixed
	 * product slug (jetpack_free, jetpack_personal, jetpack_security_t1_yearly,
	 * jetpack_complete, …) — this is the same set wpcom groups under
	 * Store_Product_List::get_active_jetpack_plans(). Non-Jetpack WordPress.com
	 * hosting plans use unprefixed slugs (value_bundle, business-bundle, …),
	 * so the prefix check cleanly separates the two.
	 *
	 * @param string $slug Catalog `product_slug`.
	 * @return bool
	 */
	private static function is_jetpack_plan_slug( string $slug ): bool {
		return 0 === strpos( $slug, 'jetpack_' );
	}

	/**
	 * Whether a catalog plan can still be purchased.
	 *
	 * WordPress.com keeps discontinued/legacy plans in the catalog so existing
	 * subscribers retain them, flagging them with the Store_Product `available`
	 * field — documented upstream as "If the product is sellable, this will be
	 * 'yes'." We treat the field strictly: only an explicit `yes` keeps a plan,
	 * so legacy plans (jetpack_business, jetpack_personal, the daily/realtime
	 * security plans, …) drop out without hardcoding a list that would rot.
	 *
	 * @param object|array $plan Plan entry from the WP.com catalog.
	 * @return bool
	 */
	private static function is_purchasable_plan( $plan ): bool {
		$available = self::read_field( $plan, 'available' );
		return is_string( $available ) && 'yes' === strtolower( $available );
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack" is a product name and should not be translated.
			'label'       => 'Jetpack',
			'description' => __( 'Abilities exposed by the Jetpack plugin.', 'jetpack-plans' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-plans/get-current-plan' => self::spec_get_current_plan(),
			'jetpack-plans/list-plans'       => self::spec_list_plans(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-plans/get-current-plan.
	 */
	private static function spec_get_current_plan(): array {
		return array(
			'label'               => __( 'Get the site\'s current Jetpack plan', 'jetpack-plans' ),
			'description'         => __( 'Return the active Jetpack plan as { slug, name, class, product_id, expires_at, features, supports }. slug is the canonical product slug (e.g. "jetpack_free", "jetpack_security_t1_yearly"); class is the coarse tier (free/personal/premium/security/business/complete); features is the active-features list reported by WordPress.com for the site; supports is the full list of feature flags the plan unlocks (used by Current_Plan::supports()). expires_at is the ISO-8601 expiry timestamp, or null when the plan has no expiry (e.g. free). Read-only, idempotent, zero arguments. Pair with jetpack-plans/list-plans to see what other plans the site could move to.', 'jetpack-plans' ),
			'input_schema'        => array(
				'type'                 => 'object',
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'slug'       => array( 'type' => 'string' ),
					'name'       => array( 'type' => array( 'string', 'null' ) ),
					'class'      => array( 'type' => 'string' ),
					'product_id' => array( 'type' => array( 'integer', 'null' ) ),
					'expires_at' => array( 'type' => array( 'string', 'null' ) ),
					'features'   => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
					'supports'   => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_current_plan' ),
			'permission_callback' => array( __CLASS__, 'can_view_plans' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Spec: jetpack-plans/list-plans.
	 */
	private static function spec_list_plans(): array {
		return array(
			'label'               => __( 'List available Jetpack plans', 'jetpack-plans' ),
			'description'         => __( 'Enumerate the Jetpack plans the site could move to as a list of { slug, name, monthly_price, currency, features, upgrade_url } objects. The catalog comes from WordPress.com and is filtered to Jetpack plans that can still be purchased — non-Jetpack WordPress.com hosting plans and discontinued/legacy Jetpack plans (e.g. jetpack_business) are excluded. Optional `category` filter narrows it further: "security" returns only Jetpack Security plans; "performance" is currently a synonym for the full Jetpack catalog (Jetpack does not publish a separate performance bucket); "all" (default) returns every Jetpack plan. monthly_price is the recurring price normalized to a single month for comparison; currency is an ISO-4217 code (e.g. "USD"); upgrade_url is the WordPress.com checkout URL for that plan. Read-only.', 'jetpack-plans' ),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'category' => array(
						'type'        => 'string',
						'description' => __( 'Optional plan-family filter.', 'jetpack-plans' ),
						'enum'        => self::PLAN_CATEGORIES,
						'default'     => 'all',
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'  => 'array',
				'items' => array(
					'type'       => 'object',
					'properties' => array(
						'slug'          => array( 'type' => 'string' ),
						'name'          => array( 'type' => array( 'string', 'null' ) ),
						'monthly_price' => array( 'type' => array( 'number', 'null' ) ),
						'currency'      => array( 'type' => array( 'string', 'null' ) ),
						'features'      => array(
							'type'  => 'array',
							'items' => array( 'type' => 'string' ),
						),
						'upgrade_url'   => array( 'type' => array( 'string', 'null' ) ),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'list_plans' ),
			'permission_callback' => array( __CLASS__, 'can_view_plans' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Coarse permission gate shared by every Plans ability. Plans surface mixes
	 * billing-relevant detail (price, expiry) and admin-targeted upgrade URLs,
	 * so we gate on `manage_options` — the safe default for site-wide settings.
	 *
	 * @return bool
	 */
	public static function can_view_plans(): bool {
		return current_user_can( 'manage_options' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: get-current-plan.
	 *
	 * Reshapes the verbose array returned by {@see Current_Plan::get()} into a
	 * compact, high-signal shape: identity (slug/name/class/product_id), expiry,
	 * the active-features list, and the supports flags consumed by
	 * `Current_Plan::supports()`. Raw `features.available` is intentionally
	 * dropped — it explodes context for callers that just want to know what the
	 * site can do today.
	 *
	 * @param array|null $input Ability input (no parameters accepted).
	 * @return array
	 */
	public static function get_current_plan( $input = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Abilities API contract requires execute callbacks to accept the input array even when the schema declares no parameters.
		$plan = static::fetch_current_plan();

		$features_active = array();
		if ( isset( $plan['features']['active'] ) && is_array( $plan['features']['active'] ) ) {
			$features_active = array_values( array_filter( $plan['features']['active'], 'is_string' ) );
		}

		$supports = array();
		if ( isset( $plan['supports'] ) && is_array( $plan['supports'] ) ) {
			$supports = array_values( array_filter( $plan['supports'], 'is_string' ) );
		}

		return array(
			'slug'       => isset( $plan['product_slug'] ) ? (string) $plan['product_slug'] : 'jetpack_free',
			'name'       => isset( $plan['product_name_short'] ) ? (string) $plan['product_name_short'] : null,
			'class'      => isset( $plan['class'] ) ? (string) $plan['class'] : 'free',
			'product_id' => isset( $plan['product_id'] ) ? (int) $plan['product_id'] : null,
			'expires_at' => self::normalize_expiry( $plan ),
			'features'   => $features_active,
			'supports'   => $supports,
		);
	}

	/**
	 * Execute: list-plans.
	 *
	 * Pulls the WordPress.com plan catalog via {@see Plans::get_plans()} and
	 * projects every entry to a compact shape. When the remote call fails the
	 * underlying helper returns a non-array body; we surface that as
	 * `jetpack_plans_catalog_unavailable` so callers see a clear next step
	 * instead of a silent empty list.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|\WP_Error
	 */
	public static function list_plans( $input = null ) {
		$input    = is_array( $input ) ? $input : array();
		$category = isset( $input['category'] ) && is_string( $input['category'] ) ? $input['category'] : 'all';
		if ( ! in_array( $category, self::PLAN_CATEGORIES, true ) ) {
			return new \WP_Error(
				'jetpack_plans_invalid_category',
				sprintf(
					/* translators: %s: comma-separated list of accepted plan category filter values. */
					__( 'Unknown category. Accepted values: %s.', 'jetpack-plans' ),
					implode( ', ', self::PLAN_CATEGORIES )
				)
			);
		}

		$catalog = static::fetch_catalog();
		if ( ! is_array( $catalog ) && ! ( $catalog instanceof \Traversable ) ) {
			return new \WP_Error(
				'jetpack_plans_catalog_unavailable',
				__( 'The WordPress.com plans catalog could not be loaded. Retry shortly; this is typically transient.', 'jetpack-plans' )
			);
		}

		$site_suffix = static::resolve_site_suffix();
		$security    = self::security_plan_slugs();

		$result = array();
		foreach ( $catalog as $plan ) {
			$slug = self::read_field( $plan, 'product_slug' );
			if ( ! is_string( $slug ) || '' === $slug ) {
				continue;
			}

			// The WordPress.com /plans catalog mixes Jetpack plans with
			// non-Jetpack WordPress.com hosting plans (Personal, Premium,
			// Business, eCommerce, …). Only Jetpack plans are purchasable
			// through this surface, so drop everything else.
			if ( ! self::is_jetpack_plan_slug( $slug ) ) {
				continue;
			}

			// The catalog still carries discontinued/legacy plans (e.g.
			// jetpack_business, jetpack_personal) so existing subscribers keep
			// them, but they can no longer be purchased. Only surface plans
			// WordPress.com still sells.
			if ( ! self::is_purchasable_plan( $plan ) ) {
				continue;
			}

			if ( 'security' === $category && ! in_array( $slug, $security, true ) ) {
				continue;
			}

			$result[] = array(
				'slug'          => $slug,
				'name'          => self::stringify( self::read_field( $plan, 'product_name_short' ) ),
				'monthly_price' => self::normalize_monthly_price( $plan ),
				'currency'      => self::stringify( self::read_field( $plan, 'currency_code' ) ),
				'features'      => self::extract_plan_features( $plan ),
				'upgrade_url'   => self::build_checkout_url( $slug, $plan, $site_suffix, null ),
			);
		}

		return $result;
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Resolve the site's WordPress.com slug fragment used in checkout URLs.
	 *
	 * Wraps `Status::get_site_suffix()` so tests can stub the call. Returning
	 * an empty string means "not connected / cannot identify"; the purchase URL
	 * ability surfaces that as `jetpack_plans_site_unidentified`.
	 *
	 * @return string
	 */
	protected static function resolve_site_suffix(): string {
		return (string) ( new Status() )->get_site_suffix();
	}

	/**
	 * Fetch the WordPress.com plan catalog. Wraps {@see Plans::get_plans()}
	 * so tests can stub the remote call without standing up an HTTP fixture.
	 *
	 * @return array|\Traversable|mixed The catalog (array/iterable on success),
	 *                                  or whatever the underlying helper returns
	 *                                  on transport failure (typically a string body).
	 */
	protected static function fetch_catalog() {
		return Plans::get_plans();
	}

	/**
	 * Fetch the active plan array. Wraps {@see Current_Plan::get()} so tests
	 * can stub it without round-tripping through the option cache.
	 *
	 * @return array
	 */
	protected static function fetch_current_plan(): array {
		$plan = Current_Plan::get();
		return is_array( $plan ) ? $plan : array();
	}

	/**
	 * Normalize the plan's expiry timestamp.
	 *
	 * The wpcom payload stores expiry either as `expiry` (ISO-8601) or
	 * `expires` (rare); free / non-expiring plans omit both. Returns `null`
	 * for the no-expiry case so callers see an explicit signal.
	 *
	 * @param array $plan Active plan array.
	 * @return string|null
	 */
	private static function normalize_expiry( array $plan ): ?string {
		foreach ( array( 'expiry', 'expires' ) as $key ) {
			if ( isset( $plan[ $key ] ) && is_string( $plan[ $key ] ) && '' !== $plan[ $key ] ) {
				return $plan[ $key ];
			}
		}
		return null;
	}

	/**
	 * Build a `https://wordpress.com/checkout/<site>/<slug>` URL, honoring the
	 * plan's WordPress.com `path_slug` when present.
	 *
	 * @param string       $product_slug Canonical plan slug from the catalog.
	 * @param object|array $plan         Plan entry from the WP.com catalog.
	 * @param string       $site_suffix  Site fragment from `Status::get_site_suffix()`.
	 * @param string|null  $redirect     Optional post-checkout redirect URL.
	 * @return string|null Returns null when the site fragment is empty.
	 */
	private static function build_checkout_url( string $product_slug, $plan, string $site_suffix, ?string $redirect ): ?string {
		if ( '' === $site_suffix ) {
			return null;
		}

		$path_slug = self::read_field( $plan, 'path_slug' );
		$slug      = ( is_string( $path_slug ) && '' !== $path_slug ) ? $path_slug : $product_slug;

		$url = sprintf( 'https://wordpress.com/checkout/%s/%s', $site_suffix, rawurlencode( $slug ) );

		if ( null !== $redirect ) {
			$url = add_query_arg( 'redirect_to', rawurlencode( $redirect ), $url );
		}

		return $url;
	}

	/**
	 * Project the catalog plan's `features.included` (or similarly shaped)
	 * list into a flat array of feature-slug strings. Different catalog
	 * versions name this field differently; we accept the common variants
	 * and silently drop anything malformed.
	 *
	 * @param object|array $plan Plan entry from the WP.com catalog.
	 * @return string[]
	 */
	private static function extract_plan_features( $plan ): array {
		$candidates = array( 'features_highlight', 'features', 'available_features', 'product_features' );
		foreach ( $candidates as $field ) {
			$value = self::read_field( $plan, $field );
			if ( ! is_array( $value ) && ! ( $value instanceof \Traversable ) ) {
				continue;
			}
			$out = array();
			foreach ( $value as $entry ) {
				if ( is_string( $entry ) && '' !== $entry ) {
					$out[] = $entry;
					continue;
				}
				$slug = self::read_field( $entry, 'slug' );
				if ( is_string( $slug ) && '' !== $slug ) {
					$out[] = $slug;
				}
			}
			if ( ! empty( $out ) ) {
				return array_values( array_unique( $out ) );
			}
		}
		return array();
	}

	/**
	 * Normalize the plan's monthly price for comparison across billing
	 * periods. Catalog entries publish `raw_price` (period total) and a
	 * `bill_period` in days; dividing by 30 reduces both to a comparable
	 * monthly figure. When fields are missing we return null rather than
	 * a misleading zero.
	 *
	 * @param object|array $plan Plan entry from the WP.com catalog.
	 * @return float|null
	 */
	private static function normalize_monthly_price( $plan ): ?float {
		$raw    = self::read_field( $plan, 'raw_price' );
		$period = self::read_field( $plan, 'bill_period' );
		if ( ! is_numeric( $raw ) ) {
			return null;
		}
		if ( ! is_numeric( $period ) || (float) $period <= 0 ) {
			// No billing period; treat the raw value as the monthly price.
			return (float) $raw;
		}
		$months = (float) $period / 30.0;
		if ( $months <= 0 ) {
			return null;
		}
		return round( (float) $raw / $months, 2 );
	}

	/**
	 * Read a named field from either an array or an object catalog entry.
	 *
	 * @param mixed  $entry Catalog entry (array or stdClass).
	 * @param string $key   Field name.
	 * @return mixed|null
	 */
	private static function read_field( $entry, string $key ) {
		if ( is_array( $entry ) ) {
			return $entry[ $key ] ?? null;
		}
		if ( is_object( $entry ) ) {
			return $entry->$key ?? null;
		}
		return null;
	}

	/**
	 * Cast a scalar/null value to a string-or-null for the output schema.
	 *
	 * @param mixed $value Catalog field value.
	 * @return string|null
	 */
	private static function stringify( $value ): ?string {
		if ( is_string( $value ) ) {
			return '' === $value ? null : $value;
		}
		if ( is_scalar( $value ) ) {
			return (string) $value;
		}
		return null;
	}
}
