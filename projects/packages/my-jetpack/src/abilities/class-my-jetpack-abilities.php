<?php
/**
 * My Jetpack Abilities Registration
 *
 * Registers My Jetpack abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-my-jetpack
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9.

namespace Automattic\Jetpack\My_Jetpack\Abilities;

use Automattic\Jetpack\My_Jetpack\Products;
use Automattic\Jetpack\WP_Abilities\Registrar;

/**
 * Class My_Jetpack_Abilities
 *
 * Exposes a read-only view of My Jetpack state — the product registry —
 * through the WordPress Abilities API.
 */
class My_Jetpack_Abilities extends Registrar {

	/**
	 * Category slug for all My Jetpack abilities.
	 *
	 * Shared with the rest of the Jetpack plugin's abilities (modules, etc.)
	 * so everything groups under a single "jetpack" category in the
	 * Abilities API surface.
	 */
	const CATEGORY_SLUG = 'jetpack';

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
			'description' => __( 'Abilities exposed by the Jetpack plugin.', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-my-jetpack/list-products' => self::spec_list_products(),
			'jetpack-my-jetpack/list-plans'    => self::spec_list_plans(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-my-jetpack/list-products.
	 *
	 * Consolidated read of the My Jetpack product registry. Pass an optional
	 * `slug` to narrow the response to a single product without changing the
	 * return shape — the agent always sees an array of product entries.
	 */
	private static function spec_list_products(): array {
		$product_entry_schema = array(
			'type'                 => 'object',
			'additionalProperties' => false,
			'properties'           => array(
				'slug'       => array(
					'type'        => 'string',
					'description' => __( 'Stable product identifier (e.g. "backup", "search", "jetpack-ai").', 'jetpack-my-jetpack' ),
				),
				'name'       => array(
					'type'        => 'string',
					'description' => __( 'Internal product name (lowercase, hyphenated).', 'jetpack-my-jetpack' ),
				),
				'active'     => array(
					'type'        => 'boolean',
					'description' => __( 'True when the product is currently active on the site.', 'jetpack-my-jetpack' ),
				),
				'available'  => array(
					'type'        => 'boolean',
					'description' => __( 'True when the product can be used on this site (plugin installed and no blocking errors).', 'jetpack-my-jetpack' ),
				),
				'status'     => array(
					'type'        => 'string',
					'description' => __( 'Lifecycle status from the My Jetpack vocabulary (e.g. "active", "inactive", "needs_plan", "plugin_absent").', 'jetpack-my-jetpack' ),
				),
				'plan_class' => array(
					'type'        => 'string',
					'enum'        => array( 'bundle', 'feature', 'product' ),
					'description' => __( 'Classification: "bundle" (umbrella plan), "feature" (add-on within a product), or "product" (standalone offering).', 'jetpack-my-jetpack' ),
				),
			),
		);

		return array(
			'label'               => __( 'List Jetpack products', 'jetpack-my-jetpack' ),
			'description'         => __(
				'Return the My Jetpack product registry as a uniform array of entries. Each entry has slug, name, active (bool), available (bool), status (string), and plan_class ("bundle"|"feature"|"product"). Pass an optional `slug` to filter to a single product; unknown slugs return an empty array (not an error) so the caller can treat the response uniformly. Read-only and idempotent.',
				'jetpack-my-jetpack'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'slug' => array(
						'type'        => 'string',
						'description' => __( 'Optional product slug to filter the response to a single entry. Unknown slugs yield an empty array.', 'jetpack-my-jetpack' ),
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'  => 'array',
				'items' => $product_entry_schema,
			),
			'execute_callback'    => array( __CLASS__, 'list_products' ),
			'permission_callback' => array( __CLASS__, 'can_view_my_jetpack' ),
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
	 * Spec: jetpack-my-jetpack/list-plans.
	 *
	 * The purchasable Jetpack bundle plans (Security, Growth, Complete) as the
	 * Jetpack offering currently sells them. Sourced from the My Jetpack
	 * product registry — the same definitions that drive the Jetpack pricing
	 * UI — so discontinued/legacy plans never appear.
	 */
	private static function spec_list_plans(): array {
		$plan_entry_schema = array(
			'type'                 => 'object',
			'additionalProperties' => false,
			'properties'           => array(
				'slug'     => array(
					'type'        => 'string',
					'description' => __( 'Canonical WordPress.com product slug for the plan (e.g. "jetpack_security_t1_yearly", "jetpack_growth_yearly", "jetpack_complete").', 'jetpack-my-jetpack' ),
				),
				'name'     => array(
					'type'        => 'string',
					'description' => __( 'Display name of the bundle (e.g. "Jetpack Security").', 'jetpack-my-jetpack' ),
				),
				'price'    => array(
					'type'        => array( 'number', 'null' ),
					'description' => __( 'Full (non-promotional) price for one billing term, or null when pricing is unavailable.', 'jetpack-my-jetpack' ),
				),
				'currency' => array(
					'type'        => array( 'string', 'null' ),
					'description' => __( 'ISO-4217 currency code for `price` (e.g. "USD"), or null when pricing is unavailable.', 'jetpack-my-jetpack' ),
				),
				'term'     => array(
					'type'        => array( 'string', 'null' ),
					'description' => __( 'Billing term `price` covers (e.g. "year"), or null when pricing is unavailable.', 'jetpack-my-jetpack' ),
				),
				'features' => array(
					'type'        => 'array',
					'items'       => array( 'type' => 'string' ),
					'description' => __( 'Headline features included in the bundle.', 'jetpack-my-jetpack' ),
				),
			),
		);

		return array(
			'label'               => __( 'List purchasable Jetpack plans', 'jetpack-my-jetpack' ),
			'description'         => __(
				'Return the Jetpack bundle plans the site can currently purchase (Security, Growth, Complete) as a uniform array of { slug, name, price, currency, term, features } entries. The set comes from the Jetpack product registry that powers the pricing UI, so discontinued/legacy plans (jetpack_personal, jetpack_premium, jetpack_business, the daily/realtime security plans, …) are never returned. Individual add-on products are covered by jetpack-my-jetpack/list-products. Read-only and idempotent; takes no arguments.',
				'jetpack-my-jetpack'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'  => 'array',
				'items' => $plan_entry_schema,
			),
			'execute_callback'    => array( __CLASS__, 'list_plans' ),
			'permission_callback' => array( __CLASS__, 'can_view_my_jetpack' ),
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
	 * Permission shared by every My Jetpack read ability. Matches the gate on
	 * the My Jetpack admin page itself: only users who can reach the page can
	 * see its product registry.
	 *
	 * @return bool
	 */
	public static function can_view_my_jetpack(): bool {
		return current_user_can( 'jetpack_admin_page' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: list-products.
	 *
	 * Returns an array of product entries. An optional `slug` narrows to one
	 * entry; unknown slugs return an empty array. The shape is uniform across
	 * filtered and unfiltered calls so agents never need to switch parsers.
	 *
	 * @param array|null $input Optional input from the ability spec.
	 * @return array<int, array<string, mixed>>
	 */
	public static function list_products( $input = null ): array {
		$input = is_array( $input ) ? $input : array();
		$slug  = isset( $input['slug'] ) && is_string( $input['slug'] ) ? $input['slug'] : '';

		if ( '' !== $slug ) {
			$product_slugs = in_array( $slug, Products::get_products_slugs(), true ) ? array( $slug ) : array();
		} else {
			$product_slugs = Products::get_products_slugs();
		}

		$entries = array();
		foreach ( $product_slugs as $product_slug ) {
			$entry = self::summarize_product( $product_slug );
			if ( null !== $entry ) {
				$entries[] = $entry;
			}
		}

		return $entries;
	}

	/**
	 * Execute: list-plans.
	 *
	 * Walks the My Jetpack product registry, keeps the bundle products
	 * (Security, Growth, Complete), and projects each to a compact plan entry.
	 * Because the registry only knows the plans Jetpack currently sells,
	 * legacy plans never appear.
	 *
	 * @param array|null $input Ability input (no parameters accepted).
	 * @return array<int, array<string, mixed>>
	 */
	public static function list_plans( $input = null ): array { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable -- Abilities API contract requires execute callbacks to accept the input array even when the schema declares no parameters.
		$plans = array();
		foreach ( Products::get_products_slugs() as $product_slug ) {
			$class = Products::get_product_class( $product_slug );
			if ( ! $class || ! $class::is_bundle_product() ) {
				continue;
			}

			$slug = (string) $class::get_wpcom_product_slug();
			if ( '' === $slug ) {
				continue;
			}

			$pricing  = static::get_plan_pricing( $class );
			$features = array();
			foreach ( (array) $class::get_features() as $feature ) {
				if ( is_string( $feature ) && '' !== $feature ) {
					$features[] = $feature;
				}
			}

			$plans[] = array(
				'slug'     => $slug,
				'name'     => (string) $class::get_title(),
				'price'    => isset( $pricing['full_price'] ) && is_numeric( $pricing['full_price'] ) ? (float) $pricing['full_price'] : null,
				'currency' => isset( $pricing['currency_code'] ) && is_string( $pricing['currency_code'] ) && '' !== $pricing['currency_code'] ? $pricing['currency_code'] : null,
				'term'     => isset( $pricing['product_term'] ) && is_string( $pricing['product_term'] ) && '' !== $pricing['product_term'] ? $pricing['product_term'] : null,
				'features' => $features,
			);
		}

		return $plans;
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Build the compact product entry shape for `list-products`.
	 *
	 * Reads from the My Jetpack product class for the slug. Returns null if
	 * the slug is not registered — the caller filters those out.
	 *
	 * @param string $product_slug Product slug from the registry.
	 * @return array<string, mixed>|null
	 */
	private static function summarize_product( string $product_slug ): ?array {
		$class = Products::get_product_class( $product_slug );
		if ( ! $class ) {
			return null;
		}

		$status = (string) $class::get_status();

		return array(
			'slug'       => $product_slug,
			'name'       => (string) $class::get_name(),
			'active'     => in_array( $status, Products::$active_module_statuses, true ),
			'available'  => self::is_available_status( $status ),
			'status'     => $status,
			'plan_class' => self::derive_plan_class( $class ),
		);
	}

	/**
	 * A product is "available" when it can be used on this site right now —
	 * the plugin is installed, no connection error, and no missing-plan or
	 * absent-plugin blocker. Used by the agent to decide whether to surface
	 * a product as actionable versus a recommendation/upsell.
	 *
	 * @param string $status Product status from `get_status()`.
	 * @return bool
	 */
	private static function is_available_status( string $status ): bool {
		$unavailable = array(
			Products::STATUS_PLUGIN_ABSENT,
			Products::STATUS_PLUGIN_ABSENT_WITH_PLAN,
			Products::STATUS_NEEDS_PLAN,
			Products::STATUS_NEEDS_FIRST_SITE_CONNECTION,
			Products::STATUS_SITE_CONNECTION_ERROR,
			Products::STATUS_USER_CONNECTION_ERROR,
		);

		return ! in_array( $status, $unavailable, true );
	}

	/**
	 * Classify a product as bundle / feature / standalone product.
	 *
	 * @param string $class Fully-qualified product class name.
	 * @return string One of: 'bundle', 'feature', 'product'.
	 */
	private static function derive_plan_class( string $class ): string {
		if ( $class::is_bundle_product() ) {
			return 'bundle';
		}
		if ( ! empty( $class::$is_feature ) ) {
			return 'feature';
		}
		return 'product';
	}

	/**
	 * Read a bundle product's pricing details.
	 *
	 * Wraps the product class's own pricing accessor so tests can stub the
	 * remote-backed call. Always returns an array.
	 *
	 * @param string $class Fully-qualified bundle product class name.
	 * @return array<string, mixed>
	 */
	protected static function get_plan_pricing( string $class ): array {
		$pricing = $class::get_pricing_for_ui();
		return is_array( $pricing ) ? $pricing : array();
	}
}
