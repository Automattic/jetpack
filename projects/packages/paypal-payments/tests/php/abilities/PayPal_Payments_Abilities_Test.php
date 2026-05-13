<?php
/**
 * Unit tests for PayPal Payments Abilities.
 *
 * @package automattic/jetpack-paypal-payments
 * @phan-file-suppress PhanPluginUnreachableCode -- markTestSkipped throws but Phan doesn't know that
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9, but then we need a suppression for the WP 6.8 compat run. @todo Remove this line when we drop WP <6.9.

namespace Automattic\Jetpack\PayPal_Payments\Abilities;

use WorDBless\BaseTestCase;
use WP_Error;

/**
 * Unit tests for PayPal_Payments_Abilities registration and execution.
 */
class PayPal_Payments_Abilities_Test extends BaseTestCase {

	/**
	 * Admin (editor capability) user id.
	 *
	 * @var int
	 */
	private static $admin_user_id;

	/**
	 * Subscriber user id used for permission denial.
	 *
	 * @var int
	 */
	private static $subscriber_user_id;

	/**
	 * Register the jp_pay_product CPT, install the WP_Query shim, and create
	 * the two test users.
	 */
	public function setUp(): void {
		parent::setUp();

		register_post_type(
			PayPal_Payments_Abilities::POST_TYPE,
			array(
				'label'        => 'Product',
				'public'       => false,
				'show_in_rest' => true,
				'supports'     => array( 'title', 'editor', 'thumbnail', 'custom-fields', 'author' ),
			)
		);

		// WorDBless does not back WP_Query with a real wpdb, so intercept
		// posts_pre_query to project the in-memory posts store for the
		// jp_pay_product CPT. The shim mirrors the small slice of WP_Query
		// behavior list_buttons() relies on: status filter (string or array),
		// `s` title search, `posts_per_page`, and `paged`.
		add_filter( 'posts_pre_query', array( $this, 'wordbless_wp_query_shim' ), 10, 2 );

		self::$admin_user_id = wp_insert_user(
			array(
				'user_login' => 'pp_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( self::$admin_user_id );

		self::$subscriber_user_id = wp_insert_user(
			array(
				'user_login' => 'pp_subscriber',
				'user_pass'  => '123',
				'role'       => 'subscriber',
			)
		);
	}

	/**
	 * Tear down — unregister the CPT, drop the WP_Query shim, reset users.
	 */
	public function tearDown(): void {
		remove_filter( 'posts_pre_query', array( $this, 'wordbless_wp_query_shim' ), 10 );
		unregister_post_type( PayPal_Payments_Abilities::POST_TYPE );
		wp_set_current_user( 0 );
		parent::tearDown();
	}

	/**
	 * WP_Query short-circuit that projects WorDBless's in-memory post store
	 * for the jp_pay_product CPT. Returns null for any other post type so the
	 * normal WP_Query path runs.
	 *
	 * @param array|null $posts Pre-query posts (null lets WP_Query run normally).
	 * @param \WP_Query  $query Query instance.
	 * @return array|null
	 */
	public function wordbless_wp_query_shim( $posts, $query ) {
		if ( $query->get( 'post_type' ) !== PayPal_Payments_Abilities::POST_TYPE ) {
			return $posts;
		}

		$status_raw = $query->get( 'post_status' );
		$statuses   = is_array( $status_raw ) ? $status_raw : array( $status_raw );

		$search = (string) $query->get( 's' );

		$all     = \WorDBless\Posts::init()->posts;
		$matched = array();
		foreach ( $all as $p ) {
			if ( $p->post_type !== PayPal_Payments_Abilities::POST_TYPE ) {
				continue;
			}
			if ( ! in_array( $p->post_status, $statuses, true ) && ! in_array( 'any', $statuses, true ) ) {
				continue;
			}
			if ( '' !== $search && false === stripos( $p->post_title, $search ) ) {
				continue;
			}
			$matched[] = $p;
		}

		// Mirror orderby=date DESC by sorting on post_date_gmt (insertion order is a
		// good-enough proxy since tests do not backdate posts).
		usort(
			$matched,
			function ( $a, $b ) {
				return strcmp( (string) $b->post_date_gmt, (string) $a->post_date_gmt );
			}
		);

		// Honor posts_per_page + paged for pagination tests.
		$per_page = (int) $query->get( 'posts_per_page' );
		if ( $per_page > 0 ) {
			$paged   = max( 1, (int) $query->get( 'paged' ) );
			$offset  = ( $paged - 1 ) * $per_page;
			$matched = array_slice( $matched, $offset, $per_page );
		}

		return $matched;
	}

	/**
	 * Insert a button (jp_pay_product) post.
	 *
	 * @param array $args Post + meta overrides.
	 * @return int
	 */
	private static function make_button( array $args = array() ): int {
		$defaults = array(
			'title'    => 'Test Button',
			'content'  => 'A test product description.',
			'status'   => 'publish',
			'price'    => '12.50',
			'currency' => 'USD',
			'email'    => 'seller@example.com',
		);
		$args     = array_merge( $defaults, $args );

		$post_id = (int) wp_insert_post(
			array(
				'post_type'    => PayPal_Payments_Abilities::POST_TYPE,
				'post_title'   => $args['title'],
				'post_content' => $args['content'],
				'post_status'  => $args['status'],
			)
		);
		update_post_meta( $post_id, 'spay_price', $args['price'] );
		update_post_meta( $post_id, 'spay_currency', $args['currency'] );
		update_post_meta( $post_id, 'spay_email', $args['email'] );
		return $post_id;
	}

	/**
	 * Simulates the `wp_abilities_api_categories_init` action.
	 */
	private function simulate_doing_wp_abilities_categories_init_action() {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_categories_init';
	}

	/**
	 * Simulates the `wp_abilities_api_init` action.
	 */
	private function simulate_doing_wp_abilities_init_action() {
		global $wp_current_filter;
		$wp_current_filter[] = 'wp_abilities_api_init';
	}

	/*
	---------------------------------------------------------------------
	 * Registration tests
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Default rollout filter is false, so init() must wire nothing.
	 *
	 * We deliberately verify behavior at the hook level (no callbacks added)
	 * rather than firing the Abilities API actions — firing them would
	 * register WordPress's core abilities a second time and trip the
	 * "already registered" notice on every subsequent test.
	 */
	public function test_init_skips_when_rollout_filter_disabled() {
		// Strip any existing hooks so we only observe what init() adds.
		remove_all_actions( 'wp_abilities_api_categories_init' );
		remove_all_actions( 'wp_abilities_api_init' );

		PayPal_Payments_Abilities::init();

		$this->assertFalse(
			has_action( 'wp_abilities_api_categories_init', array( PayPal_Payments_Abilities::class, 'register_category' ) ),
			'Category callback must NOT be hooked when jetpack_wp_abilities_enabled is false (default).'
		);
		$this->assertFalse(
			has_action( 'wp_abilities_api_init', array( PayPal_Payments_Abilities::class, 'register_abilities' ) ),
			'Abilities callback must NOT be hooked when jetpack_wp_abilities_enabled is false (default).'
		);
	}

	/**
	 * With the rollout filter enabled, init() must wire the registration callbacks.
	 *
	 * Same hook-level assertion as the disabled-path test — we don't fire
	 * the Abilities API actions to avoid re-registering core categories
	 * (which the WP_Abilities API treats as a notice, and our phpunit
	 * config has `failOnNotice="true"`).
	 */
	public function test_init_registers_when_rollout_filter_enabled() {
		remove_all_actions( 'wp_abilities_api_categories_init' );
		remove_all_actions( 'wp_abilities_api_init' );

		add_filter( 'jetpack_wp_abilities_enabled', '__return_true' );

		try {
			PayPal_Payments_Abilities::init();

			$this->assertNotFalse(
				has_action( 'wp_abilities_api_categories_init', array( PayPal_Payments_Abilities::class, 'register_category' ) ),
				'Category callback must be hooked when the rollout filter is enabled.'
			);
			$this->assertNotFalse(
				has_action( 'wp_abilities_api_init', array( PayPal_Payments_Abilities::class, 'register_abilities' ) ),
				'Abilities callback must be hooked when the rollout filter is enabled.'
			);
		} finally {
			remove_filter( 'jetpack_wp_abilities_enabled', '__return_true' );
		}
	}

	/**
	 * Direct register_category() / register_abilities() calls land the ability
	 * in the registry. We avoid firing the lifecycle actions to keep core's
	 * own ability registrations out of the picture.
	 */
	public function test_register_abilities_lands_in_registry() {
		if ( ! function_exists( 'wp_get_ability' ) ) {
			$this->markTestSkipped( 'Abilities API not available' );
			return;
		}

		$slug = 'jetpack-paypal-payments/list-buttons';

		// Clean slate: remove our category + ability if a previous test left them.
		if ( function_exists( 'wp_has_ability' ) && wp_has_ability( $slug ) ) {
			wp_unregister_ability( $slug );
		}
		if ( function_exists( 'wp_has_ability_category' ) && wp_has_ability_category( PayPal_Payments_Abilities::CATEGORY_SLUG ) ) {
			wp_unregister_ability_category( PayPal_Payments_Abilities::CATEGORY_SLUG );
		}

		$this->simulate_doing_wp_abilities_categories_init_action();
		PayPal_Payments_Abilities::register_category();

		$this->simulate_doing_wp_abilities_init_action();
		PayPal_Payments_Abilities::register_abilities();

		$this->assertNotNull(
			wp_get_ability( $slug ),
			'list-buttons must be registered after register_abilities() runs.'
		);

		// Clean up so we don't leak into the next test.
		if ( wp_has_ability( $slug ) ) {
			wp_unregister_ability( $slug );
		}
		if ( wp_has_ability_category( PayPal_Payments_Abilities::CATEGORY_SLUG ) ) {
			wp_unregister_ability_category( PayPal_Payments_Abilities::CATEGORY_SLUG );
		}
	}

	/**
	 * The category slug + ability slug + execute callback should agree.
	 */
	public function test_get_abilities_shape() {
		$this->assertSame( 'jetpack-paypal-payments', PayPal_Payments_Abilities::get_category_slug() );

		$abilities = PayPal_Payments_Abilities::get_abilities();
		$this->assertArrayHasKey( 'jetpack-paypal-payments/list-buttons', $abilities );

		$spec = $abilities['jetpack-paypal-payments/list-buttons'];
		$this->assertIsCallable( $spec['execute_callback'] );
		$this->assertIsCallable( $spec['permission_callback'] );
		$this->assertTrue( $spec['meta']['annotations']['readonly'] );
	}

	/*
	---------------------------------------------------------------------
	 * Permission callback tests
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Admins (have edit_posts) can view buttons.
	 */
	public function test_can_view_buttons_allows_admins() {
		wp_set_current_user( self::$admin_user_id );
		$this->assertTrue( PayPal_Payments_Abilities::can_view_buttons() );
	}

	/**
	 * Subscribers (no edit_posts) cannot view buttons.
	 */
	public function test_can_view_buttons_denies_subscribers() {
		wp_set_current_user( self::$subscriber_user_id );
		$this->assertFalse( PayPal_Payments_Abilities::can_view_buttons() );
	}

	/*
	---------------------------------------------------------------------
	 * list_buttons() execute callback tests
	 * ---------------------------------------------------------------------
	 */

	/**
	 * Returns WP_Error when the CPT isn't registered (Simple Payments not loaded).
	 */
	public function test_list_buttons_returns_wp_error_when_cpt_unavailable() {
		unregister_post_type( PayPal_Payments_Abilities::POST_TYPE );

		$result = PayPal_Payments_Abilities::list_buttons( array() );
		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'jetpack_paypal_payments_cpt_unavailable', $result->get_error_code() );
	}

	/**
	 * Returns an empty array when there are no buttons.
	 */
	public function test_list_buttons_returns_empty_when_no_buttons() {
		$result = PayPal_Payments_Abilities::list_buttons( array() );
		$this->assertSame( array(), $result );
	}

	/**
	 * Returns expected uniform shape for a published button.
	 */
	public function test_list_buttons_returns_expected_shape() {
		$id = self::make_button(
			array(
				'title'    => 'Coffee',
				'price'    => '4.25',
				'currency' => 'USD',
				'email'    => 'coffee@example.com',
			)
		);

		$result = PayPal_Payments_Abilities::list_buttons( array() );
		$this->assertIsArray( $result );
		$this->assertCount( 1, $result );

		$entry = $result[0];
		$this->assertSame( $id, $entry['id'] );
		$this->assertSame( 'Coffee', $entry['title'] );
		$this->assertSame( 4.25, $entry['price'] );
		$this->assertSame( 'USD', $entry['currency'] );
		$this->assertSame( 'coffee@example.com', $entry['recipient_email'] );
		$this->assertSame( '', $entry['button_image_url'] );
		$this->assertSame( 'publish', $entry['status'] );
		$this->assertArrayHasKey( 'edit_url', $entry );
		$this->assertArrayHasKey( 'created_at', $entry );
	}

	/**
	 * Default status (`publish`) excludes drafts.
	 */
	public function test_list_buttons_defaults_to_publish_status() {
		self::make_button(
			array(
				'title'  => 'Live',
				'status' => 'publish',
			)
		);
		self::make_button(
			array(
				'title'  => 'Draft',
				'status' => 'draft',
			)
		);

		$result = PayPal_Payments_Abilities::list_buttons( array() );
		$this->assertCount( 1, $result );
		$this->assertSame( 'Live', $result[0]['title'] );
	}

	/**
	 * `status=draft` returns drafts only.
	 */
	public function test_list_buttons_status_draft() {
		self::make_button(
			array(
				'title'  => 'Live',
				'status' => 'publish',
			)
		);
		self::make_button(
			array(
				'title'  => 'Draft',
				'status' => 'draft',
			)
		);

		$result = PayPal_Payments_Abilities::list_buttons( array( 'status' => 'draft' ) );
		$this->assertCount( 1, $result );
		$this->assertSame( 'Draft', $result[0]['title'] );
	}

	/**
	 * `status=all` returns publish + draft.
	 */
	public function test_list_buttons_status_all() {
		self::make_button(
			array(
				'title'  => 'Live',
				'status' => 'publish',
			)
		);
		self::make_button(
			array(
				'title'  => 'Draft',
				'status' => 'draft',
			)
		);

		$result = PayPal_Payments_Abilities::list_buttons( array( 'status' => 'all' ) );
		$this->assertCount( 2, $result );
	}

	/**
	 * `per_page` caps the response size.
	 */
	public function test_list_buttons_respects_per_page() {
		self::make_button( array( 'title' => 'A' ) );
		self::make_button( array( 'title' => 'B' ) );
		self::make_button( array( 'title' => 'C' ) );

		$result = PayPal_Payments_Abilities::list_buttons( array( 'per_page' => 2 ) );
		$this->assertCount( 2, $result );
	}

	/**
	 * `per_page` is clamped to [1, 100].
	 */
	public function test_list_buttons_clamps_per_page() {
		self::make_button( array( 'title' => 'A' ) );

		// Above-max is clamped to 100 (still returns the one row).
		$result = PayPal_Payments_Abilities::list_buttons( array( 'per_page' => 9999 ) );
		$this->assertCount( 1, $result );

		// Below-min is clamped to 1.
		self::make_button( array( 'title' => 'B' ) );
		$result = PayPal_Payments_Abilities::list_buttons( array( 'per_page' => 0 ) );
		$this->assertCount( 1, $result );
	}

	/**
	 * `search` filters by title.
	 */
	public function test_list_buttons_search_filters_by_title() {
		self::make_button( array( 'title' => 'Espresso' ) );
		self::make_button( array( 'title' => 'Cold Brew' ) );

		$result = PayPal_Payments_Abilities::list_buttons( array( 'search' => 'Espresso' ) );
		$this->assertCount( 1, $result );
		$this->assertSame( 'Espresso', $result[0]['title'] );
	}

	/**
	 * `button_id` short-circuit returns a single-element array on hit.
	 */
	public function test_list_buttons_button_id_returns_single_entry() {
		$a = self::make_button( array( 'title' => 'A' ) );
		$b = self::make_button( array( 'title' => 'B' ) );

		$result = PayPal_Payments_Abilities::list_buttons( array( 'button_id' => $b ) );
		$this->assertCount( 1, $result );
		$this->assertSame( $b, $result[0]['id'] );
		$this->assertSame( 'B', $result[0]['title'] );
		// Confirm we did not leak the other button.
		$this->assertNotSame( $a, $result[0]['id'] );
	}

	/**
	 * `button_id` for an unknown id returns an empty array, not WP_Error.
	 */
	public function test_list_buttons_button_id_unknown_returns_empty() {
		$result = PayPal_Payments_Abilities::list_buttons( array( 'button_id' => 999999 ) );
		$this->assertSame( array(), $result );
	}

	/**
	 * `button_id` for a non-product post returns an empty array.
	 */
	public function test_list_buttons_button_id_wrong_post_type_returns_empty() {
		$page_id = (int) wp_insert_post(
			array(
				'post_type'   => 'post',
				'post_title'  => 'Not a button',
				'post_status' => 'publish',
			)
		);

		$result = PayPal_Payments_Abilities::list_buttons( array( 'button_id' => $page_id ) );
		$this->assertSame( array(), $result );
	}

	/**
	 * `button_id <= 0` is treated as unknown id and returns [].
	 */
	public function test_list_buttons_button_id_zero_returns_empty() {
		$result = PayPal_Payments_Abilities::list_buttons( array( 'button_id' => 0 ) );
		$this->assertSame( array(), $result );
	}
}
