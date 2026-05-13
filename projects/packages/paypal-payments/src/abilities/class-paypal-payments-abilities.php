<?php
/**
 * PayPal Payments Abilities Registration.
 *
 * Registers PayPal Payments (Simple Payments) abilities with the WordPress
 * Abilities API. The package backs both the standalone PayPal Payment Buttons
 * plugin and the Jetpack plugin, so registering here surfaces the abilities
 * uniformly in both contexts.
 *
 * @package automattic/jetpack-paypal-payments
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\PayPal_Payments\Abilities;

use Automattic\Jetpack\WP_Abilities\Registrar;
use WP_Error;
use WP_Query;

/**
 * Registers PayPal Payments abilities with the WordPress Abilities API.
 *
 * Exposes a read-only surface for listing/inspecting PayPal Simple Payments
 * buttons stored as `jp_pay_product` posts so AI agents can answer
 * site-owner questions through the standard `wp-abilities/v1` REST surface.
 * Create / update / delete writes are deliberately deferred.
 */
class PayPal_Payments_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-paypal-payments';
	const ERROR_PREFIX  = 'jetpack_paypal_payments_';

	/**
	 * The `jp_pay_product` post type slug owned by Simple_Payments.
	 *
	 * Hardcoded here so this class doesn't have to load the legacy
	 * Simple_Payments class — which side-effects (registers hooks,
	 * enqueues scripts) on autoload — just to read a constant.
	 */
	const POST_TYPE = 'jp_pay_product';

	/**
	 * Statuses accepted by `list-buttons`.
	 */
	const LIST_STATUSES = array( 'publish', 'draft', 'all' );

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
			// "PayPal" and "Jetpack" are product names and should not be translated.
			'label'       => 'Jetpack PayPal Payments',
			'description' => __( 'Abilities for reading PayPal Simple Payments buttons stored as jp_pay_product posts.', 'jetpack-paypal-payments' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-paypal-payments/list-buttons' => self::spec_list_buttons(),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Ability specs
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Spec: jetpack-paypal-payments/list-buttons.
	 */
	private static function spec_list_buttons(): array {
		return array(
			'label'               => __( 'List PayPal payment buttons', 'jetpack-paypal-payments' ),
			'description'         => __(
				'List PayPal Simple Payments buttons (jp_pay_product posts) with optional status / search filters and pagination. Pass `button_id` to fetch a single button by ID — returns a zero- or one-element array; unknown ids return []. Each entry shape: { id, title, price, currency, recipient_email, button_image_url, edit_url, status, created_at }. Read-only.',
				'jetpack-paypal-payments'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'default'              => array(),
				'properties'           => array(
					'status'    => array(
						'type'        => 'string',
						'description' => __( 'Filter by post status. "all" returns publish + draft.', 'jetpack-paypal-payments' ),
						'enum'        => self::LIST_STATUSES,
						'default'     => 'publish',
					),
					'search'    => array(
						'type'        => 'string',
						'description' => __( 'Search by button title.', 'jetpack-paypal-payments' ),
					),
					'page'      => array(
						'type'        => 'integer',
						'description' => __( 'Page number for paginated results.', 'jetpack-paypal-payments' ),
						'default'     => 1,
						'minimum'     => 1,
					),
					'per_page'  => array(
						'type'        => 'integer',
						'description' => __( 'Number of buttons per page.', 'jetpack-paypal-payments' ),
						'default'     => 20,
						'minimum'     => 1,
						'maximum'     => 100,
					),
					'button_id' => array(
						'type'        => 'integer',
						'description' => __( 'Fetch a single button by ID. When set, returns a 0- or 1-element array and other filters are ignored.', 'jetpack-paypal-payments' ),
						'minimum'     => 1,
					),
				),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'  => 'array',
				'items' => array(
					'type'       => 'object',
					'properties' => self::button_output_properties(),
				),
			),
			'execute_callback'    => array( __CLASS__, 'list_buttons' ),
			'permission_callback' => array( __CLASS__, 'can_view_buttons' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
				'mcp'          => array(
					'public' => true,
					'type'   => 'tool',
				),
			),
		);
	}

	/**
	 * Output schema properties shared by every list entry.
	 *
	 * @return array
	 */
	private static function button_output_properties(): array {
		return array(
			'id'               => array( 'type' => 'integer' ),
			'title'            => array( 'type' => 'string' ),
			'price'            => array( 'type' => array( 'number', 'string', 'null' ) ),
			'currency'         => array( 'type' => 'string' ),
			'recipient_email'  => array( 'type' => 'string' ),
			'button_image_url' => array( 'type' => 'string' ),
			'edit_url'         => array( 'type' => 'string' ),
			'status'           => array( 'type' => 'string' ),
			'created_at'       => array( 'type' => 'string' ),
		);
	}

	/*
	---------------------------------------------------------------------
	 * Permission callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Read-side permission gate.
	 *
	 * The `jp_pay_product` CPT registers `edit_others_posts` for the
	 * `edit_others_posts` cap map and `read_private_posts` for reads;
	 * the simplest authoritative check that matches the CPT's own
	 * meta-cap is `edit_posts`, which every editor / admin has and
	 * which excludes subscribers and contributors. Aligns with the
	 * CPT's published `capabilities` map (`edit_posts` is the
	 * underlying primitive).
	 *
	 * @return bool
	 */
	public static function can_view_buttons(): bool {
		return current_user_can( 'edit_posts' );
	}

	/*
	---------------------------------------------------------------------
	 * Execute callbacks
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Execute: list-buttons.
	 *
	 * @param array|null $input Input matching the ability's input_schema.
	 * @return array|WP_Error
	 */
	public static function list_buttons( $input = null ) {
		$input = is_array( $input ) ? $input : array();

		$post_type = self::POST_TYPE;
		if ( ! post_type_exists( $post_type ) ) {
			return new WP_Error(
				self::ERROR_PREFIX . 'cpt_unavailable',
				__( 'PayPal Simple Payments are not enabled on this site. Confirm the Simple Payments module / package bootstrap is loaded before retrying.', 'jetpack-paypal-payments' )
			);
		}

		// `button_id` short-circuit: collapses get-button into list-buttons.
		if ( isset( $input['button_id'] ) ) {
			$id = (int) $input['button_id'];
			if ( $id <= 0 ) {
				return array();
			}
			$post = get_post( $id );
			if ( ! $post || $post->post_type !== $post_type ) {
				return array();
			}
			return array( self::format_button( $post ) );
		}

		$status   = self::pick_status( $input['status'] ?? null );
		$page     = self::clamp_int( $input['page'] ?? 1, 1, PHP_INT_MAX, 1 );
		$per_page = self::clamp_int( $input['per_page'] ?? 20, 1, 100, 20 );
		$search   = isset( $input['search'] ) && is_string( $input['search'] ) ? trim( $input['search'] ) : '';

		$query_args = array(
			'post_type'      => $post_type,
			'post_status'    => 'all' === $status ? array( 'publish', 'draft' ) : $status,
			'posts_per_page' => $per_page,
			'paged'          => $page,
			'orderby'        => 'date',
			'order'          => 'DESC',
			// Suppress filters that admin Simple Payments code attaches to the_content; we never render here.
			'no_found_rows'  => true,
		);
		if ( '' !== $search ) {
			$query_args['s'] = $search;
		}

		$query = new WP_Query( $query_args );

		$out = array();
		foreach ( $query->posts as $post ) {
			$out[] = self::format_button( $post );
		}
		return $out;
	}

	/*
	---------------------------------------------------------------------
	 * Helpers
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Project a `jp_pay_product` post into the uniform list entry shape.
	 *
	 * @param \WP_Post $post Product post.
	 * @return array
	 */
	private static function format_button( $post ): array {
		$id        = (int) $post->ID;
		$thumb_id  = (int) get_post_thumbnail_id( $id );
		$thumb_url = $thumb_id > 0 ? (string) wp_get_attachment_url( $thumb_id ) : '';

		$edit_url = get_edit_post_link( $id, 'raw' );
		if ( ! is_string( $edit_url ) ) {
			$edit_url = '';
		}

		$price_raw = get_post_meta( $id, 'spay_price', true );
		$price     = '' === $price_raw || null === $price_raw ? null : ( is_numeric( $price_raw ) ? (float) $price_raw : (string) $price_raw );

		return array(
			'id'               => $id,
			'title'            => (string) get_the_title( $post ),
			'price'            => $price,
			'currency'         => (string) get_post_meta( $id, 'spay_currency', true ),
			'recipient_email'  => (string) get_post_meta( $id, 'spay_email', true ),
			'button_image_url' => $thumb_url,
			'edit_url'         => $edit_url,
			'status'           => (string) $post->post_status,
			'created_at'       => (string) $post->post_date_gmt,
		);
	}

	/**
	 * Resolve a status enum from raw input, defaulting to `publish`.
	 *
	 * @param mixed $raw Raw input value.
	 * @return string One of self::LIST_STATUSES.
	 */
	private static function pick_status( $raw ): string {
		return is_string( $raw ) && in_array( $raw, self::LIST_STATUSES, true ) ? $raw : 'publish';
	}

	/**
	 * Clamp an integer into [$min, $max] with a default on bad input.
	 *
	 * @param mixed $raw         Raw input.
	 * @param int   $min         Minimum.
	 * @param int   $max         Maximum.
	 * @param int   $default_val Default on bad input.
	 * @return int
	 */
	private static function clamp_int( $raw, int $min, int $max, int $default_val ): int {
		if ( ! is_numeric( $raw ) ) {
			return $default_val;
		}
		$v = (int) $raw;
		if ( $v < $min ) {
			return $min;
		}
		if ( $v > $max ) {
			return $max;
		}
		return $v;
	}
}
