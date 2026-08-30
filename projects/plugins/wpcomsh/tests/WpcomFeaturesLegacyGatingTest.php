<?php
/**
 * Legacy feature gating test file.
 *
 * @package wpcomsh
 */

// @phan-file-suppress PhanUndeclaredStaticMethod -- Atomic_Persistent_Data::set()/delete() only exist in the test mock in tests/lib/mocks, which Phan does not parse.

/**
 * Covers the sticker plumbing WPCOM_Features uses on Atomic: `is_legacy_gating_site()`, the single
 * predicate that decides whether a site stays on the pre-2026 feature gating, and the
 * `required_sticker` / `sticker_not_present` keys in the products map that read the same helper.
 *
 * Ported from the wpcom-side LegacyGatingSiteTest, with the differences that matter on Atomic:
 *
 * - Stickers are not read from the `blog_stickers` table but from Atomic Persistent Data, via
 *   `wpcomsh_is_site_sticker_active()`, which can only ever answer for the current site.
 * - The blog ID the predicate compares against is the *WordPress.com* blog ID, which
 *   `_wpcom_get_current_blog_id()` reads from the `jetpack_options` option -- so these tests move
 *   the site across the cutoff by writing that option rather than by passing a synthetic ID.
 * - Consequently a call about any other site is a caller bug, and gets its own case below.
 */
class WpcomFeaturesLegacyGatingTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A WordPress.com blog ID comfortably below the cutoff, standing in for a site created long
	 * before the 2026 gating shipped.
	 *
	 * @var int
	 */
	const LEGACY_BLOG_ID = 123456789;

	/**
	 * Point `_wpcom_get_current_blog_id()` at a known WordPress.com blog ID.
	 *
	 * Every test sets this explicitly: without it the site falls back to `get_current_blog_id()`,
	 * and a fixture blog ID of 1 would make the below-the-cutoff cases pass for the wrong reason.
	 */
	public function set_up() {
		parent::set_up();

		$this->set_wpcom_blog_id( self::LEGACY_BLOG_ID );
	}

	/**
	 * Clear the stickers these tests write.
	 *
	 * A leaked sticker is the dangerous direction: it would turn the assertions here -- and
	 * anywhere else in the suite that reads a sticker -- into confusing passes.
	 */
	public function tear_down() {
		Atomic_Persistent_Data::delete( 'site_sticker_' . WPCOM_Features::STICKER_FEATURE_GATING_2026 );
		Atomic_Persistent_Data::delete( 'site_sticker_' . WPCOM_Features::STICKER_PRE_FEATURE_GATING_2026 );
		Atomic_Persistent_Data::delete( 'site_sticker_' . WPCOM_Features::STICKER_GATING_BUSINESS_Q1 );

		parent::tear_down();
	}

	/**
	 * Guards every sticker case below.
	 *
	 * The fixture site has to sit below the cutoff, otherwise `is_legacy_gating_site()` already
	 * returns false on the blog ID alone and the "sticker took this site off legacy" assertions
	 * would prove nothing.
	 */
	public function test_fixture_blog_sits_below_the_cutoff() {
		$this->assertLessThan(
			WPCOM_Features::FEATURE_GATING_2026_CUTOFF_BLOG_ID,
			_wpcom_get_current_blog_id(),
			'The fixture blog ID must be below the cutoff, or the sticker precedence cases in this file prove nothing.'
		);
	}

	/**
	 * The default for everything created before the universal creation hook shipped.
	 */
	public function test_site_below_cutoff_without_stickers_is_legacy() {
		$this->assertTrue( WPCOM_Features::is_legacy_gating_site( self::LEGACY_BLOG_ID ) );
	}

	/**
	 * The cutoff is the first ID that is *not* legacy, so the boundary value itself must be
	 * excluded. 256966305 is the first blog registered at/after 2026-08-25 22:00 UTC and it does
	 * carry `gating-business-q1`.
	 */
	public function test_cutoff_blog_id_itself_is_not_legacy() {
		$cutoff = WPCOM_Features::FEATURE_GATING_2026_CUTOFF_BLOG_ID;
		$this->set_wpcom_blog_id( $cutoff );

		$this->assertFalse( WPCOM_Features::is_legacy_gating_site( $cutoff ) );
	}

	/**
	 * One below the cutoff is still legacy -- the other half of the boundary.
	 */
	public function test_blog_id_just_below_the_cutoff_is_legacy() {
		$below = WPCOM_Features::FEATURE_GATING_2026_CUTOFF_BLOG_ID - 1;
		$this->set_wpcom_blog_id( $below );

		$this->assertTrue( WPCOM_Features::is_legacy_gating_site( $below ) );
	}

	public function test_site_above_cutoff_is_not_legacy() {
		$above = WPCOM_Features::FEATURE_GATING_2026_CUTOFF_BLOG_ID + 1;
		$this->set_wpcom_blog_id( $above );

		$this->assertFalse( WPCOM_Features::is_legacy_gating_site( $above ) );
	}

	/**
	 * ~2.0M sites below the cutoff already carry `gating-business-q1` -- the Jan-Jun 2026
	 * experiment cohort plus everything `POST /sites/new` stickered before the creation hook went
	 * universal. They are already on the new gating, so "below the cutoff" alone must not make a
	 * site legacy.
	 */
	public function test_gating_business_q1_takes_a_pre_cutoff_site_off_legacy() {
		$this->add_sticker( WPCOM_Features::STICKER_GATING_BUSINESS_Q1 );

		$this->assertFalse( WPCOM_Features::is_legacy_gating_site( self::LEGACY_BLOG_ID ) );
	}

	/**
	 * The staging case, and the reason the predicate is ordered rather than a set of AND-ed checks.
	 *
	 * A staging site cloned from a legacy production site carries both stickers: the creation hook
	 * gives every new blog `gating-business-q1`, and the staging hook then marks it as mirroring a
	 * legacy site. The mirror has to win, or the backfill would have to remove stickers.
	 */
	public function test_pre_feature_gating_2026_beats_gating_business_q1() {
		$this->add_sticker( WPCOM_Features::STICKER_GATING_BUSINESS_Q1 );
		$this->add_sticker( WPCOM_Features::STICKER_PRE_FEATURE_GATING_2026 );

		$this->assertTrue( WPCOM_Features::is_legacy_gating_site( self::LEGACY_BLOG_ID ) );
	}

	/**
	 * Graduation is one-way and absolute: it outranks the legacy mirror, so a staging site whose
	 * production site has since bought a plan follows it forward.
	 */
	public function test_feature_gating_2026_beats_pre_feature_gating_2026() {
		$this->add_sticker( WPCOM_Features::STICKER_GATING_BUSINESS_Q1 );
		$this->add_sticker( WPCOM_Features::STICKER_PRE_FEATURE_GATING_2026 );
		$this->add_sticker( WPCOM_Features::STICKER_FEATURE_GATING_2026 );

		$this->assertFalse( WPCOM_Features::is_legacy_gating_site( self::LEGACY_BLOG_ID ) );
	}

	/**
	 * The ordinary graduation path: a legacy site buys a plan and never goes back, even though its
	 * blog ID stays below the cutoff forever.
	 */
	public function test_feature_gating_2026_alone_graduates_a_pre_cutoff_site() {
		$this->add_sticker( WPCOM_Features::STICKER_FEATURE_GATING_2026 );

		$this->assertFalse( WPCOM_Features::is_legacy_gating_site( self::LEGACY_BLOG_ID ) );
	}

	/**
	 * The production case for `pre-feature-gating-2026`, and the only one that binds this branch.
	 *
	 * Every real staging site is a brand new blog, so its ID is above the cutoff and the marker is
	 * the sole reason it evaluates as legacy. Below the cutoff the final
	 * `$blog_id < FEATURE_GATING_2026_CUTOFF_BLOG_ID` fallthrough already returns true, and the
	 * marker branch could be deleted outright without failing anything.
	 *
	 * Hence the control assertion: without it, restricting the marker branch to below-cutoff IDs
	 * would still pass.
	 */
	public function test_pre_feature_gating_2026_makes_an_above_cutoff_site_legacy() {
		$above = WPCOM_Features::FEATURE_GATING_2026_CUTOFF_BLOG_ID + 1;
		$this->set_wpcom_blog_id( $above );

		$this->assertFalse(
			WPCOM_Features::is_legacy_gating_site( $above ),
			'Control: above the cutoff and unstickered, a site is not legacy. If this fails the case below proves nothing.'
		);

		$this->add_sticker( WPCOM_Features::STICKER_PRE_FEATURE_GATING_2026 );

		$this->assertTrue(
			WPCOM_Features::is_legacy_gating_site( $above ),
			'The marker has to override the blog ID, or staging sites of legacy production sites get the new gating.'
		);
	}

	/**
	 * Graduation has to outrank the marker at above-cutoff IDs too -- the staging site of a
	 * production site that later buys a plan follows it forward.
	 */
	public function test_feature_gating_2026_beats_the_marker_above_the_cutoff() {
		$above = WPCOM_Features::FEATURE_GATING_2026_CUTOFF_BLOG_ID + 1;
		$this->set_wpcom_blog_id( $above );

		$this->add_sticker( WPCOM_Features::STICKER_PRE_FEATURE_GATING_2026 );
		$this->add_sticker( WPCOM_Features::STICKER_FEATURE_GATING_2026 );

		$this->assertFalse( WPCOM_Features::is_legacy_gating_site( $above ) );
	}

	/**
	 * The Atomic-only guard, and the reason `is_legacy_gating_site()` takes a required blog ID.
	 *
	 * `wpcomsh_is_site_sticker_active()` reads Atomic Persistent Data, which only ever holds the
	 * current site's stickers. Asked about any other site the answer would silently describe this
	 * one, so the call is flagged and fails safe to "legacy" instead.
	 *
	 * The graduation sticker is set to prove the guard runs *before* the sticker checks: without
	 * it, this site is not legacy, so a true here can only come from the guard.
	 */
	public function test_asking_about_another_site_is_flagged_and_fails_safe_to_legacy() {
		$this->add_sticker( WPCOM_Features::STICKER_FEATURE_GATING_2026 );
		$this->assertFalse(
			WPCOM_Features::is_legacy_gating_site( self::LEGACY_BLOG_ID ),
			'Control: this site has graduated. If this fails the case below proves nothing.'
		);

		$this->setExpectedIncorrectUsage( 'WPCOM_Features::is_legacy_gating_site' );

		$this->assertTrue( WPCOM_Features::is_legacy_gating_site( self::LEGACY_BLOG_ID + 1 ) );
	}

	/**
	 * `required_sticker` in the products map goes through the same helper, so a plan that only
	 * unlocks a feature for stickered sites has to stay locked without the sticker.
	 *
	 * ADVANCED_SEO grants Premium plans access only behind `gating-business-q1`; Premium appears
	 * nowhere else in that feature's map.
	 */
	public function test_required_sticker_gates_a_purchase_on_atomic() {
		$purchases = array( (object) array( 'product_slug' => 'value_bundle' ) );

		$this->assertFalse(
			WPCOM_Features::has_feature( WPCOM_Features::ADVANCED_SEO, $purchases, 'wpcom' ),
			'Without the sticker a Premium plan must not unlock Advanced SEO.'
		);

		$this->add_sticker( WPCOM_Features::STICKER_GATING_BUSINESS_Q1 );

		$this->assertTrue(
			WPCOM_Features::has_feature( WPCOM_Features::ADVANCED_SEO, $purchases, 'wpcom' )
		);
	}

	/**
	 * The mirror image: `sticker_not_present` withdraws a legacy grant once the site is stickered.
	 *
	 * DONATIONS is available to Personal and higher only while `gating-business-q1` is absent;
	 * under the new gating it starts at Premium.
	 */
	public function test_sticker_not_present_gates_a_purchase_on_atomic() {
		$purchases = array( (object) array( 'product_slug' => 'personal-bundle' ) );

		$this->assertTrue(
			WPCOM_Features::has_feature( WPCOM_Features::DONATIONS, $purchases, 'wpcom' ),
			'Without the sticker a Personal plan keeps the legacy Donations grant.'
		);

		$this->add_sticker( WPCOM_Features::STICKER_GATING_BUSINESS_Q1 );

		$this->assertFalse(
			WPCOM_Features::has_feature( WPCOM_Features::DONATIONS, $purchases, 'wpcom' )
		);
	}

	/**
	 * Set the WordPress.com blog ID `_wpcom_get_current_blog_id()` reports for this site.
	 *
	 * On Atomic that ID lives in the `jetpack_options` option rather than in `$blog_id`, and it is
	 * the one `is_legacy_gating_site()` compares against the cutoff.
	 *
	 * @param int $blog_id WordPress.com blog ID.
	 */
	private function set_wpcom_blog_id( $blog_id ) {
		$options       = (array) get_option( 'jetpack_options', array() );
		$options['id'] = $blog_id;

		update_option( 'jetpack_options', $options );
	}

	/**
	 * Add a blog sticker the way the Atomic platform does, by writing its persistent-data key.
	 *
	 * @param string $sticker Sticker slug.
	 */
	private function add_sticker( $sticker ) {
		Atomic_Persistent_Data::set( 'site_sticker_' . $sticker, '1' );
	}
}
