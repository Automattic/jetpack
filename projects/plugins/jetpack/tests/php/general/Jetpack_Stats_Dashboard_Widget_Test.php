<?php
/**
 * Tests for the Jetpack Stats dashboard widget setup.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . 'class-jetpack-stats-dashboard-widget.php';

/**
 * Tests for Jetpack_Stats_Dashboard_Widget.
 *
 * @covers \Jetpack_Stats_Dashboard_Widget
 */
#[CoversClass( Jetpack_Stats_Dashboard_Widget::class )]
class Jetpack_Stats_Dashboard_Widget_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Atomic reports a site with a blog token but no connected owner as not ready.
	 */
	public function test_widget_skipped_while_the_connection_is_not_ready() {
		$reached = false;
		$spy     = function () use ( &$reached ) {
			$reached = true;
			return false;
		};
		add_filter( 'jetpack_stats_dashboard_widget_show_to_user', $spy );
		add_filter( 'jetpack_is_connection_ready', '__return_false' );

		try {
			Jetpack_Stats_Dashboard_Widget::wp_dashboard_setup();
		} finally {
			remove_filter( 'jetpack_stats_dashboard_widget_show_to_user', $spy );
			remove_filter( 'jetpack_is_connection_ready', '__return_false' );
		}

		$this->assertFalse( $reached );
	}
}
