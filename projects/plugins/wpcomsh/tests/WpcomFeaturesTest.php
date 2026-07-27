<?php
/**
 * WPCOM Features Test file.
 *
 * @package wpcomsh
 */

/**
 * Class WpcomFeaturesTest.
 */
class WpcomFeaturesTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Clear the Atomic Persistent Data the tests below write, so purchases cannot leak between them.
	 *
	 * A leaked grant is the dangerous direction: it turns a later denial assertion into a confusing
	 * pass somewhere else in the suite.
	 */
	public function tear_down() {
		Atomic_Persistent_Data::delete( 'WPCOM_PURCHASES' );

		parent::tear_down();
	}

	/**
	 * Smoke-testing WPCOM Features.
	 *
	 * Pretty much just ensures there are no fatal errors, which is all we're interested in when syncing
	 * WPCOM_Features from wpcom with updates that are not used in wpcomsh.
	 */
	public function test_no_fatal_errors() {
		$this->assertTrue( wpcom_site_has_feature( WPCOM_Features::FREE_BLOG ) );

		$this->assertFalse( wpcom_site_has_feature( WPCOM_Features::PREMIUM_THEMES ) );
		$this->assertFalse( WPCOM_Features::has_feature( WPCOM_Features::PREMIUM_THEMES, array(), true ) );
	}

	/**
	 * Tests that purchases unlock features.
	 */
	public function test_works_with_persistent_data() {
		$purchase = array( 'product_slug' => 'business-bundle' );
		Atomic_Persistent_Data::set( 'WPCOM_PURCHASES', wp_json_encode( array( $purchase ), JSON_UNESCAPED_SLASHES ) );

		$this->assertTrue( wpcom_site_has_feature( WPCOM_Features::CONCIERGE_BUSINESS ) );
		$this->assertFalse( wpcom_site_has_feature( WPCOM_Features::ECOMMERCE_MANAGED_PLUGINS ) );
	}

	/**
	 * Atomic sites must receive the same baseline free-plan purchase that WPCOM-side evaluation appends.
	 *
	 * `wpcom_site_has_feature()` only reaches `add_free_plan_purchase()` when `$blog->registered` is
	 * set, and `$blog` is never populated under IS_ATOMIC because the blogs table lives WPCOM-side.
	 * The result was that feature rules nesting WPCOM_ALL_SITES inside a sub-array answered false on
	 * Atomic while WPCOM answered true for the same blog.
	 *
	 * DONATIONS is the subject because it is reachable *only* through that baseline purchase. The
	 * first assertion pins that property, so this test cannot start passing for the wrong reason if
	 * DONATIONS is ever given a top-level WPCOM_ALL_SITES entry.
	 */
	public function test_atomic_site_receives_the_baseline_free_plan_purchase() {
		$this->assertFalse(
			WPCOM_Features::has_feature( WPCOM_Features::DONATIONS, array(), 'wpcom' ),
			'DONATIONS is only a valid subject here while it stays unreachable without the baseline purchase.'
		);

		$this->assertTrue( wpcom_site_has_feature( WPCOM_Features::DONATIONS ) );
	}

	/**
	 * The baseline purchase must not carry a subscription date.
	 *
	 * Atomic has no trustworthy registration date, and `purchase_in_products_map()` reads
	 * `subscribed_date` to decide legacy date-gated rules. Passing a stand-in date instead of null
	 * would hand out features nobody granted: an old date makes both features below match their
	 * `'before'` branches. Left null, `isset()` fails and those branches stay closed.
	 */
	public function test_baseline_purchase_does_not_unlock_date_gated_features() {
		$this->assertFalse( wpcom_site_has_feature( WPCOM_Features::STATS_FREE ) );
		$this->assertFalse( wpcom_site_has_feature( WPCOM_Features::STATS_BASIC_TEMP ) );
	}

	/**
	 * Owning a paid plan is no substitute for the baseline purchase.
	 *
	 * A nested all-sites rule is keyed on the literal `wpcom-all-sites` slug, which only
	 * `add_free_plan_purchase()` produces — no real product slug matches it, however expensive. So
	 * the baseline purchase has to be appended for every Atomic site, not just for sites that have
	 * no purchase record.
	 *
	 * This is asserted against a rule built here rather than a real feature on purpose: today every
	 * nested all-sites rule in FEATURES_MAP is also reachable from a paid plan through some other
	 * branch, so no live feature can tell the two cases apart.
	 */
	public function test_paid_plans_do_not_satisfy_a_nested_all_sites_rule() {
		$rule = array( array( 'wpcom-all-sites' ) );

		$business                  = new stdClass();
		$business->product_slug    = 'business-bundle';
		$business->subscribed_date = '2024-01-01';

		$baseline = array();
		WPCOM_Features::add_free_plan_purchase( $baseline, 'wpcom', null );

		$this->assertFalse(
			WPCOM_Features::purchase_in_products_map( $business, $rule ),
			'A paid plan must not match a nested all-sites rule, or this fix would be unnecessary for paid Atomic sites.'
		);
		$this->assertTrue(
			WPCOM_Features::purchase_in_products_map( $baseline[0], $rule ),
			'The baseline purchase is the only thing that satisfies a nested all-sites rule.'
		);
	}
}
