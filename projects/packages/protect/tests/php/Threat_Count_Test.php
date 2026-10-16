<?php
/**
 * Tests for the Protect threat count.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Menu_Badges\Notification_Counts;
use Automattic\Jetpack\Protect_Models\Status_Model;
use Automattic\Jetpack\Protect_Status\Protect_Status;
use Automattic\Jetpack\Protect_Status\Status;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Threat_Count
 */
#[CoversClass( Threat_Count::class )]
class Threat_Count_Test extends BaseTestCase {

	/**
	 * Leave no count, status, back-off, user or script behind.
	 */
	public function tear_down() {
		Notification_Counts::reset();
		Status::$status = null;
		Protect_Status::delete_option();
		delete_transient( Threat_Count::BACKOFF_TRANSIENT );
		wp_dequeue_script( Threat_Count::SCRIPT_HANDLE );
		wp_deregister_script( Threat_Count::SCRIPT_HANDLE );
		wp_deregister_script( 'jetpack-menu-badges' );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Sign in a user with the given role.
	 *
	 * @param string $role Role name.
	 */
	private function sign_in( $role ) {
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => $role,
					'user_pass'  => 'pass',
					'role'       => $role,
				)
			)
		);
	}

	/**
	 * Store a Protect report listing one WordPress core vulnerability.
	 *
	 * @param int $expires_in Seconds until the stored report expires; negative when it already has.
	 */
	private function store_report( $expires_in ) {
		update_option(
			Protect_Status::OPTION_NAME,
			(object) array(
				'last_checked' => '2026-10-14 00:00:00',
				'core'         => (object) array(
					'version'         => $GLOBALS['wp_version'],
					'vulnerabilities' => array(
						(object) array(
							'id'    => 'core-1',
							'title' => 'A core vulnerability',
						),
					),
				),
			)
		);
		update_option( Protect_Status::OPTION_TIMESTAMP_NAME, time() + $expires_in );
	}

	/**
	 * Who is looking, whether a report is stored, and the badge count expected.
	 *
	 * @return array[]
	 */
	public static function provide_menu_badge_cases() {
		return array(
			'administrator, stored report' => array( 'administrator', true, 1 ),
			'administrator, no report yet' => array( 'administrator', false, 0 ),
			'editor'                       => array( 'editor', true, null ),
		);
	}

	/**
	 * @dataProvider provide_menu_badge_cases
	 *
	 * @param string   $role     Role of the current user.
	 * @param bool     $stored   Whether a report is stored.
	 * @param int|null $expected The registered count, or null for no badge.
	 */
	#[DataProvider( 'provide_menu_badge_cases' )]
	public function test_menu_badge_shows_the_stored_count( $role, $stored, $expected ) {
		$this->sign_in( $role );
		if ( $stored ) {
			// Expired, so a count that waited on a fresh fetch would not be the stored one.
			$this->store_report( -1 );
		}
		$requests = 0;
		add_filter(
			'pre_http_request',
			function () use ( &$requests ) {
				++$requests;
				return new \WP_Error( 'blocked' );
			}
		);

		Threat_Count::register_menu_badge();

		$this->assertSame( $expected, Notification_Counts::all()[ Dashboard::MENU_SLUG ]['count'] ?? null );
		$this->assertSame( 0, $requests );
	}

	/**
	 * Stored report and back-off state, and whether the count needs refreshing from the browser.
	 *
	 * @return array[]
	 */
	public static function provide_refresh_cases() {
		return array(
			'no report yet'           => array( null, false, true ),
			'expired report'          => array( -1, false, true ),
			'fresh report'            => array( 60, false, false ),
			'backing off after error' => array( -1, true, false ),
		);
	}

	/**
	 * @dataProvider provide_refresh_cases
	 *
	 * @param int|null $expires_in  Seconds until the stored report expires, or null for none stored.
	 * @param bool     $backing_off Whether an earlier failure is still being backed off from.
	 * @param bool     $expected    Whether a refresh is needed.
	 */
	#[DataProvider( 'provide_refresh_cases' )]
	public function test_needs_refresh( $expires_in, $backing_off, $expected ) {
		if ( null !== $expires_in ) {
			$this->store_report( $expires_in );
		}
		if ( $backing_off ) {
			set_transient( Threat_Count::BACKOFF_TRANSIENT, 1 );
		}

		$this->assertSame( $expected, Threat_Count::needs_refresh() );
	}

	/**
	 * Seconds until the stored report expires, and whether the refresh script loads.
	 *
	 * @return array[]
	 */
	public static function provide_enqueue_cases() {
		return array(
			'expired report' => array( -1, true ),
			'fresh report'   => array( 60, false ),
		);
	}

	/**
	 * @dataProvider provide_enqueue_cases
	 *
	 * @param int  $expires_in Seconds until the stored report expires.
	 * @param bool $expected   Whether the refresh script is enqueued.
	 */
	#[DataProvider( 'provide_enqueue_cases' )]
	public function test_maybe_enqueue_refresh_loads_the_script_in_admin_only_when_stale( $expires_in, $expected ) {
		$this->sign_in( 'administrator' );
		set_current_screen( 'dashboard' );
		$this->store_report( $expires_in );

		Threat_Count::maybe_enqueue_refresh();

		$this->assertSame( $expected, wp_script_is( Threat_Count::SCRIPT_HANDLE, 'enqueued' ) );
		if ( $expected ) {
			// Otherwise a response arriving before the badge script loads leaves the menu badge stale.
			$this->assertContains( 'jetpack-menu-badges', wp_scripts()->registered[ Threat_Count::SCRIPT_HANDLE ]->deps );
			$this->assertTrue( wp_script_is( 'jetpack-menu-badges', 'registered' ) );
		}
	}

	public function test_a_status_that_cannot_be_read_hides_the_count_instead_of_failing() {
		$this->sign_in( 'administrator' );
		$this->store_report( 60 );
		add_filter(
			'all_plugins',
			/** @return never */
			function () {
				throw new \RuntimeException( 'Malformed status' );
			}
		);

		Threat_Count::register_menu_badge();
		$response = Threat_Count::get_fresh_count();

		$this->assertSame( 0, Notification_Counts::all()[ Dashboard::MENU_SLUG ]['count'] );
		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 1, get_transient( Threat_Count::BACKOFF_TRANSIENT ) );
	}

	public function test_get_fresh_count_returns_the_count() {
		Status::$status = new Status_Model( array( 'threats' => array( 'a', 'b' ) ) );

		$response = Threat_Count::get_fresh_count();

		$this->assertSame( array( 'count' => 2 ), $response->get_data() );
		$this->assertFalse( get_transient( Threat_Count::BACKOFF_TRANSIENT ) );
	}

	public function test_get_fresh_count_backs_off_after_a_failed_fetch() {
		Status::$status = new Status_Model( array( 'error' => true ) );

		$response = Threat_Count::get_fresh_count();

		$this->assertInstanceOf( \WP_Error::class, $response );
		$this->assertSame( 1, get_transient( Threat_Count::BACKOFF_TRANSIENT ) );
	}
}
