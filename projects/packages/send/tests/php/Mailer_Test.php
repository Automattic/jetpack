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
	 * Stop intercepting HTTP.
	 */
	public function tear_down() {
		if ( $this->http ) {
			$this->http->remove();
			$this->http = null;
		}
		parent::tear_down();
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

	public function test_send_test_reports_a_readable_message_for_an_html_error_page() {
		$this->http = new Http_Mock( array( array( 401, '<html><body>401 Authorization Required</body></html>' ) ) );

		$result = Mailer::send_test( 'admin@example.org' );

		$this->assertInstanceOf( WP_Error::class, $result );
		$this->assertSame( 'MailChannels returned HTTP 401.', $result->get_error_message() );
	}

	public function test_log_message_keeps_the_message_as_sent() {
		$attachment = wp_tempnam( 'invoice' );
		file_put_contents( $attachment, '%PDF' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		$atts    = array(
			'headers'     => array( 'From: Shop <shop@other.org>', 'Content-Type: text/html', 'Cc: boss@example.org' ),
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
					'email' => 'shop@other.org',
					'name'  => 'Shop',
				),
				'cc'           => array( array( 'email' => 'boss@example.org' ) ),
				'bcc'          => array(),
				'content_type' => 'text/html',
				'body'         => '<p>Thanks</p>',
				'attachments'  => array( 'invoice.pdf' ),
			),
			Mailer::log_message( $atts, $payload )
		);
	}

	public function test_log_message_reads_wp_mail_arguments_when_no_payload_was_built() {
		$atts = array(
			'headers'     => "From: Shop <shop@other.org>\r\nContent-Type: text/html; charset=UTF-8\r\nBcc: audit@example.org",
			'message'     => '<p>Hi</p>',
			'attachments' => '/tmp/receipt.pdf',
		) + self::atts();

		$this->assertSame(
			array(
				'from'         => array(
					'email' => 'shop@other.org',
					'name'  => 'Shop',
				),
				'reply_to'     => null,
				'cc'           => array(),
				'bcc'          => array( array( 'email' => 'audit@example.org' ) ),
				'content_type' => 'text/html',
				'body'         => '<p>Hi</p>',
				'attachments'  => array( 'receipt.pdf' ),
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
			'filtered out' => array( 'Body', true ),
			'too large'    => array( str_repeat( 'a', Email_Log::MAX_BODY_BYTES + 1 ), false ),
		);
	}

	/**
	 * @dataProvider provide_unkept_bodies
	 *
	 * @param string $body     Message body.
	 * @param bool   $filtered Whether a site filters content out.
	 */
	#[DataProvider( 'provide_unkept_bodies' )]
	public function test_log_message_keeps_no_content( $body, $filtered ) {
		if ( $filtered ) {
			add_filter( 'jetpack_send_log_email_content', '__return_false' );
		}

		$message = Mailer::log_message( array( 'message' => $body ) + self::atts(), new WP_Error( 'jetpack_send_rejected', 'Rejected.' ) );
		remove_filter( 'jetpack_send_log_email_content', '__return_false' );

		$this->assertNull( $message );
	}
}
