<?php
/**
 * Tests for Dns_Watch.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Send\Dns_Watch
 */
#[CoversClass( Dns_Watch::class )]
class Dns_Watch_Test extends BaseTestCase {

	const OWNER = 'owner@example.com';

	/**
	 * The active HTTP mock.
	 *
	 * @var Http_Mock|null
	 */
	private $http;

	/**
	 * Emails handed to wp_mail(), in order.
	 *
	 * @var array[]
	 */
	private $mails = array();

	/**
	 * A provisioned account whose records aren't checked yet, with every DNS lookup coming back empty.
	 */
	public function set_up() {
		parent::set_up();
		Account::save(
			array(
				'handle'           => 'jpsendtest',
				'api_key'          => 'sub-key',
				'lockdown_auth_id' => 'jpsendtest',
				'domain'           => 'example.com',
				'dkim_selector'    => 'jpsend',
				'monthly_limit'    => -1,
				'dns_records'      => array(
					array(
						'type'     => 'TXT',
						'name'     => '_mailchannels.example.com',
						'value'    => 'v=mc1 auth=jpsendtest',
						'purpose'  => 'lockdown',
						'optional' => false,
					),
					array(
						'type'     => 'TXT',
						'name'     => 'jpsend._domainkey.example.com',
						'value'    => 'v=DKIM1; k=rsa; p=ABC',
						'purpose'  => 'dkim',
						'optional' => false,
					),
				),
				'provider'         => 'local',
				'provisioned_at'   => '2026-10-07T00:00:00+00:00',
				'dns_check'        => null,
			)
		);
		update_option( 'admin_email', 'site-admin@example.com' );
		wp_insert_user(
			array(
				'user_login' => 'owner',
				'user_pass'  => 'pass',
				'user_email' => self::OWNER,
				'role'       => 'administrator',
			)
		);
		add_filter( 'jetpack_send_pre_dns_lookup', array( $this, 'no_records' ) );
		add_filter( 'pre_wp_mail', array( $this, 'capture_mail' ), 20, 2 );
	}

	/**
	 * Clear filters, the schedule and the HTTP mock.
	 */
	public function tear_down() {
		if ( $this->http ) {
			$this->http->remove();
			$this->http = null;
		}
		$this->mails = array();
		remove_all_filters( 'jetpack_send_pre_dns_lookup' );
		remove_all_filters( 'pre_wp_mail' );
		delete_option( Dns_Watch::LOCK_OPTION );
		delete_transient( REST_Controller::CHECK_DNS_THROTTLE );
		Dns_Watch::stop();
		Onboarding::delete();
		Settings::delete();
		Account::delete();
		parent::tear_down();
	}

	/**
	 * `jetpack_send_pre_dns_lookup` callback: nothing at any name.
	 *
	 * @return array
	 */
	public function no_records() {
		return array();
	}

	/**
	 * `pre_wp_mail` callback that records the email instead of sending it.
	 *
	 * @param null|bool $pre  Short-circuit value.
	 * @param array     $atts wp_mail() attributes.
	 * @return bool
	 */
	public function capture_mail( $pre, $atts ) {
		$this->mails[] = $atts;
		return true;
	}

	/**
	 * Store who ran setup, so the auto-test has someone to send to.
	 */
	private function store_onboarding_state() {
		Onboarding::record( array( 'test_to' => self::OWNER ) );
	}

	/**
	 * Pretend the watch started some time ago and has run a number of times.
	 *
	 * @param int $ago  Seconds since it started.
	 * @param int $runs Runs so far.
	 */
	private static function started( $ago, $runs = 0 ) {
		Dns_Watch::start();
		update_option(
			Dns_Watch::OPTION,
			array(
				'started_at'          => time() - $ago,
				'runs'                => $runs,
				'stalled_notified_at' => null,
			)
		);
	}

	/**
	 * A check-domain answer, every check passing unless overridden.
	 *
	 * @param string $lockdown Lockdown verdict.
	 * @return array
	 */
	private static function check_response( $lockdown = 'passed' ) {
		return array(
			200,
			array(
				'check_results' => array(
					'domain_lockdown' => array( 'verdict' => $lockdown ),
					'dkim'            => array( array( 'verdict' => 'passed' ) ),
					'spf'             => array( 'verdict' => 'failed' ),
					'sender_domain'   => array( 'verdict' => 'passed' ),
				),
			),
		);
	}

	/**
	 * A send answer that accepted the message.
	 *
	 * @return array
	 */
	private static function sent_response() {
		return array(
			202,
			array(
				'request_id' => 'req-auto',
				'results'    => array(
					array(
						'index'  => 0,
						'status' => 'sent',
					),
				),
			),
		);
	}

	/**
	 * Requests the mock saw to one MailChannels path.
	 *
	 * @param string $path E.g. `/send`.
	 * @return array[]
	 */
	private function requests_to( $path ) {
		return array_values(
			array_filter(
				$this->http->requests,
				function ( $request ) use ( $path ) {
					return substr( $request['url'], -strlen( $path ) ) === $path;
				}
			)
		);
	}

	/**
	 * Elapsed time and the delay expected after it.
	 *
	 * @return array[]
	 */
	public static function provide_delays() {
		return array(
			'just started'          => array( 0, 15 * MINUTE_IN_SECONDS ),
			'end of the first 2 h'  => array( 2 * HOUR_IN_SECONDS - 1, 15 * MINUTE_IN_SECONDS ),
			'from 2 h'              => array( 2 * HOUR_IN_SECONDS, HOUR_IN_SECONDS ),
			'end of the first 48 h' => array( 2 * DAY_IN_SECONDS - 1, HOUR_IN_SECONDS ),
			'from 48 h'             => array( 2 * DAY_IN_SECONDS, DAY_IN_SECONDS ),
			'last run lands on 7 d' => array( 7 * DAY_IN_SECONDS - 600, 600 ),
			'at 7 days'             => array( 7 * DAY_IN_SECONDS, null ),
			'past 7 days'           => array( 8 * DAY_IN_SECONDS, null ),
		);
	}

	/**
	 * @dataProvider provide_delays
	 *
	 * @param int      $elapsed  Seconds since the watch started.
	 * @param int|null $expected Expected delay.
	 */
	#[DataProvider( 'provide_delays' )]
	public function test_backs_off_and_gives_up_after_seven_days( $elapsed, $expected ) {
		$this->assertSame( $expected, Dns_Watch::next_delay( $elapsed ) );
	}

	public function test_start_schedules_the_first_check_and_stop_clears_it() {
		Dns_Watch::start();
		add_option( Dns_Watch::LOCK_OPTION, time() );

		$next = wp_next_scheduled( Dns_Watch::HOOK );
		$this->assertEqualsWithDelta( time() + 15 * MINUTE_IN_SECONDS, $next, 5 );
		$this->assertSame( gmdate( 'c', $next ), Dns_Watch::next_check_at() );

		Dns_Watch::stop();

		$this->assertFalse( wp_next_scheduled( Dns_Watch::HOOK ) );
		$this->assertFalse( get_option( Dns_Watch::OPTION ) );
		$this->assertFalse( get_option( Dns_Watch::LOCK_OPTION ) );
		$this->assertNull( Dns_Watch::next_check_at() );
	}

	public function test_uninstall_clears_the_watch() {
		Dns_Watch::start();

		Send::uninstall();

		$this->assertFalse( wp_next_scheduled( Dns_Watch::HOOK ) );
		$this->assertNull( Dns_Watch::next_check_at() );
	}

	public function test_stops_when_the_account_is_gone() {
		Dns_Watch::start();
		Account::delete();

		Dns_Watch::run();

		$this->assertNull( Dns_Watch::next_check_at() );
	}

	public function test_asks_the_mail_service_only_every_fifth_run_while_records_are_missing() {
		$this->http = new Http_Mock( array( self::check_response( 'failed' ) ) );
		self::started( 0 );

		for ( $i = 0; $i < 4; $i++ ) {
			Dns_Watch::run();
		}
		$this->assertCount( 0, $this->http->requests );

		Dns_Watch::run();
		$this->assertCount( 1, $this->requests_to( '/check-domain' ) );
		$this->assertSame( 'failed', Account::get()['dns_check']['domain_lockdown'] ?? null );
		$this->assertNotNull( Dns_Watch::next_check_at(), 'A failing check keeps the watch going.' );
	}

	public function test_asks_the_mail_service_as_soon_as_every_record_is_found() {
		remove_all_filters( 'jetpack_send_pre_dns_lookup' );
		add_filter(
			'jetpack_send_pre_dns_lookup',
			function ( $pre, $name, $type ) {
				foreach ( Account::get()['dns_records'] ?? array() as $record ) {
					if ( DNS_TXT === $type && $record['name'] === $name ) {
						return array(
							array(
								'host' => $name,
								'type' => 'TXT',
								'txt'  => $record['value'],
							),
						);
					}
				}
				return array();
			},
			10,
			3
		);
		$this->http = new Http_Mock( array( self::check_response( 'failed' ) ) );
		self::started( 0 );

		Dns_Watch::run();

		$this->assertCount( 1, $this->requests_to( '/check-domain' ) );
	}

	public function test_on_pass_turns_sending_on_sends_one_test_to_the_setup_user_and_stops() {
		$this->store_onboarding_state();
		$this->http = new Http_Mock( array( self::check_response(), self::sent_response() ) );
		self::started( HOUR_IN_SECONDS, 4 );

		Dns_Watch::run();
		Dns_Watch::start();
		Dns_Watch::run();

		$this->assertTrue( Settings::get()['enabled'] );
		$sends = $this->requests_to( '/send' );
		$this->assertCount( 1, $sends, 'One automatic test, even if the watch runs again.' );
		$this->assertSame( self::OWNER, $sends[0]['body']['personalizations'][0]['to'][0]['email'] );
		$this->assertNull( Dns_Watch::next_check_at() );
	}

	/**
	 * Situations where the records pass but no automatic test goes out.
	 *
	 * @return array[]
	 */
	public static function provide_no_auto_test() {
		return array(
			'a test was already sent'              => array( 'sent' ),
			'turning on by itself is switched off' => array( 'manual' ),
			'the setup user is no longer an admin' => array( 'demoted' ),
			'someone is checking from the screen'  => array( 'watching' ),
		);
	}

	/**
	 * @dataProvider provide_no_auto_test
	 *
	 * @param string $situation Which situation to set up.
	 */
	#[DataProvider( 'provide_no_auto_test' )]
	public function test_skips_the_automatic_test( $situation ) {
		$this->store_onboarding_state();
		if ( 'sent' === $situation ) {
			Onboarding::record( array( 'test_sent_at' => gmdate( 'c' ) ) );
		} elseif ( 'manual' === $situation ) {
			Settings::update( array( 'auto_enable' => false ) );
		} elseif ( 'watching' === $situation ) {
			set_transient( REST_Controller::CHECK_DNS_THROTTLE, time(), 60 );
		} else {
			get_user_by( 'email', self::OWNER )->set_role( 'subscriber' );
		}
		$this->http = new Http_Mock( array( self::check_response() ) );
		self::started( HOUR_IN_SECONDS, 4 );

		Dns_Watch::run();

		$this->assertCount( 0, $this->requests_to( '/send' ) );
		$this->assertNull( Dns_Watch::next_check_at(), 'The watch is done once the records pass.' );
	}

	public function test_sends_one_reminder_through_the_host_after_two_days() {
		add_filter( 'pre_wp_mail', array( Mailer::class, 'pre_wp_mail' ), 10, 2 );
		Settings::update( array( 'enabled' => true ) );
		$this->http = new Http_Mock( array() );
		self::started( 2 * DAY_IN_SECONDS + 60, 1 );

		Dns_Watch::run();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- The second run must not send again.
		Dns_Watch::run();

		$this->assertCount( 1, $this->mails );
		$this->assertSame( 'site-admin@example.com', $this->mails[0]['to'] );
		$this->assertStringContainsString( 'example.com', $this->mails[0]['subject'] );
		$this->assertStringContainsString( 'Lets Jetpack send for example.com', $this->mails[0]['message'] );
		$this->assertCount( 0, $this->http->requests, 'The reminder never goes through Send.' );
		$this->assertNotFalse( has_filter( 'pre_wp_mail', array( Mailer::class, 'pre_wp_mail' ) ) );
	}

	public function test_reminder_says_what_is_wrong_with_a_record() {
		remove_all_filters( 'jetpack_send_pre_dns_lookup' );
		add_filter(
			'jetpack_send_pre_dns_lookup',
			static function ( $pre, $name, $type ) {
				unset( $pre );
				return '_mailchannels.example.com' === $name && DNS_TXT === $type
					? array( array( 'txt' => 'v=mc1 auth=someone-else' ) )
					: array();
			},
			10,
			3
		);
		$this->http = new Http_Mock( array() );
		self::started( 2 * DAY_IN_SECONDS + 60, 1 );

		Dns_Watch::run();

		$this->assertStringContainsString( 'Lets Jetpack send for example.com: doesn’t match', $this->mails[0]['message'] );
		$this->assertStringNotContainsString( 'needs a fix', $this->mails[0]['message'] );
	}

	public function test_reminder_goes_to_the_setup_user() {
		$this->store_onboarding_state();
		self::started( 2 * DAY_IN_SECONDS + 60, 1 );

		Dns_Watch::run();

		$this->assertSame( self::OWNER, $this->mails[0]['to'] );
	}

	public function test_stops_after_seven_days() {
		self::started( 7 * DAY_IN_SECONDS, 1 );

		Dns_Watch::run();

		$this->assertFalse( wp_next_scheduled( Dns_Watch::HOOK ) );
		$this->assertFalse( get_option( Dns_Watch::OPTION ) );
	}

	public function test_a_run_already_in_progress_blocks_a_second_one() {
		self::started( 0 );
		add_option( Dns_Watch::LOCK_OPTION, time() );

		Dns_Watch::run();

		$this->assertSame( 0, get_option( Dns_Watch::OPTION )['runs'] );
	}

	public function test_puts_a_lost_schedule_back() {
		self::started( 3 * HOUR_IN_SECONDS );
		Dns_Watch::unschedule();

		Dns_Watch::ensure_scheduled();

		$this->assertEqualsWithDelta( time() + HOUR_IN_SECONDS, wp_next_scheduled( Dns_Watch::HOOK ), 5 );
	}
}
