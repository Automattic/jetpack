<?php
/**
 * Tests for removing WordPress.org themes from the Add Themes results.
 *
 * The plan gate is not tested: it reads one feature and delegates, and an error there shows on
 * the first page view. These cover the filtering it delegates to.
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
		$result = wpcomsh_keep_only_wpcom_themes( $this->mixed_result() );

		$this->assertCount( 1, $result->themes );
		$this->assertSame( 'repose', $result->themes[0]->slug );
		$this->assertSame( 1, $result->info['results'] );
	}

	/**
	 * A result made only of our themes keeps its total, which counts every page rather than this one.
	 *
	 * Replacing the total with this page's count made the Marketplace tab report 100 themes
	 * instead of the whole catalog.
	 */
	public function test_leaves_a_result_of_our_own_themes_alone() {
		$result = wpcomsh_keep_only_wpcom_themes(
			(object) array(
				'info'   => array( 'results' => 335 ),
				'themes' => array(
					(object) array(
						'slug'           => 'repose',
						'is_wpcom_theme' => true,
					),
				),
			)
		);

		$this->assertCount( 1, $result->themes );
		$this->assertSame( 335, $result->info['results'] );
	}

	/**
	 * A theme_information result is one theme rather than a list, so there is nothing to filter.
	 */
	public function test_leaves_a_single_theme_result_alone() {
		$theme = (object) array(
			'slug' => 'repose',
			'name' => 'Repose',
		);

		$result = wpcomsh_keep_only_wpcom_themes( $theme );

		$this->assertFalse( isset( $result->themes ) );
		$this->assertSame( 'repose', $result->slug );
	}
}
