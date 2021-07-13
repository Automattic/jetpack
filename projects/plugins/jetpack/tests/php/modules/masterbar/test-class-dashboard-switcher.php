<?php
/**
 * Tests for Dashboard_Switcher
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Dashboard_Customizations\Dashboard_Switcher;

require_jetpack_file( 'modules/masterbar/admin-menu/class-dashboard-switcher.php' );

/**
 * Class Test_Admin_Menu
 *
 * @coversDefaultClass Automattic\Jetpack\Dashboard_Customizations\Admin_Menu
 */
class Test_Dashboard_Switcher extends WP_UnitTestCase {

	/**
	 * A site domain.
	 *
	 * @var string
	 */
	public static $domain = 'test.com';

	/**
	 * Check if the dashboard switcher is registered correctly.
	 */
	public function test_register_dashboard_switcher() {
		global $pagenow;
		$pagenow = 'edit.php?post_type=feedback';

		$output = ( new Dashboard_Switcher( self::$domain ) )->register_dashboard_switcher( '' );
		$this->assertNull( $output );

		$screens = array(
			'edit.php'                             => 'https://wordpress.com/posts/',
			'edit.php?post_type=page'              => 'https://wordpress.com/pages/',
			'edit.php?post_type=jetpack-portfolio' => 'https://wordpress.com/types/jetpack-portfolio/',
			'edit-tags.php?taxonomy=category'      => 'https://wordpress.com/settings/taxonomies/category/',
		);

		foreach ( $screens as $screen => $mapping ) {
			$pagenow  = $screen;
			$output   = ( new Dashboard_Switcher( self::$domain ) )->register_dashboard_switcher( '' );
			$expected = sprintf(
				'<div id="dashboard-switcher"><h5>%s</h5><p class="dashboard-switcher-text">%s</p><a class="button button-primary dashboard-switcher-button" href="%s">%s</a></div>',
				__( 'Screen features', 'jetpack' ),
				__( 'Currently you are seeing the classic WP-Admin view of this page. Would you like to see the default WordPress.com view?', 'jetpack' ),
				$mapping . static::$domain,
				__( 'Use WordPress.com view', 'jetpack' )
			);

			$this->assertEquals( $expected, $output );
		}
	}
}
