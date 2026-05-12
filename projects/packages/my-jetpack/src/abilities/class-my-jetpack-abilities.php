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
 * Exposes read-only views of My Jetpack state — the product registry and the
 * in-product feedback prompt — through the WordPress Abilities API.
 */
class My_Jetpack_Abilities extends Registrar {

	/**
	 * Category slug for all My Jetpack abilities.
	 */
	const CATEGORY_SLUG = 'jetpack-my-jetpack';

	/**
	 * Option key that tracks the timestamp of the last in-product feedback prompt.
	 *
	 * Read-only here. The write side (the prompt UI) is responsible for setting
	 * this option when it surfaces a prompt to the user.
	 */
	const FEEDBACK_LAST_PROMPTED_OPTION = 'jetpack_my_jetpack_feedback_last_prompted_at';

	/**
	 * Minimum seconds between successive feedback prompts. Used as the cool-down
	 * window when deriving `should_prompt`.
	 */
	const FEEDBACK_COOLDOWN_SECONDS = 2592000; // 30 days.

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
			// "My Jetpack" is a product name and is intentionally not translated.
			'label'       => 'My Jetpack',
			'description' => __( 'Abilities for reading My Jetpack product status and in-product feedback state.', 'jetpack-my-jetpack' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-my-jetpack/list-products'             => self::spec_list_products(),
			'jetpack-my-jetpack/get-feedback-prompt-state' => self::spec_get_feedback_prompt_state(),
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
	 * Spec: jetpack-my-jetpack/get-feedback-prompt-state.
	 *
	 * Zero-arg read of whether the in-product feedback prompt should surface
	 * for the current site, plus the timestamp of the last prompt.
	 */
	private static function spec_get_feedback_prompt_state(): array {
		return array(
			'label'               => __( 'Get feedback prompt state', 'jetpack-my-jetpack' ),
			'description'         => __(
				'Return whether the My Jetpack in-product feedback prompt should be shown to the current user, and when it was last shown. Always returns { should_prompt: bool, last_prompted_at: int|null }. `last_prompted_at` is a Unix timestamp (seconds) or null when no prompt has ever been recorded. `should_prompt` is true when either no prompt has been recorded or the cool-down (30 days) has elapsed. Read-only and idempotent.',
				'jetpack-my-jetpack'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'                 => 'object',
				'additionalProperties' => false,
				'properties'           => array(
					'should_prompt'    => array(
						'type'        => 'boolean',
						'description' => __( 'True when the prompt is eligible to be shown now.', 'jetpack-my-jetpack' ),
					),
					'last_prompted_at' => array(
						'type'        => array( 'integer', 'null' ),
						'description' => __( 'Unix timestamp of the last prompt, or null if no prompt has been recorded.', 'jetpack-my-jetpack' ),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_feedback_prompt_state' ),
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
	 * see its product registry or feedback-prompt state.
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
	 * Execute: get-feedback-prompt-state.
	 *
	 * @param array|null $input Unused — spec accepts no parameters.
	 * @return array{ should_prompt: bool, last_prompted_at: ?int }
	 */
	public static function get_feedback_prompt_state( $input = null ): array {
		unset( $input );

		$raw  = get_option( self::FEEDBACK_LAST_PROMPTED_OPTION, 0 );
		$last = is_numeric( $raw ) ? (int) $raw : 0;

		if ( $last <= 0 ) {
			return array(
				'should_prompt'    => true,
				'last_prompted_at' => null,
			);
		}

		$should_prompt = ( time() - $last ) >= self::FEEDBACK_COOLDOWN_SECONDS;

		return array(
			'should_prompt'    => $should_prompt,
			'last_prompted_at' => $last,
		);
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
}
