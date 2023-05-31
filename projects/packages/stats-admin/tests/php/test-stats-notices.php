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
	}

	/**
	 * Test opt out new stats notice dismissed.
	 */
	public function test_opt_out_new_stats_notice_dismissed() {
		self::$notices->update_notice( 'opt_out_new_stats', 'dismissed' );
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
	 * Test new stats feedback notice dismissed.
	 */
	public function test_new_stats_feedback_notice_dismissed() {
		self::$notices->update_notice( 'new_stats_feedback', 'dismissed' );
		self::$notices->update_notice( 'opt_out_new_stats', 'dismissed' );
		$this->assertFalse( self::$notices->get_notices_to_show()['new_stats_feedback'] );
		$this->assertFalse( self::$notices->get_notices_to_show()['opt_out_new_stats'] );
	}

	/**
	 * Test new stats feedback notice dismissed.
	 */
	public function test_new_stats_feedback_notice_postponed() {
		self::$notices->update_notice( 'new_stats_feedback', 'postponed', 10000 );
		self::$notices->update_notice( 'opt_out_new_stats', 'dismissed' );
		$stored_notices = Stats_Options::get_option( 'notices' );

		$this->assertGreaterThanOrEqual( time(), $stored_notices['new_stats_feedback']['next_show_at'] );
		$this->assertFalse( self::$notices->get_notices_to_show()['new_stats_feedback'] );
		$this->assertFalse( self::$notices->get_notices_to_show()['opt_out_new_stats'] );
	}

	/**
	 * Test new stats feedback notice postponed and show again.
	 */
	public function test_new_stats_feedback_notice_postponed_show_again() {
		self::$notices->update_notice( 'new_stats_feedback', 'postponed', 10000 );
		self::$notices->update_notice( 'opt_out_new_stats', 'dismissed' );
		Stats_Options::set_option( 'views', 3 );

		$stored_notices                                       = Stats_Options::get_option( 'notices' );
		$stored_notices['new_stats_feedback']['next_show_at'] = time() - 1;
		Stats_Options::set_option( 'notices', $stored_notices );

		$this->assertTrue( self::$notices->get_notices_to_show()['new_stats_feedback'] );
		$this->assertFalse( self::$notices->get_notices_to_show()['opt_out_new_stats'] );
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
	 * Test get views.
	 */
	public function test_get_new_stats_views() {
		Stats_Options::set_option( 'views', 3 );
		$this->assertEquals( 3, self::$notices->get_new_stats_views() );
	}

	/**
	 * Test is notice hidden.
	 */
	public function test_is_notice_hidden() {
		$this->assertFalse( self::$notices->is_notice_hidden( 'opt_in_new_stats' ) );
		self::$notices->update_notice( 'opt_in_new_stats', 'dismissed' );
		$this->assertTrue( self::$notices->is_notice_hidden( 'opt_in_new_stats' ) );
		self::$notices->update_notice( 'opt_in_new_stats', 'postponed' );
		$this->assertTrue( self::$notices->is_notice_hidden( 'opt_in_new_stats' ) );
	}

	/**
	 * Test get hidden notices.
	 */
	public function test_get_hidden_notices() {
		$this->assertEmpty( self::$notices->get_hidden_notices( 'opt_in_new_stats' ) );
		self::$notices->update_notice( 'opt_in_new_stats', 'dismissed' );
		self::$notices->update_notice( 'new_stats_feedback', 'postponed' );

		$this->assertArrayHasKey( 'opt_in_new_stats', self::$notices->get_hidden_notices() );
		$this->assertArrayHasKey( 'new_stats_feedback', self::$notices->get_hidden_notices() );

		$stored_notices                                       = Stats_Options::get_option( 'notices' );
		$stored_notices['new_stats_feedback']['next_show_at'] = time() - 1;
		Stats_Options::set_option( 'notices', $stored_notices );

		$this->assertArrayNotHasKey( 'new_stats_feedback', self::$notices->get_hidden_notices() );
	}

}
