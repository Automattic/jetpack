<?php
/**
 * Tests for the Protect dashboard's Scan section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Protect\Sections\Scan;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Sections\Scan
 */
#[CoversClass( Scan::class )]
class Scan_Section_Test extends BaseTestCase {

	/**
	 * Release the scan request lock between tests.
	 */
	public function tear_down() {
		delete_transient( Scan::REQUEST_LOCK );
		delete_transient( Scan::HISTORY_CACHE );
		wp_set_current_user( 0 );
		parent::tear_down();
	}

	/**
	 * Call a private static method of the Scan section.
	 *
	 * @param string $method The method.
	 * @param mixed  ...$args Its arguments.
	 * @return mixed
	 */
	private static function call( $method, ...$args ) {
		$reflection = new \ReflectionMethod( Scan::class, $method );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		return $reflection->invoke( null, ...$args );
	}

	/**
	 * Test that the ignored list keeps only ignored threats from the history it shares with the History tab.
	 */
	public function test_ignored_threats_come_from_the_shared_history() {
		set_transient(
			Scan::HISTORY_CACHE,
			array(
				array(
					'id'     => 1,
					'status' => 'fixed',
				),
				array(
					'id'     => 2,
					'status' => 'ignored',
				),
			)
		);

		$this->assertSame( array( 2 ), array_column( Scan::get_ignored_threats(), 'id' ) );
	}

	/**
	 * Test that only administrators may fix or ignore threats.
	 */
	public function test_non_admins_cannot_act_on_threats() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'editor',
				'user_pass'  => 'pass',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		$this->assertFalse( Scan::can_act_on_threats() );
	}

	/**
	 * Test that a held request lock refuses a second scan, and a released one allows a retry.
	 */
	public function test_request_lock_refuses_a_second_claim_until_released() {
		$this->assertTrue( self::call( 'claim_request_lock' ) );
		$this->assertFalse( self::call( 'claim_request_lock' ) );

		self::call( 'release_request_lock' );

		$this->assertTrue( self::call( 'claim_request_lock' ) );
	}

	/**
	 * WordPress.com fixer responses, and the status the dashboard reads from each.
	 *
	 * @return array[]
	 */
	public static function provider_fix_status() {
		return array(
			'reported status is kept'           => array(
				'{"threats":{"7":{"status":"fixed"}}}',
				array(
					'status' => 'fixed',
					'error'  => null,
				),
			),
			'unreported threat is in progress'  => array(
				'{"threats":{}}',
				array(
					'status' => 'in_progress',
					'error'  => null,
				),
			),
			'error without status is not fixed' => array(
				'{"threats":{"7":{"error":"failed"}}}',
				array(
					'status' => 'not_fixed',
					'error'  => 'failed',
				),
			),
		);
	}

	/**
	 * Test that a threat's fix status is read from WordPress.com's response by its numeric id.
	 *
	 * @dataProvider provider_fix_status
	 * @param string $response The decoded response body, as JSON.
	 * @param array  $expected The status the dashboard reports.
	 */
	#[DataProvider( 'provider_fix_status' )]
	public function test_fix_status_is_read_from_the_response( $response, $expected ) {
		$this->assertSame( $expected, self::call( 'get_threat_fix_status', json_decode( $response ), 7 ) );
	}
}
