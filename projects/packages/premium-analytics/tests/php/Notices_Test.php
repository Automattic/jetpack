<?php
/**
 * Tests for the ported Notices class.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Stats\Options as Stats_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use WorDBless\BaseTestCase;

/**
 * The WPCOM dismissal fetch fails closed to an empty array in the test environment (no connection),
 * so these exercise the locally-derived flags layered on top of it.
 *
 * @covers \Automattic\Jetpack\PremiumAnalytics\Notices
 */
#[CoversClass( Notices::class )]
class Notices_Test extends BaseTestCase {

	/**
	 * Notices instance under test.
	 *
	 * @var Notices
	 */
	private $notices;

	/**
	 * Set up a known stats-options baseline.
	 */
	public function set_up() {
		parent::set_up();
		Stats_Options::set_option( 'enable_odyssey_stats', true );
		Stats_Options::set_option( 'views', 0 );
		Stats_Options::set_option( 'odyssey_stats_changed_at', 0 );
		delete_transient( Notices::NOTICES_CACHE_KEY );
		$this->notices = new Notices();
	}

	public function test_opt_out_notice_shows_below_the_feedback_view_threshold() {
		$this->assertTrue( $this->notices->get_notices_to_show()[ Notices::OPT_OUT_NEW_STATS_NOTICE_ID ] );

		Stats_Options::set_option( 'views', Notices::VIEWS_TO_SHOW_FEEDBACK );
		$this->assertFalse( $this->notices->get_notices_to_show()[ Notices::OPT_OUT_NEW_STATS_NOTICE_ID ] );
	}

	public function test_feedback_notice_shows_at_the_view_threshold() {
		Stats_Options::set_option( 'views', Notices::VIEWS_TO_SHOW_FEEDBACK );
		$this->assertTrue( $this->notices->get_notices_to_show()[ Notices::NEW_STATS_FEEDBACK_NOTICE_ID ] );
	}

	public function test_opt_in_notice_shows_after_postpone_window_when_disabled() {
		Stats_Options::set_option( 'enable_odyssey_stats', false );
		Stats_Options::set_option( 'odyssey_stats_changed_at', time() - ( Notices::POSTPONE_OPT_IN_NOTICE_DAYS + 1 ) * DAY_IN_SECONDS );
		$this->assertTrue( $this->notices->get_notices_to_show()[ Notices::OPT_IN_NEW_STATS_NOTICE_ID ] );
	}

	public function test_opt_in_notice_hidden_within_postpone_window() {
		Stats_Options::set_option( 'enable_odyssey_stats', false );
		Stats_Options::set_option( 'odyssey_stats_changed_at', time() );
		$this->assertFalse( $this->notices->get_notices_to_show()[ Notices::OPT_IN_NEW_STATS_NOTICE_ID ] );
	}

	public function test_gdpr_notice_reflects_complianz_presence() {
		// Negative case first — a class can't be undefined, so the positive case below would leak
		// the `COMPLIANZ` alias into a separate negative test.
		$this->assertFalse( $this->notices->get_notices_to_show()[ Notices::GDPR_COOKIE_CONSENT_NOTICE_ID ] );

		require_once __DIR__ . '/fixtures/class-complianz-stub.php';
		class_alias( Complianz_Stub::class, 'COMPLIANZ' );

		// No `jetpack` key in the integrations option means Jetpack is treated as blocked.
		delete_option( 'complianz_options_integrations' );
		delete_transient( Notices::NOTICES_CACHE_KEY );

		$this->assertTrue( ( new Notices() )->get_notices_to_show()[ Notices::GDPR_COOKIE_CONSENT_NOTICE_ID ] );
	}

	public function test_wpcom_dismissal_fetch_fails_closed_to_empty_array() {
		$this->assertSame( array(), $this->notices->get_notices_from_wpcom() );
	}

	public function test_bypass_cache_still_resolves_the_flags() {
		set_transient( Notices::NOTICES_CACHE_KEY, wp_json_encode( array( Notices::OPT_OUT_NEW_STATS_NOTICE_ID => false ), JSON_UNESCAPED_SLASHES ), Notices::CACHE_TTL );

		// With the cache bypassed the stored map is ignored; the live fetch fails closed to [] here,
		// so the opt-out flag is no longer suppressed by the cached dismissal.
		$this->assertTrue( $this->notices->get_notices_to_show( true )[ Notices::OPT_OUT_NEW_STATS_NOTICE_ID ] );
	}

	public function test_is_notice_hidden_false_when_no_wpcom_state() {
		$this->assertFalse( $this->notices->is_notice_hidden( Notices::OPT_OUT_NEW_STATS_NOTICE_ID ) );
	}

	public function test_update_notice_returns_error_without_a_connection() {
		$this->assertInstanceOf( \WP_Error::class, $this->notices->update_notice( 'opt_out_new_stats', 'dismissed' ) );
	}
}
