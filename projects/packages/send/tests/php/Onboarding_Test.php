<?php
/**
 * Tests for Onboarding.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * @covers \Automattic\Jetpack\Send\Onboarding
 */
#[CoversClass( Onboarding::class )]
class Onboarding_Test extends BaseTestCase {

	const ISO_UTC = '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/';

	/**
	 * Clear stored state.
	 */
	public function tear_down() {
		Onboarding::delete();
		Onboarding::delete_test_history();
		Settings::delete();
		Account::delete();
		parent::tear_down();
	}

	/**
	 * Store an account whose checks pass (or not).
	 *
	 * @param bool $passing Whether every required check passed.
	 */
	private static function save_account( $passing ) {
		Account::save(
			array(
				'api_key'     => 'key',
				'domain'      => 'example.com',
				'dns_records' => array(),
				'dns_check'   => array(
					'domain_lockdown' => $passing ? 'passed' : 'failed',
					'sender_domain'   => 'passed',
					'spf'             => 'passed',
					'dkim'            => 'unknown',
				),
			)
		);
	}

	public function test_state_ignores_stored_junk_and_unknown_keys() {
		update_option(
			Onboarding::OPTION,
			array(
				'step'         => 'connect',
				'closed_at'    => array( 'x' ),
				'test_times'   => array( time() ),
				'enabled_once' => true,
			)
		);

		$this->assertSame( array_merge( Onboarding::defaults(), array( 'step' => 'connect' ) ), Onboarding::state() );
	}

	public function test_client_flags_become_timestamps_and_clear_again() {
		$state = Onboarding::update_from_client(
			array(
				'step'          => 'connect',
				'closed'        => true,
				'verified_seen' => true,
			)
		);

		$this->assertSame( 'connect', $state['step'] );
		$this->assertMatchesRegularExpression( self::ISO_UTC, (string) $state['closed_at'] );
		$this->assertMatchesRegularExpression( self::ISO_UTC, (string) $state['verified_seen_at'] );

		$this->assertNull( Onboarding::update_from_client( array( 'closed' => false ) )['closed_at'] );
	}

	public function test_clients_cannot_set_server_keys() {
		Onboarding::update_from_client(
			array(
				'test_to'          => 'attacker@example.org',
				'test_sent_at'     => '2026-01-01T00:00:00Z',
				'auto_test_log_id' => '9',
			)
		);

		$this->assertSame( Onboarding::defaults(), Onboarding::state() );
	}

	public function test_record_sets_only_server_keys() {
		$state = Onboarding::record(
			array(
				'test_to'          => 'owner@example.com',
				'auto_test_log_id' => 12,
				'step'             => 'finish',
			)
		);

		$this->assertSame( 'owner@example.com', $state['test_to'] );
		$this->assertSame( '12', $state['auto_test_log_id'] );
		$this->assertNull( $state['step'] );
		$this->assertNull( Onboarding::record( array( 'test_to' => null ) )['test_to'] );
	}

	/**
	 * Client changes POST /settings refuses.
	 *
	 * @return array[]
	 */
	public static function provide_invalid_client_changes() {
		return array(
			'not an object'      => array( 'connect' ),
			'unknown step'       => array( array( 'step' => 'payment' ) ),
			'unknown provider'   => array( array( 'dns_provider' => 'not-a-provider' ) ),
			'non-string slug'    => array( array( 'dns_provider' => array( 'cloudflare' ) ) ),
			'non-boolean closed' => array( array( 'closed' => 'later' ) ),
		);
	}

	/**
	 * @dataProvider provide_invalid_client_changes
	 *
	 * @param mixed $changes The `onboarding` value.
	 */
	#[DataProvider( 'provide_invalid_client_changes' )]
	public function test_validate_client_refuses_bad_values( $changes ) {
		$error = Onboarding::validate_client( $changes );

		$this->assertInstanceOf( WP_Error::class, $error );
		$this->assertSame( 'jetpack_send_invalid_onboarding', $error->get_error_code() );
	}

	public function test_validate_client_accepts_clearing_the_provider_and_ignores_unknown_keys() {
		$this->assertNull(
			Onboarding::validate_client(
				array(
					'dns_provider' => null,
					'step'         => 'finish',
					'closed'       => true,
					'whatever'     => 1,
				)
			)
		);
	}

	public function test_a_known_provider_is_saved() {
		$this->assertNull( Onboarding::validate_client( array( 'dns_provider' => 'cloudflare' ) ) );
		$this->assertSame( 'cloudflare', Onboarding::update_from_client( array( 'dns_provider' => 'cloudflare' ) )['dns_provider'] );
	}

	public function test_restart_forgets_the_old_domain_and_records_who_ran_setup() {
		update_option(
			Onboarding::OPTION,
			array(
				'step'             => 'connect',
				'closed_at'        => '2026-10-01T00:00:00Z',
				'dns_provider'     => 'bluehost',
				'test_to'          => 'old@example.org',
				'test_sent_at'     => '2026-10-01T00:00:00Z',
				'auto_test_log_id' => '4',
				'verified_seen_at' => '2026-10-01T00:00:00Z',
			)
		);

		$state = Onboarding::restart( 'owner@example.com' );

		$this->assertSame(
			array_merge( Onboarding::defaults(), array( 'test_to' => 'owner@example.com' ) ),
			$state
		);
	}

	/**
	 * Situations where sending must not be switched on by itself.
	 *
	 * @return array[]
	 */
	public static function provide_no_auto_enable() {
		return array(
			'checks failing'    => array( false, array(), false ),
			'opted out'         => array( true, array( 'auto_enable' => false ), false ),
			'already on'        => array( true, array( 'enabled' => true ), false ),
			'paused by owner'   => array( true, array(), true ),
			'no account at all' => array( null, array(), false ),
		);
	}

	/**
	 * @dataProvider provide_no_auto_enable
	 *
	 * @param bool|null $passing      Whether checks pass; null for no account.
	 * @param array     $settings     Settings to store.
	 * @param bool      $enabled_once Whether sending was already on once for this setup.
	 */
	#[DataProvider( 'provide_no_auto_enable' )]
	public function test_maybe_auto_enable_leaves_sending_alone( $passing, array $settings, $enabled_once ) {
		if ( null !== $passing ) {
			self::save_account( $passing );
		}
		Settings::update( $settings );
		if ( $enabled_once ) {
			Onboarding::note_enabled();
		}
		$before = Settings::get()['enabled'];

		$this->assertFalse( Onboarding::maybe_auto_enable() );
		$this->assertSame( $before, Settings::get()['enabled'] );
	}

	public function test_maybe_auto_enable_turns_sending_on_once_per_setup() {
		self::save_account( true );

		$this->assertTrue( Onboarding::maybe_auto_enable() );
		$this->assertTrue( Settings::get()['enabled'] );

		Settings::update( array( 'enabled' => false ) );
		$this->assertFalse( Onboarding::maybe_auto_enable() );

		Onboarding::restart( 'owner@example.com' );
		$this->assertTrue( Onboarding::maybe_auto_enable() );
	}

	public function test_tests_are_rate_limited_within_the_window() {
		update_option( Onboarding::TEST_TIMES_OPTION, array( time() - Onboarding::TEST_WINDOW - 1 ) );
		for ( $i = 0; $i < Onboarding::TEST_LIMIT - 1; $i++ ) {
			Onboarding::count_test();
		}
		$this->assertFalse( Onboarding::test_rate_limited() );

		Onboarding::count_test();

		$this->assertTrue( Onboarding::test_rate_limited() );
		$this->assertGreaterThan( Onboarding::TEST_WINDOW - 5, Onboarding::test_retry_after() );
	}

	public function test_claim_test_refuses_while_another_request_holds_the_lock() {
		add_option( Onboarding::TEST_LOCK_OPTION, time() );

		$this->assertFalse( Onboarding::claim_test() );
		$this->assertFalse( Onboarding::test_rate_limited() );

		update_option( Onboarding::TEST_LOCK_OPTION, time() - MINUTE_IN_SECONDS - 1 );
		$this->assertTrue( Onboarding::claim_test() );
		$this->assertFalse( get_option( Onboarding::TEST_LOCK_OPTION ) );
	}
}
