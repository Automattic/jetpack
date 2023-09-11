<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Stats_Admin\Test_Case as Stats_Test_Case;

/**
 * Unit tests for the Notice class.
 *
 * @package automattic/jetpack-stats-admin
 */
class Test_Notices extends Stats_Test_Case {
	/**
	 * Holds the Notices instance.
	 *
	 * @var Notices
	 */
	protected static $notices;

	/**
	 * Setting up the test.
	 *
	 * @before
	 */
	public function set_up() {
		parent::set_up();
		Stats_Options::set_option( 'enable_odyssey_stats', true );
		Stats_Options::set_option( 'notices', array() );
		Stats_Options::set_option( 'views', 0 );
		self::$notices = new Notices();
	}

	/**
	 * Test opt out new stats show.
	 */
	public function test_opt_out_new_stats_show() {
		$this->assertTrue( self::$notices->get_notices_to_show()['opt_out_new_stats'] );

		Stats_Options::set_option( 'views', 2 );
		$this->assertTrue( self::$notices->get_notices_to_show()['opt_out_new_stats'] );

		Stats_Options::set_option( 'views', 3 );
		$this->assertFalse( self::$notices->get_notices_to_show()['opt_out_new_stats'] );
	}

	/**
	 * Test new stats feedback notice show.
	 */
	public function test_new_stats_feedback_notice_show() {
		Stats_Options::set_option( 'views', 3 );
		$this->assertTrue( self::$notices->get_notices_to_show()['new_stats_feedback'] );
	}

	/**
	 * Test opt in new stats notice show.
	 */
	public function test_opt_in_new_stats_notice_show() {
		Stats_Options::set_option( 'enable_odyssey_stats', false );
		Stats_Options::set_option( 'odyssey_stats_changed_at', time() - 31 * DAY_IN_SECONDS );
		$this->assertTrue( self::$notices->get_notices_to_show()['opt_in_new_stats'] );
	}

	/**
	 * Test opt in new stats notice show.
	 */
	public function test_traffic_page_settings_hidden() {
		$this->assertFalse( self::$notices->get_notices_to_show()['traffic_page_settings'] );
	}
}
