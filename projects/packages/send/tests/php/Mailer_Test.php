<?php
/**
 * Tests for Mailer.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WorDBless\InsertId;
use WP_Error;

/**
 * @covers \Automattic\Jetpack\Send\Mailer
 */
#[CoversClass( Mailer::class )]
class Mailer_Test extends BaseTestCase {

	/**
	 * The active HTTP mock.
	 *
	 * @var Http_Mock|null
	 */
	private $http;

	/**
	 * A provisioned account with sending on.
	 */
	public function set_up() {
		parent::set_up();
		Account::save(
			array(
				'handle'           => 'jpsendtest',
				'api_key'          => 'sub-key',
				'lockdown_auth_id' => 'jpsendtest',
				'domain'           => 'example.com',
				'dkim_selector'    => '',
				'monthly_limit'    => -1,
				'dns_records'      => array(),
				'provider'         => 'local',
				'provisioned_at'   => '2026-10-07T00:00:00+00:00',
				'dns_check'        => null,
			)
		);
		Settings::update( array( 'enabled' => true ) );
	}

	/**
	 * The fake database, for tests that need the counts too.
	 *
	 * @var Fake_Db|null
	 */
	private $db;

	/**
	 * Log-table SQL seen while the fake log is on.
	 *
	 * @var string[]
	 */
	private $log_queries = array();

	/**
	 * Stop intercepting HTTP and the log table.
	 */
	public function tear_down() {
		if ( $this->http ) {
			$this->http->remove();
			$this->http = null;
		}
		remove_filter( 'wordbless_wpdb_query_results', array( $this, 'fake_log' ), 10 );
		if ( $this->db ) {
			$this->db->remove();
			$this->db = null;
		}
		remove_all_actions( 'wp_mail_succeeded' );
		remove_all_actions( 'wp_mail_failed' );
		Mailer::clear_pending();
		Onboarding::delete();
		parent::tear_down();
	}

	/**
	 * Mark the log installed and record its queries, bumping the insert id on each INSERT.
	 */
	private function install_fake_log() {
		update_option( Email_Log::DB_VERSION_OPTION, Email_Log::DB_VERSION );
		add_filter( 'wordbless_wpdb_query_results', array( $this, 'fake_log' ), 10, 2 );
	}

	/**
	 * The fake log table.
	 *
	 * @param array  $results Default results.
	 * @param string $query   SQL.
	 * @return array
	 */
	public function fake_log( $results, $query ) {
		if ( false !== strpos( $query, Email_Log::table_name() ) ) {
			$this->log_queries[] = $query;
			if ( 0 === stripos( $query, 'INSERT' ) ) {
				InsertId::bump_and_get();
			}
		}
		return $results;
	}

	/**
	 * A MailChannels response that accepted the message.
	 *
	 * @param string $request_id Request ID.
	 * @return array
	 */
	private static function sent( $request_id = 'req-1' ) {
		return array(
			202,
			array(
				'request_id' => $request_id,
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
	 * Default wp_mail() attributes.
	 *
	 * @return array
	 */
	private static function atts() {
		return array(
			'to'          => 'customer@example.org',
			'subject'     => 'Hi',
			'message'     => 'Body',
			'headers'     => '',
			'attachments' => array(),
		);
	}

	public function test_leaves_mail_alone_when_sending_is_disabled() {
		Settings::update( array( 'enabled' => false ) );
		$this->http = new Http_Mock( array() );

		$this->assertNull( Mailer::pre_wp_mail( null, self::atts() ) );
		$this->assertSame( array(), $this->http->requests );
	}

	/**
	 * Values another plugin may already have returned from `pre_wp_mail`.
	 *
	 * @return array[]
	 */
	public static function provide_short_circuits() {
		return array(
			'already sent'   => array( true ),
			'already failed' => array( false ),
		);
	}

	/**
	 * @dataProvider provide_short_circuits
	 *
	 * @param bool $previous The earlier short-circuit value.
	 */
	#[DataProvider( 'provide_short_circuits' )]
	public function test_respects_another_plugins_short_circuit( $previous ) {
		$this->http = new Http_Mock( array() );

		$this->assertSame( $previous, Mailer::pre_wp_mail( $previous, self::atts() ) );
		$this->assertSame( array(), $this->http->requests );
	}

	public function test_sends_through_mailchannels_with_the_sub_account_key() {
		$this->http = new Http_Mock(
			array(
				array(
					202,
					array(
						'request_id' => 'req-1',
						'results'    => array(
							array(
								'index'      => 0,
								'message_id' => 'm1',
								'status'     => 'sent',
							),
						),
					),
				),
			)
		);
		$before     = did_action( 'wp_mail_succeeded' );

		$this->assertTrue( Mailer::pre_wp_mail( null, self::atts() ) );
		$this->assertSame( $before + 1, did_action( 'wp_mail_succeeded' ) );
		$this->assertSame( 'https://api.mailchannels.net/tx/v1/send', $this->http->requests[0]['url'] );
		$this->assertSame( 'sub-key', $this->http->requests[0]['headers']['X-Api-Key'] );
	}

	/**
	 * MailChannels responses that mean the message was not sent.
	 *
	 * @return array[]
	 */
	public static function provide_failures() {
		return array(
			'HTTP error'               => array( array( 403, array( 'errors' => array( 'Invalid API key' ) ) ) ),
			'network error'            => array( new WP_Error( 'http_request_failed', 'Operation timed out' ) ),
			'2xx without results'      => array( array( 202, array( 'request_id' => 'req-3' ) ) ),
			'2xx with a non-JSON body' => array( array( 200, '<html>OK</html>' ) ),
			'non-string reason'        => array(
				array(
					202,
					array(
						'request_id' => 'req-4',
						'results'    => array(
							array(
								'index'  => 0,
								'status' => 'failed',
								'reason' => array( 'code' => 'suppressed' ),
							),
						),
					),
				),
			),
			'per-recipient failure'    => array(
				array(
					202,
					array(
						'request_id' => 'req-2',
						'results'    => array(
							array(
								'index'  => 0,
								'status' => 'failed',
								'reason' => 'Recipient suppressed',
							),
						),
					),
				),
			),
		);
	}

	/**
	 * @dataProvider provide_failures
	 *
	 * @param array|WP_Error $response Mocked MailChannels response.
	 */
	#[DataProvider( 'provide_failures' )]
	public function test_hands_failures_to_default_mail_when_fallback_is_on( $response ) {
		$this->http = new Http_Mock( array( $response ) );
		$before     = did_action( 'wp_mail_failed' );

		$this->assertNull( Mailer::pre_wp_mail( null, self::atts() ) );
		$this->assertSame( $before, did_action( 'wp_mail_failed' ) );
	}

	/**
	 * @dataProvider provide_failures
	 *
	 * @param array|WP_Error $response Mocked MailChannels response.
	 */
	#[DataProvider( 'provide_failures' )]
	public function test_reports_failures_when_fallback_is_off( $response ) {
		Settings::update( array( 'fallback' => false ) );
		$this->http = new Http_Mock( array( $response ) );
		$before     = did_action( 'wp_mail_failed' );

		$this->assertFalse( Mailer::pre_wp_mail( null, self::atts() ) );
		$this->assertSame( $before + 1, did_action( 'wp_mail_failed' ) );
	}

	/**
	 * Messages Send can't represent, which go to core whatever the fallback setting.
	 *
	 * @return array[]
	 */
	public static function provide_unsupported_messages() {
		return array(
			'custom multipart boundary' => array( array( 'headers' => 'Content-Type: multipart/alternative; boundary="abc"' ) ),
			'inline embeds'             => array( array( 'embeds' => array( '/tmp/logo.png' ) ) ),
		);
	}

	/**
	 * @dataProvider provide_unsupported_messages
	 *
	 * @param array $overrides wp_mail() attributes to replace.
	 */
	#[DataProvider( 'provide_unsupported_messages' )]
	public function test_unsupported_messages_go_to_default_mail_even_with_fallback_off( array $overrides ) {
		Settings::update( array( 'fallback' => false ) );
		$this->http = new Http_Mock( array() );

		$this->assertNull( Mailer::pre_wp_mail( null, array_merge( self::atts(), $overrides ) ) );
		$this->assertSame( array(), $this->http->requests );
	}

	/**
	 * Test kinds and the subject and opening line each sends.
	 *
	 * @return array[]
	 */
	public static function provide_test_kinds() {
		return array(
			'manual' => array( 'manual', 'Test email from Example Site', 'This email came from wordpress@example.com through Jetpack Send, signed for example.com.' ),
			'auto'   => array( 'auto', 'example.com is ready to send email', 'Jetpack Send finished connecting example.com. Sending is on, and this test came from wordpress@example.com.' ),
		);
	}

	/**
	 * @dataProvider provide_test_kinds
	 *
	 * @param string $kind    Test kind.
	 * @param string $subject Expected subject.
	 * @param string $opening Expected start of the body.
	 */
	#[DataProvider( 'provide_test_kinds' )]
	public function test_send_test_links_to_its_own_log_row( $kind, $subject, $opening ) {
		update_option( 'blogname', 'Example Site' );
		$this->install_fake_log();
		$this->http = new Http_Mock( array( self::sent() ) );

		$result = Mailer::send_test( 'me@example.org', $kind );

		$log_id = (string) InsertId::$id;
		$this->assertSame(
			array(
				'request_id' => 'req-1',
				'log_id'     => $log_id,
			),
			$result
		);
		$sent = $this->http->requests[0]['body'];
		$this->assertSame( $subject, $sent['subject'] );
		$this->assertStringStartsWith( $opening, $sent['content'][0]['value'] );
		$this->assertStringEndsWith( 'admin.php?page=jetpack-send&p=/log&entry=' . $log_id, $sent['content'][0]['value'] );

		// One reserved row, then that same row updated to sent.
		$this->assertCount( 1, preg_grep( '/^INSERT/i', $this->log_queries ) );
		$update = (string) current( preg_grep( '/^UPDATE/i', $this->log_queries ) );
		$this->assertStringContainsString( "`status` = 'sent'", $update );
		$this->assertStringContainsString( '`id` = ' . $log_id, $update );
	}

	public function test_send_test_stamps_the_first_success_only() {
		$this->http = new Http_Mock( array( self::sent(), self::sent( 'req-2' ) ) );

		Mailer::send_test( 'me@example.org' );
		$first = Onboarding::state()['test_sent_at'];
		Onboarding::record( array( 'test_sent_at' => '2026-01-01T00:00:00Z' ) );
		Mailer::send_test( 'me@example.org' );

		$this->assertMatchesRegularExpression( '/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/', (string) $first );
		$this->assertSame( '2026-01-01T00:00:00Z', Onboarding::state()['test_sent_at'] );
	}

	public function test_failed_send_test_returns_its_log_row_and_records_nothing() {
		$this->install_fake_log();
		$this->http = new Http_Mock( array( array( 403, array( 'errors' => array( 'Domain lockdown' ) ) ) ) );

		$result = Mailer::send_test( 'me@example.org' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( (string) InsertId::$id, $result->get_error_data()['log_id'] );
		$this->assertStringContainsString( "`status` = 'failed'", (string) current( preg_grep( '/^UPDATE/i', $this->log_queries ) ) );
		$this->assertNull( Onboarding::state()['test_sent_at'] );
	}

	public function test_send_test_without_a_log_table_links_to_the_log() {
		$this->http = new Http_Mock( array( self::sent() ) );

		$result = Mailer::send_test( 'me@example.org' );

		$this->assertSame( '', $result['log_id'] );
		$this->assertStringEndsWith( 'admin.php?page=jetpack-send&p=/log', $this->http->requests[0]['body']['content'][0]['value'] );
	}

	public function test_send_test_reports_a_readable_message_for_an_html_error_page() {
		$this->http = new Http_Mock( array( array( 401, '<html><body>401 Authorization Required</body></html>' ) ) );

		$result = Mailer::send_test( 'admin@example.org' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'The sending service returned HTTP 401.', $result->get_error_message() );
	}

	/**
	 * The service's status leads its own words, so the UI can tell account and outage problems from records ones.
	 *
	 * @dataProvider provide_status_errors
	 *
	 * @param array|WP_Error $response Mocked response.
	 * @param string         $expected Error text.
	 */
	#[DataProvider( 'provide_status_errors' )]
	public function test_send_test_error_leads_with_the_service_status( $response, $expected ) {
		$this->http = new Http_Mock( array( $response ) );

		$this->assertSame( $expected, Mailer::send_test( 'admin@example.org' )->get_error_message() );
	}

	/**
	 * Rows for test_send_test_error_leads_with_the_service_status.
	 *
	 * @return array[]
	 */
	public static function provide_status_errors() {
		return array(
			'refused for the account' => array( array( 403, array( 'errors' => array( 'Can only send to verified email addresses' ) ) ), 'HTTP 403: Can only send to verified email addresses' ),
			'service error'           => array( array( 503, array( 'errors' => array( 'Try later' ) ) ), 'HTTP 503: Try later' ),
			'no service status'       => array( new WP_Error( 'http_request_failed', 'Operation timed out' ), 'Operation timed out' ),
		);
	}

	public function test_log_message_keeps_the_message_as_sent() {
		$attachment = wp_tempnam( 'invoice' );
		file_put_contents( $attachment, '%PDF' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		$atts    = array(
			'headers'     => array( 'From: Shop <shop@example.net>', 'Content-Type: text/html', 'Cc: boss@example.org' ),
			'message'     => '<p>Thanks</p>',
			'attachments' => array( 'invoice.pdf' => $attachment ),
		) + self::atts();
		$payload = Message_Builder::build( $atts, Settings::get(), Account::get() );
		wp_delete_file( $attachment );

		$this->assertSame(
			array(
				'from'         => array(
					'email' => 'wordpress@example.com',
					'name'  => 'Shop',
				),
				'reply_to'     => array(
					'email' => 'shop@example.net',
					'name'  => 'Shop',
				),
				'to'           => array( array( 'email' => 'customer@example.org' ) ),
				'cc'           => array( array( 'email' => 'boss@example.org' ) ),
				'bcc'          => array(),
				'subject'      => 'Hi',
				'content_type' => 'text/html',
				'body'         => '<p>Thanks</p>',
				'attachments'  => array( 'invoice.pdf' ),
				'kept'         => 'full',
				'redacted'     => false,
			),
			Mailer::log_message( $atts, $payload )
		);
	}

	public function test_log_message_reads_wp_mail_arguments_when_no_payload_was_built() {
		$atts = array(
			'headers'     => "From: Shop <shop@example.net>\r\nContent-Type: text/html; charset=UTF-8\r\nBcc: audit@example.org",
			'message'     => '<p>Hi</p>',
			'attachments' => '/tmp/receipt.pdf',
		) + self::atts();

		$this->assertSame(
			array(
				'from'         => array(
					'email' => 'shop@example.net',
					'name'  => 'Shop',
				),
				'reply_to'     => null,
				'to'           => array( array( 'email' => 'customer@example.org' ) ),
				'cc'           => array(),
				'bcc'          => array( array( 'email' => 'audit@example.org' ) ),
				'subject'      => 'Hi',
				'content_type' => 'text/html',
				'body'         => '<p>Hi</p>',
				'attachments'  => array( 'receipt.pdf' ),
				'kept'         => 'full',
				'redacted'     => false,
			),
			Mailer::log_message( $atts, new WP_Error( 'jetpack_send_unsupported', 'Unsupported.' ) )
		);
	}

	/**
	 * Bodies the log keeps no content for.
	 *
	 * @return array[]
	 */
	public static function provide_unkept_bodies() {
		return array(
			'filtered out' => array( 'Body', true, 'off' ),
			'too large'    => array( str_repeat( 'a', Email_Log::MAX_BODY_BYTES + 1 ), false, 'too_large' ),
		);
	}

	/**
	 * @dataProvider provide_unkept_bodies
	 *
	 * @param string $body     Message body.
	 * @param bool   $filtered Whether a site filters content out.
	 * @param string $kept     Why the body wasn't kept.
	 */
	#[DataProvider( 'provide_unkept_bodies' )]
	public function test_log_message_keeps_the_addresses_without_the_body( $body, $filtered, $kept ) {
		if ( $filtered ) {
			add_filter( 'jetpack_send_log_email_content', '__return_false' );
		}

		$message = Mailer::log_message( array( 'message' => $body ) + self::atts(), new WP_Error( 'jetpack_send_rejected', 'Rejected.' ) );
		remove_filter( 'jetpack_send_log_email_content', '__return_false' );

		$this->assertNull( $message['body'] );
		$this->assertSame( $kept, $message['kept'] );
		$this->assertSame( array( array( 'email' => 'customer@example.org' ) ), $message['to'] );
	}

	/**
	 * Start a fake database for the log and the counts.
	 *
	 * @return Fake_Db
	 */
	private function fake_db() {
		wp_cache_flush();
		update_option( Email_Log::DB_VERSION_OPTION, Email_Log::DB_VERSION );
		$this->db = new Fake_Db();
		return $this->db;
	}

	/**
	 * Writes to the log table.
	 *
	 * @return string[]
	 */
	private function log_writes() {
		return array_values( preg_grep( '/^(INSERT INTO|UPDATE) `' . preg_quote( Email_Log::table_name(), '/' ) . '`/', $this->db->queries ) );
	}

	/**
	 * Each way an email ends, with what its row and count say.
	 *
	 * @return array[]
	 */
	public static function provide_outcomes() {
		return array(
			'sent'          => array(
				array(
					202,
					array(
						'request_id' => 'req-1',
						'results'    => array(
							array(
								'status'     => 'sent',
								'message_id' => 'm-1',
							),
						),
					),
				),
				true,
				'sent',
				'',
				'"request_id":"req-1","message_id":"m-1"',
			),
			'handed off'    => array( array( 403, array( 'errors' => array( 'This sender is not authorized to send from example.com' ) ) ), true, 'fallback', 'lockdown', '"host":{"result":"unknown"}' ),
			'failed'        => array( array( 403, array( 'errors' => array( 'This sender is not authorized to send from example.com' ) ) ), false, 'failed', 'lockdown', '"fallback":"off"' ),
			'refused, kept' => array(
				array(
					202,
					array(
						'request_id' => 'req-2',
						'results'    => array(
							array(
								'status' => 'failed',
								'reason' => '550 5.7.1 [CS] Message blocked.',
							),
						),
					),
				),
				false,
				'failed',
				'content',
				'"request_id":"req-2"',
			),
			'timed out'     => array( new WP_Error( 'http_request_failed', 'cURL error 28: Operation timed out after 30001 milliseconds with 0 bytes received' ), true, 'fallback', 'no_answer', '"phase":"after_send"' ),
		);
	}

	/**
	 * @dataProvider provide_outcomes
	 *
	 * @param array|WP_Error $response Mocked response.
	 * @param bool           $fallback Whether the host's mail is the backup.
	 * @param string         $status   Logged status.
	 * @param string         $reason   Logged reason.
	 * @param string         $detail   Part of the logged detail.
	 */
	#[DataProvider( 'provide_outcomes' )]
	public function test_every_outcome_logs_its_reason_and_detail_and_is_counted_at_the_rows_time( $response, $fallback, $status, $reason, $detail ) {
		Settings::update( array( 'fallback' => $fallback ) );
		$this->fake_db();
		$this->http = new Http_Mock( array( $response ) );

		Mailer::pre_wp_mail( null, self::atts() );

		$insert = $this->log_writes()[0];
		$this->assertStringContainsString( "'{$status}'", $insert );
		$this->assertStringContainsString( $detail, $insert );
		preg_match( "/'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'\)$/", $insert, $created );
		$count = $this->db->matching( 'INSERT INTO `' . Stats::table_name() )[0];
		$this->assertStringContainsString( '( ' . Stats::bucket( strtotime( $created[1] . ' UTC' ) ) . ", '{$status}', 'wp_mail'", $count );
		if ( '' !== $reason ) {
			$this->assertStringContainsString( "'{$reason}'", $insert );
		}
	}

	/**
	 * Hook data for the host's outcome.
	 *
	 * @param string $subject Subject.
	 * @return array
	 */
	private static function mail_data( $subject = 'Hi' ) {
		return array(
			'to'      => array( 'Customer@Example.org ' ),
			'subject' => $subject,
		);
	}

	public function test_the_hosts_failure_keeps_sends_reason_and_moves_the_count() {
		$this->fake_db();
		Account::update( array( 'dns_check' => array( 'domain_lockdown' => 'failed' ) ) );
		$this->http = new Http_Mock( array( array( 403, array() ) ) );

		$this->assertNull( Mailer::pre_wp_mail( null, self::atts() ) );
		Mailer::host_failed( new WP_Error( 'wp_mail_failed', 'Could not instantiate mail function.', self::mail_data() + array( 'phpmailer_exception_code' => 2 ) ) );

		$update = $this->log_writes()[1];
		$this->assertStringContainsString( "`status` = 'failed'", $update );
		$this->assertStringContainsString( '"host":{"result":"failed","reason":"host_off","message":"Could not instantiate mail function.","exception_code":2}', $update );
		$this->assertStringNotContainsString( '`reason`', $update );
		$this->assertStringContainsString( 'SET emails = emails - 1 WHERE bucket = ', $this->db->matching( 'UPDATE `' . Stats::table_name() )[0] );
	}

	public function test_a_hand_off_then_a_sent_email_each_keep_their_own_outcome() {
		$this->fake_db();
		$this->http = new Http_Mock( array( array( 503, array() ), self::sent() ) );
		Send::init();

		Mailer::pre_wp_mail( null, self::atts() );
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Two emails in a row are the point of the test.
		Mailer::pre_wp_mail( null, self::atts() );
		do_action( 'wp_mail_succeeded', self::mail_data() );

		// Send's own success hook for the second email must not land on the first.
		$this->assertCount( 2, $this->log_writes() );
		$this->assertStringContainsString( "'fallback'", $this->log_writes()[0] );
		$this->assertStringContainsString( "'sent'", $this->log_writes()[1] );
	}

	public function test_two_hand_offs_get_their_own_outcomes() {
		$this->fake_db();
		$this->http = new Http_Mock( array( array( 503, array() ), array( 503, array() ) ) );
		$second     = array( 'subject' => 'Second' ) + self::atts();

		// The log row is the first insert of each email; its count comes next.
		$first_id = InsertId::$id + 1;
		Mailer::pre_wp_mail( null, self::atts() );
		Mailer::host_succeeded( self::mail_data() );
		$second_id = InsertId::$id + 1;
		Mailer::pre_wp_mail( null, $second );
		Mailer::host_failed( new WP_Error( 'wp_mail_failed', 'SMTP connect() failed.', self::mail_data( 'Second' ) ) );

		$updates = preg_grep( '/^UPDATE/', $this->log_writes() );
		$this->assertCount( 2, $updates );
		$this->assertStringContainsString( '"host":{"result":"accepted"}', current( $updates ) );
		$this->assertStringEndsWith( "`id` = {$first_id}", current( $updates ) );
		$this->assertStringContainsString( '"reason":"host_unreachable"', end( $updates ) );
		$this->assertStringEndsWith( "`id` = {$second_id}", end( $updates ) );
	}

	public function test_another_emails_outcome_changes_nothing() {
		$this->fake_db();
		$this->http = new Http_Mock( array( array( 503, array() ) ) );

		Mailer::pre_wp_mail( null, self::atts() );
		Mailer::host_succeeded( self::mail_data( 'Another subject' ) );
		Mailer::host_failed(
			new WP_Error(
				'wp_mail_failed',
				'x',
				array(
					'to'      => array( 'someone@example.org' ),
					'subject' => 'Hi',
				)
			)
		);

		$this->assertCount( 1, $this->log_writes() );
	}

	public function test_a_test_is_counted_in_its_reserved_hour_and_stales_cached_stats() {
		$this->fake_db();
		$gen        = Email_Log::stats_gen();
		$this->http = new Http_Mock( array( self::sent() ) );

		Mailer::send_test( 'me@example.org' );

		preg_match( "/'(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})'\)$/", $this->log_writes()[0], $reserved );
		$this->assertStringContainsString( '( ' . Stats::bucket( strtotime( $reserved[1] . ' UTC' ) ) . ", 'sent', 'test', ''", $this->db->matching( 'INSERT INTO `' . Stats::table_name() )[0] );
		$this->assertGreaterThan( $gen, Email_Log::stats_gen() );
	}

	/**
	 * A failure, whether it was a test, and how its debug line starts.
	 *
	 * @return array[]
	 */
	public static function provide_failed_lines() {
		$refused   = array( 403, array( 'errors' => array( 'This sender is not authorized to send from example.com' ) ) );
		$timed_out = new WP_Error( 'http_request_failed', 'cURL error 28: Operation timed out after 30001 milliseconds with 0 bytes received' );
		return array(
			'refused'        => array( $refused, false, "'Not sent. " ),
			'timed out'      => array( $timed_out, false, "'Not sure it went out. We didn" ),
			'test refused'   => array( $refused, true, "'Test not sent. " ),
			'test timed out' => array( $timed_out, true, "'Not sure the test went out. We didn" ),
		);
	}

	/**
	 * @dataProvider provide_failed_lines
	 *
	 * @param array|WP_Error $response Mocked response.
	 * @param bool           $test     Whether it's a test email.
	 * @param string         $starts   How the debug line starts.
	 */
	#[DataProvider( 'provide_failed_lines' )]
	public function test_the_debug_line_says_not_sent_only_when_that_is_known( $response, $test, $starts ) {
		Settings::update( array( 'fallback' => false ) );
		$this->fake_db();
		Debug_Log::turn_on( 7 );
		$this->http = new Http_Mock( array( $response ) );

		if ( $test ) {
			Mailer::send_test( 'me@example.org' );
		} else {
			Mailer::pre_wp_mail( null, self::atts() );
		}

		$line = $this->db->matching( $test ? "'test.failed'" : "'mail.failed'" );
		$this->assertCount( 1, $line );
		$this->assertStringContainsString( $starts, $line[0] );
	}

	public function test_a_failed_test_says_why() {
		$this->http = new Http_Mock( array( array( 503, array() ) ) );

		$this->assertSame( 'service_down', Mailer::send_test( 'me@example.org' )->get_error_data()['reason'] );
	}
}
