<?php
/**
 * Tests for Resend.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WorDBless\InsertId;

/**
 * @covers \Automattic\Jetpack\Send\Resend
 * @covers \Automattic\Jetpack\Send\Mailer
 */
#[CoversClass( Resend::class )]
#[CoversClass( Mailer::class )]
class Resend_Test extends BaseTestCase {

	/**
	 * The fake database.
	 *
	 * @var Fake_Db
	 */
	private $db;

	/**
	 * The active HTTP mock.
	 *
	 * @var Http_Mock|null
	 */
	private $http;

	/**
	 * A verified account with sending on, schema 4.
	 */
	public function set_up() {
		parent::set_up();
		wp_cache_flush();
		update_option( Email_Log::DB_VERSION_OPTION, '4' );
		Account::save(
			array(
				'handle'           => 'jpsendtest',
				'api_key'          => 'sub-key-12345678',
				'lockdown_auth_id' => 'jpsendtest',
				'domain'           => 'example.com',
				'dkim_selector'    => '',
				'monthly_limit'    => -1,
				'dns_records'      => array(),
				'provider'         => 'local',
				'provisioned_at'   => '2026-10-07T00:00:00+00:00',
				'dns_check'        => array(
					'domain_lockdown' => 'passed',
					'sender_domain'   => 'passed',
					'spf'             => 'passed',
					'dkim'            => 'unknown',
				),
			)
		);
		Settings::update( array( 'enabled' => true ) );
		$this->db = new Fake_Db();
	}

	/**
	 * Remove the fakes.
	 */
	public function tear_down() {
		$this->db->remove();
		if ( $this->http ) {
			$this->http->remove();
			$this->http = null;
		}
		remove_all_filters( 'jetpack_send_resend_limit' );
		delete_option( Resend::TIMES_OPTION );
		Settings::delete();
		Account::delete();
		parent::tear_down();
	}

	/**
	 * A logged email, as Email_Log::get() returns it.
	 *
	 * @param array $message Message keys to replace.
	 * @param array $row     Row keys to replace.
	 * @return array
	 */
	private static function entry( array $message = array(), array $row = array() ) {
		return array_merge(
			array(
				'id'         => '12',
				'source'     => 'wp_mail',
				'origin'     => 'plugin:shop',
				'reason'     => '',
				'recipients' => 'Jordan Lee <jordan@example.org>',
				'subject'    => 'Your receipt',
				'message'    => array_merge(
					array(
						'from'         => array(
							'email' => 'hello@example.com',
							'name'  => 'Shop',
						),
						'reply_to'     => null,
						'to'           => array(
							array(
								'email' => 'jordan@example.org',
								'name'  => 'Jordan Lee',
							),
						),
						'cc'           => array( array( 'email' => 'boss@example.org' ) ),
						'bcc'          => array(),
						'subject'      => 'Your receipt',
						'content_type' => 'text/html',
						'body'         => '<p>Thanks for your order.</p>',
						'attachments'  => array(),
						'kept'         => 'full',
						'redacted'     => false,
					),
					$message
				),
			),
			$row
		);
	}

	/**
	 * Emails that can't be resent, and why.
	 *
	 * @return array[]
	 */
	public static function provide_blocks() {
		return array(
			'a test'             => array( array(), array( 'source' => 'test' ), array(), 'test' ),
			'content turned off' => array(
				array(
					'body' => null,
					'kept' => 'off',
				),
				array(),
				array(),
				'no_content',
			),
			'an older row'       => array( array(), array( 'message' => null ), array(), 'no_content' ),
			'too big to keep'    => array(
				array(
					'body' => null,
					'kept' => 'too_large',
				),
				array(),
				array(),
				'too_large',
			),
			'an attachment'      => array( array( 'attachments' => array( 'invoice.pdf' ) ), array(), array(), 'attachments' ),
			'not one Send sends' => array( array(), array( 'reason' => 'unsupported' ), array(), 'unsupported' ),
			'sign-in link strip' => array( array( 'redacted' => true ), array(), array(), 'redacted' ),
			'sending paused'     => array( array(), array(), array( 'enabled' => false ), 'paused' ),
		);
	}

	/**
	 * @dataProvider provide_blocks
	 *
	 * @param array  $message  Message keys to replace.
	 * @param array  $row      Row keys to replace.
	 * @param array  $settings Settings to change.
	 * @param string $reason   Why it can't be resent.
	 */
	#[DataProvider( 'provide_blocks' )]
	public function test_eligibility_says_why_an_email_cant_be_resent( array $message, array $row, array $settings, $reason ) {
		Settings::update( $settings );

		$this->assertSame(
			array(
				'allowed' => false,
				'reason'  => $reason,
			),
			array_intersect_key( Resend::eligibility( self::entry( $message, $row ) ), array_flip( array( 'allowed', 'reason' ) ) )
		);
	}

	public function test_a_domain_that_stopped_passing_cant_resend() {
		Account::update( array( 'dns_check' => array( 'domain_lockdown' => 'failed' ) ) );

		$this->assertSame( 'not_ready', Resend::eligibility( self::entry() )['reason'] );
	}

	/**
	 * Addresses that are refused before anything is parsed, and the error.
	 *
	 * @return array[]
	 */
	public static function provide_bad_lists() {
		return array(
			'line break'        => array( array( "a@example.org\r\nBcc: x@example.org" ), array(), 'jetpack_send_invalid_address' ),
			'null byte'         => array( array( "a@example.org\0" ), array(), 'jetpack_send_invalid_address' ),
			'255 characters'    => array( array( str_repeat( 'a', 243 ) . '@example.org' ), array(), 'jetpack_send_invalid_address' ),
			'not an address'    => array( array( 'jordan@' ), array(), 'jetpack_send_invalid_address' ),
			'no one'            => array( array( ' ' ), array(), 'jetpack_send_no_recipients' ),
			'eleven addresses'  => array( array_map( fn( $i ) => "p{$i}@example.org", range( 1, 6 ) ), array( 'jordan@example.org', 'boss@example.org', 'q1@example.org', 'q2@example.org', 'q3@example.org' ), 'jetpack_send_too_many_addresses' ),
			'six new addresses' => array( array_map( fn( $i ) => "p{$i}@example.org", range( 1, 6 ) ), array(), 'jetpack_send_too_many_new_addresses' ),
		);
	}

	/**
	 * @dataProvider provide_bad_lists
	 *
	 * @param array  $to   To.
	 * @param array  $cc   Cc.
	 * @param string $code Error code.
	 */
	#[DataProvider( 'provide_bad_lists' )]
	public function test_validate_refuses( array $to, array $cc, $code ) {
		$this->assertSame( $code, Resend::validate( self::entry(), $to, $cc, array(), 'me@example.com' )->get_error_code() );
	}

	public function test_validate_dedupes_across_fields_and_keeps_names_on_unchanged_lists() {
		$lists = Resend::validate( self::entry(), array( 'JORDAN@example.org' ), array( 'boss@example.org', 'jordan@example.org' ), array( 'Boss@Example.org' ), 'me@example.com' );

		$this->assertSame(
			array(
				'to'  => array(
					array(
						'email' => 'jordan@example.org',
						'name'  => 'Jordan Lee',
					),
				),
				'cc'  => array( array( 'email' => 'boss@example.org' ) ),
				'bcc' => array(),
			),
			$lists
		);
	}

	public function test_an_original_with_twelve_recipients_can_go_to_the_same_list() {
		$to    = array_map( fn( $i ) => array( 'email' => "p{$i}@example.org" ), range( 1, 12 ) );
		$entry = self::entry( array( 'to' => $to ) );

		$this->assertIsArray( Resend::validate( $entry, array_column( $to, 'email' ), array( 'boss@example.org' ), array(), 'me@example.com' ) );
	}

	/**
	 * Who a locked email can go to.
	 *
	 * @return array[]
	 */
	public static function provide_locked_lists() {
		return array(
			'the same people' => array( array( 'jordan@example.org' ), array( 'boss@example.org' ), true ),
			'just me'         => array( array( 'Me@example.com' ), array(), true ),
			'someone else'    => array( array( 'friend@example.org' ), array(), false ),
		);
	}

	/**
	 * @dataProvider provide_locked_lists
	 *
	 * @param array $to      To.
	 * @param array $cc      Cc.
	 * @param bool  $allowed Whether it can go.
	 */
	#[DataProvider( 'provide_locked_lists' )]
	public function test_an_email_with_a_store_set_password_link_goes_only_to_the_same_people_or_you( array $to, array $cc, $allowed ) {
		$entry = self::entry( array( 'body' => '<a href="https://shop.example.com/my-account/lost-password/?key=abc123&#038;id=7">Set your password</a>' ) );

		$result = Resend::validate( $entry, $to, $cc, array(), 'me@example.com' );

		$this->assertTrue( Resend::eligibility( $entry )['locked'] );
		$this->assertSame( $allowed, is_array( $result ) );
		if ( ! $allowed ) {
			$this->assertSame( 'jetpack_send_resend_locked', $result->get_error_code() );
			$this->assertSame( 403, $result->get_error_data()['status'] );
		}
	}

	/**
	 * Emails and whether they're locked.
	 *
	 * @return array[]
	 */
	public static function provide_locks() {
		return array(
			'a password reset, even with no link' => array( array( 'body' => 'Hi' ), array( 'origin' => 'core:password_reset' ), true ),
			'a recovery link'                     => array( array( 'body' => 'https://x.example/wp-login.php?action=enter_recovery_mode&rm_token=a&rm_key=b' ), array(), true ),
			'a store order link'                  => array( array( 'body' => 'https://shop.example/order-received/12/?key=wc_order_abc' ), array(), true ),
			'an ordinary receipt'                 => array( array( 'body' => 'https://shop.example/orders/12/?page=2' ), array(), false ),
		);
	}

	/**
	 * @dataProvider provide_locks
	 *
	 * @param array $message Message keys to replace.
	 * @param array $row     Row keys to replace.
	 * @param bool  $locked  Whether it's locked.
	 */
	#[DataProvider( 'provide_locks' )]
	public function test_locked( array $message, array $row, $locked ) {
		$this->assertSame( $locked, Resend::locked( self::entry( $message, $row ) ) );
	}

	public function test_the_hourly_allowance_refuses_the_21st_and_says_when_to_try_again() {
		update_option( Resend::TIMES_OPTION, array_fill( 0, 19, time() - 600 ) );

		$this->assertTrue( Resend::claim() );
		$this->assertFalse( Resend::claim() );
		$this->assertEqualsWithDelta( 3000, Resend::retry_after(), 5 );
	}

	public function test_a_copy_goes_straight_to_the_service_as_a_linked_row() {
		$this->http = new Http_Mock(
			array(
				array(
					202,
					array(
						'request_id' => 'req-7',
						'results'    => array(
							array(
								'status'     => 'sent',
								'message_id' => 'm-7',
							),
						),
					),
				),
			)
		);
		$spy        = 0;
		$spy_filter = function ( $value ) use ( &$spy ) {
			++$spy;
			return $value;
		};
		add_filter( 'pre_wp_mail', $spy_filter );
		$entry = self::entry( array( 'from' => array( 'email' => 'shop@example.net' ) ) );
		$id    = InsertId::$id + 1;

		$result = Resend::send( $entry, array( array( 'email' => 'friend@example.org' ) ), array(), array(), 3 );
		remove_filter( 'pre_wp_mail', $spy_filter );

		$this->assertSame(
			array(
				'log_id'  => (string) $id,
				'status'  => 'sent',
				'reason'  => '',
				'message' => '',
			),
			$result
		);
		$this->assertSame( 0, $spy );
		$sent = $this->http->requests[0]['body'];
		$this->assertSame( array( array( 'email' => 'friend@example.org' ) ), $sent['personalizations'][0]['to'] );
		// An off-domain sender moves to Reply-To, as for any email.
		$this->assertSame( 'shop@example.net', $sent['reply_to']['email'] );
		$insert = $this->db->matching( 'INSERT INTO `' . Email_Log::table_name() )[0];
		$this->assertStringContainsString( "'resend'", $insert );
		$this->assertStringContainsString( "'plugin:shop'", $insert );
		$this->assertMatchesRegularExpression( '/`resend_of`, `user_id`.*12, 3/', $insert );
		$this->assertCount( 1, $this->db->matching( 'INSERT INTO `' . Stats::table_name() ) );
	}

	public function test_a_copy_the_service_refuses_is_logged_failed_with_no_backup() {
		$this->http = new Http_Mock( array( array( 403, array( 'errors' => array( 'This sender is not authorized to send from example.com' ) ) ) ) );

		$result = Resend::send( self::entry(), array( array( 'email' => 'jordan@example.org' ) ), array(), array(), 3 );

		$this->assertSame( 'failed', $result['status'] );
		$this->assertSame( 'lockdown', $result['reason'] );
		$this->assertSame( 'example.com hasn’t given Jetpack permission to send yet. Record 1 isn’t showing up.', $result['message'] );
		$this->assertCount( 1, $this->http->requests );
	}

	/**
	 * Debug lines for a resend the service refused, and one it took no answer for.
	 *
	 * @return array[]
	 */
	public static function provide_failed_resends() {
		return array(
			'refused'   => array( array( 403, array( 'errors' => array( 'This sender is not authorized to send from example.com' ) ) ), 'Tried to resend email 12 as %s to 1 recipient. Not sent. example.com hasn’t given Jetpack permission to send yet. Record 1 isn’t showing up.' ),
			'no answer' => array( new \WP_Error( 'http_request_failed', 'cURL error 28: Operation timed out' ), 'Tried to resend email 12 as %s to 1 recipient. Not sure it went out. We didn’t hear back in time, so it may still arrive.' ),
		);
	}

	/**
	 * @dataProvider provide_failed_resends
	 *
	 * @param array|\WP_Error $response The service's answer.
	 * @param string          $line     The debug line, with %s for the copy's id.
	 */
	#[DataProvider( 'provide_failed_resends' )]
	public function test_the_debug_log_says_a_resend_didnt_go_out( $response, $line ) {
		Settings::update(
			array(
				'debug_log'       => true,
				'debug_log_until' => gmdate( 'Y-m-d\\TH:i:s\\Z', time() + HOUR_IN_SECONDS ),
			)
		);
		$this->http = new Http_Mock( array( $response ) );

		$result = Resend::send( self::entry(), array( array( 'email' => 'jordan@example.org' ) ), array(), array(), 3 );

		$inserts = $this->db->matching( 'INSERT INTO `' . Debug_Log::table_name() );
		$this->assertNotEmpty( array_filter( $inserts, fn( $query ) => false !== strpos( $query, sprintf( $line, $result['log_id'] ) ) ) );
	}
}
