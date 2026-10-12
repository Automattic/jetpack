<?php
/**
 * Tests for removing WordPress.org themes by plan.
 *
 * @package wpcomsh
 */

/**
 * Class WpcomThemesPlanFilterTest.
 */
class WpcomThemesPlanFilterTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A themes API result holding one theme from each source.
	 *
	 * @return stdClass
	 */
	private function mixed_result() {
		return (object) array(
			'info'   => array( 'results' => 2 ),
			'themes' => array(
				(object) array( 'slug' => 'twentytwentyfive' ),
				(object) array(
					'slug'           => 'repose',
					'is_wpcom_theme' => true,
				),
			),
		);
	}

	/**
	 * Only the WordPress.org themes go, so results from elsewhere survive.
	 *
	 * Emptying the list instead would also discard the Marketplace tab's themes, which reach this
	 * filter already in the result rather than being merged in afterwards.
	 */
	public function test_removes_dot_org_themes_and_keeps_ours() {
		// The test site has no plan, so community themes are unavailable and the filter applies.
		$this->assertFalse( wpcom_site_has_feature( WPCOM_Features::COMMUNITY_THEMES ) );

		$result = wpcomsh_remove_dot_org_themes_based_on_plan( $this->mixed_result() );

		$this->assertCount( 1, $result->themes );
		$this->assertSame( 'repose', $result->themes[0]->slug );
		$this->assertSame( 1, $result->info['results'] );
	}

	/**
	 * The entitlement half of the tier rule, against the platform's own answer.
	 */
	public function test_site_can_use_the_tiers_its_plan_includes() {
		$this->assertTrue( WPCom_Themes_Tiers::site_can_use( 'free' ) );
		// The test site has no plan, so nothing above free is included.
		$this->assertFalse( WPCom_Themes_Tiers::site_can_use( 'premium' ) );
		$this->assertFalse( WPCom_Themes_Tiers::site_can_use( 'partner' ) );
	}

	/**
	 * A theme_information result is one theme rather than a list, so there is nothing to filter.
	 */
	public function test_leaves_a_single_theme_result_alone() {
		$theme = (object) array(
			'slug' => 'repose',
			'name' => 'Repose',
		);

		$result = wpcomsh_remove_dot_org_themes_based_on_plan( $theme );

		$this->assertFalse( isset( $result->themes ) );
		$this->assertSame( 'repose', $result->slug );
	}
}
