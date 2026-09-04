<?php
/**
 * WPCOM Features products-map test file.
 *
 * @package wpcomsh
 */

// @phan-file-suppress PhanUndeclaredStaticMethod -- Atomic_Persistent_Data::set()/delete() only exist in the test mock in tests/lib/mocks, which Phan does not parse.

/**
 * Covers `WPCOM_Features::purchase_in_products_map()` rule by rule, and
 * `get_site_gating_cache_suffix()`, the cache-key fragment that has to vary on every per-site input
 * those rules consult.
 *
 * The map cases use synthetic product definitions rather than real feature slugs, so each rule is
 * exercised in isolation and the cases survive the next verbatim sync of the map from wpcom.
 */
class WpcomFeaturesMapTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A WordPress.com blog ID below the 2026 cutoff, so the fixture site starts out legacy.
	 *
	 * @var int
	 */
	const LEGACY_BLOG_ID = 123456789;

	/**
	 * Pin the WordPress.com blog ID, which on Atomic lives in `jetpack_options` rather than in
	 * `$blog_id`, and is what the gating predicate compares against the cutoff.
	 */
	public function set_up() {
		parent::set_up();

		$options       = (array) get_option( 'jetpack_options', array() );
		$options['id'] = self::LEGACY_BLOG_ID;

		update_option( 'jetpack_options', $options );
	}

	/**
	 * A leaked sticker is the dangerous direction: it turns assertions here and elsewhere in the
	 * suite into confusing passes.
	 */
	public function tear_down() {
		foreach ( self::map_sticker_slugs() as $slug ) {
			$this->remove_sticker( $slug );
		}

		$this->remove_sticker( WPCOM_Features::STICKER_FEATURE_GATING_2026 );
		$this->remove_sticker( WPCOM_Features::STICKER_PRE_FEATURE_GATING_2026 );
		$this->remove_sticker( WPCOM_Features::STICKER_GATING_BUSINESS_Q1 );

		parent::tear_down();
	}

	public function test_a_definition_without_rules_matches_on_slug_alone() {
		$map = array( array( 'business-bundle', 'ecommerce-bundle' ) );

		$this->assertTrue( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle' ), $map ) );
		$this->assertFalse( WPCOM_Features::purchase_in_products_map( $this->purchase( 'personal-bundle' ), $map ) );
	}

	public function test_before_rule_admits_only_purchases_made_before_the_cutoff() {
		$map = array(
			array(
				'before' => '2020-01-01',
				'business-bundle',
			),
		);

		$this->assertTrue( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle', '2019-06-01' ), $map ) );
		$this->assertFalse( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle', '2021-06-01' ), $map ) );
	}

	public function test_after_rule_admits_only_purchases_made_after_the_cutoff() {
		$map = array(
			array(
				'after' => '2020-01-01',
				'business-bundle',
			),
		);

		$this->assertTrue( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle', '2021-06-01' ), $map ) );
		$this->assertFalse( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle', '2019-06-01' ), $map ) );
	}

	public function test_both_date_bounds_admit_only_purchases_inside_the_range() {
		$map = array(
			array(
				'after'  => '2020-01-01',
				'before' => '2021-01-01',
				'business-bundle',
			),
		);

		$this->assertTrue( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle', '2020-06-01' ), $map ) );
		$this->assertFalse( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle', '2019-06-01' ), $map ) );
		$this->assertFalse( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle', '2021-06-01' ), $map ) );
	}

	/**
	 * A purchase with no `subscribed_date` cannot be placed in a date range, so a dated rule has to
	 * fail closed rather than treat the missing date as passing.
	 */
	public function test_a_dated_rule_rejects_a_purchase_with_no_subscribed_date() {
		$map = array(
			array(
				'before' => '2020-01-01',
				'business-bundle',
			),
		);

		$this->assertFalse( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle' ), $map ) );
	}

	/**
	 * The excluded plan is also listed in the definition below it, so the second assertion is what
	 * proves the exclusion is targeted rather than rejecting the whole map.
	 */
	public function test_an_excluded_plan_is_rejected_even_when_a_later_definition_lists_it() {
		$map = array(
			WPCOM_Features::EXCLUDE_PLANS => array( 'ecommerce-trial-bundle-monthly' ),
			array( 'ecommerce-trial-bundle-monthly', 'business-bundle' ),
		);

		$this->assertFalse( WPCOM_Features::purchase_in_products_map( $this->purchase( 'ecommerce-trial-bundle-monthly' ), $map ) );
		$this->assertTrue( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle' ), $map ) );
	}

	public function test_product_type_rule_matches_on_the_type() {
		$map      = array( array( 'product_type' => array( 'bundle' ) ) );
		$purchase = $this->purchase( 'a-slug-not-in-the-map' );

		$purchase->product_type = 'bundle';

		$this->assertTrue( WPCOM_Features::purchase_in_products_map( $purchase, $map ) );
	}

	/**
	 * A `product_type` definition `continue`s on a miss, so slugs sitting alongside it are never
	 * consulted -- worth pinning, because the definition reads as if they would be.
	 */
	public function test_product_type_rule_never_falls_through_to_its_slug_list() {
		$map      = array(
			array(
				'product_type' => array( 'bundle' ),
				'business-bundle',
			),
		);
		$purchase = $this->purchase( 'business-bundle' );

		$purchase->product_type = 'domain';

		$this->assertFalse( WPCOM_Features::purchase_in_products_map( $purchase, $map ) );
	}

	public function test_required_sticker_gates_the_definition() {
		$map = array(
			array(
				'required_sticker' => 'flex-cache-site',
				'business-bundle',
			),
		);

		$this->assertFalse( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle' ), $map ) );

		$this->add_sticker( 'flex-cache-site' );

		$this->assertTrue( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle' ), $map ) );
	}

	public function test_sticker_not_present_withdraws_the_definition_once_the_sticker_lands() {
		$map = array(
			array(
				'sticker_not_present' => 'flex-cache-site',
				'business-bundle',
			),
		);

		$this->assertTrue( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle' ), $map ) );

		$this->add_sticker( 'flex-cache-site' );

		$this->assertFalse( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle' ), $map ) );
	}

	public function test_before_feature_gating_2026_grants_only_while_the_site_is_legacy() {
		$map = array(
			array(
				'before_feature_gating_2026' => true,
				'business-bundle',
			),
		);

		$this->assertTrue( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle' ), $map ) );

		$this->add_sticker( WPCOM_Features::STICKER_FEATURE_GATING_2026 );

		$this->assertFalse( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle' ), $map ) );
	}

	/**
	 * The map only ever sets this key to true today, but the comparison is written to accept either
	 * value, so the false arm is reachable the moment someone writes it.
	 */
	public function test_before_feature_gating_2026_false_grants_only_off_legacy() {
		$map = array(
			array(
				'before_feature_gating_2026' => false,
				'business-bundle',
			),
		);

		$this->assertFalse( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle' ), $map ) );

		$this->add_sticker( WPCOM_Features::STICKER_FEATURE_GATING_2026 );

		$this->assertTrue( WPCOM_Features::purchase_in_products_map( $this->purchase( 'business-bundle' ), $map ) );
	}

	public function test_cache_suffix_names_the_gating_cohort() {
		$blog_id = _wpcom_get_current_blog_id();

		$this->assertSame( '_pre_gating_2026', WPCOM_Features::get_site_gating_cache_suffix( $blog_id ) );

		$this->add_sticker( WPCOM_Features::STICKER_FEATURE_GATING_2026 );

		$this->assertSame( '_gating_2026', WPCOM_Features::get_site_gating_cache_suffix( $blog_id ) );
	}

	/**
	 * The whole point of the suffix: two sites the map answers differently for must not share a
	 * cache key. A sticker the map gates on that does not reach the suffix serves one site's feature
	 * list to the other.
	 */
	public function test_cache_suffix_varies_on_every_sticker_the_map_gates_on() {
		$blog_id = _wpcom_get_current_blog_id();
		$slugs   = self::map_sticker_slugs();
		$base    = WPCOM_Features::get_site_gating_cache_suffix( $blog_id );

		$this->assertNotEmpty( $slugs, 'Without slugs this test asserts nothing at all.' );

		foreach ( $slugs as $slug ) {
			$this->add_sticker( $slug );
			$suffix = WPCOM_Features::get_site_gating_cache_suffix( $blog_id );
			$this->remove_sticker( $slug );

			$this->assertNotSame( $base, $suffix, "Setting '$slug' must change the cache suffix." );
			$this->assertStringContainsString( $slug, $suffix );
		}
	}

	/**
	 * The suffix goes into a key in the global `site_purchases` cache group, so it has to be a
	 * function of which stickers are set, never of the order they were written in.
	 */
	public function test_cache_suffix_is_ordered_independently_of_when_stickers_were_added() {
		$blog_id = _wpcom_get_current_blog_id();
		$slugs   = self::map_sticker_slugs();
		$sorted  = $slugs;
		sort( $sorted );

		$this->assertSame( $sorted, $slugs, 'The slug list has to be sorted, or the key changes shape between requests.' );
		$this->assertSame( array_unique( $slugs ), $slugs, 'A duplicated slug would be appended twice.' );

		foreach ( $slugs as $slug ) {
			$this->add_sticker( $slug );
		}
		$forward = WPCOM_Features::get_site_gating_cache_suffix( $blog_id );

		foreach ( $slugs as $slug ) {
			$this->remove_sticker( $slug );
		}
		foreach ( array_reverse( $slugs ) as $slug ) {
			$this->add_sticker( $slug );
		}

		$this->assertSame( $forward, WPCOM_Features::get_site_gating_cache_suffix( $blog_id ) );
	}

	public function test_add_free_plan_purchase_appends_a_synthetic_purchase() {
		$purchases = array( $this->purchase( 'business-bundle' ) );

		WPCOM_Features::add_free_plan_purchase( $purchases, 'wpcom', '2020-05-04 01:02:03' );

		$this->assertCount( 2, $purchases );
		$this->assertSame( 'wpcom-all-sites', $purchases[1]->product_slug );
		$this->assertSame( '2020-05-04 01:02:03', $purchases[1]->subscribed_date );
	}

	/**
	 * Why the synthetic purchase carries the registration date: a free site can only clear a dated
	 * all-sites rule if it has a date to be judged on.
	 */
	public function test_free_plan_purchase_can_satisfy_a_dated_all_sites_rule() {
		$map       = array(
			array(
				'before' => '2021-01-01',
				'wpcom-all-sites',
			),
		);
		$purchases = array();

		WPCOM_Features::add_free_plan_purchase( $purchases, 'wpcom', '2020-05-04' );

		$this->assertTrue( WPCOM_Features::purchase_in_products_map( $purchases[0], $map ) );
	}

	public function test_in_array_recursive_finds_needles_at_any_depth() {
		$haystack = array( 'a', array( 'b', array( 'c' ) ) );

		$this->assertTrue( WPCOM_Features::in_array_recursive( 'a', $haystack ) );
		$this->assertTrue( WPCOM_Features::in_array_recursive( 'c', $haystack ) );
		$this->assertFalse( WPCOM_Features::in_array_recursive( 'd', $haystack ) );
	}

	/**
	 * Comparison is strict, which is what stops a numeric-looking product slug from matching an
	 * unrelated integer in the map.
	 */
	public function test_in_array_recursive_compares_strictly() {
		$this->assertFalse( WPCOM_Features::in_array_recursive( '0', array( 0 ) ) );
		$this->assertFalse( WPCOM_Features::in_array_recursive( 1, array( '1' ) ) );
	}

	public function test_an_unknown_feature_is_never_granted() {
		$this->assertFalse( WPCOM_Features::feature_exists( 'not-a-real-feature' ) );
		$this->assertTrue( WPCOM_Features::feature_exists( WPCOM_Features::PREMIUM_THEMES ) );

		$this->assertFalse(
			WPCOM_Features::has_feature( 'not-a-real-feature', array( $this->purchase( 'business-bundle' ) ), 'wpcom' )
		);
	}

	public function test_get_feature_slugs_lists_mapped_features() {
		$slugs = WPCOM_Features::get_feature_slugs();

		$this->assertNotEmpty( $slugs );
		$this->assertContains( WPCOM_Features::PREMIUM_THEMES, $slugs );
		$this->assertContains( WPCOM_Features::FREE_BLOG, $slugs );
	}

	/**
	 * Build a purchase in the shape `purchase_in_products_map()` reads.
	 *
	 * @param string      $slug            Product slug.
	 * @param string|null $subscribed_date Subscription date, or null to leave the property unset.
	 *
	 * @return stdClass
	 */
	private function purchase( $slug, $subscribed_date = null ) {
		$purchase               = new stdClass();
		$purchase->product_slug = $slug;

		if ( null !== $subscribed_date ) {
			$purchase->subscribed_date = $subscribed_date;
		}

		return $purchase;
	}

	/**
	 * The sticker slugs the products map gates on, read from the private helper that builds them.
	 *
	 * Reflection rather than a hard-coded list so a sticker added upstream is covered by the cases
	 * above on the next sync instead of silently going untested.
	 *
	 * @return string[]
	 */
	private static function map_sticker_slugs() {
		return ( new ReflectionMethod( 'WPCOM_Features', 'get_map_sticker_slugs' ) )->invoke( null );
	}

	/**
	 * Add a blog sticker the way the Atomic platform does, by writing its persistent-data key.
	 *
	 * @param string $sticker Sticker slug.
	 */
	private function add_sticker( $sticker ) {
		Atomic_Persistent_Data::set( 'site_sticker_' . $sticker, '1' );
	}

	/**
	 * Remove a blog sticker written by `add_sticker()`.
	 *
	 * @param string $sticker Sticker slug.
	 */
	private function remove_sticker( $sticker ) {
		Atomic_Persistent_Data::delete( 'site_sticker_' . $sticker );
	}
}
