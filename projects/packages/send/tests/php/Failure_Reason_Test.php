<?php
/**
 * Tests for Failure_Reason.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_Error;

/**
 * @covers \Automattic\Jetpack\Send\Failure_Reason
 */
#[CoversClass( Failure_Reason::class )]
class Failure_Reason_Test extends BaseTestCase {

	/**
	 * Forget the fake mailer.
	 */
	public function tear_down() {
		unset( $GLOBALS['phpmailer'] );
		parent::tear_down();
	}

	/**
	 * An HTTP error as the client returns it.
	 *
	 * @param int    $code  Status.
	 * @param string $words The service's words.
	 * @return WP_Error
	 */
	private static function http( $code, $words ) {
		return new WP_Error(
			'jetpack_send_http_' . $code,
			$words,
			array(
				'status' => $code,
				'errors' => '' === $words ? array() : array( $words ),
			)
		);
	}

	/**
	 * A network error as the client returns it.
	 *
	 * @param string $message cURL's words.
	 * @param string $wp_code WordPress's code.
	 * @return WP_Error
	 */
	private static function transport( $message, $wp_code = 'http_request_failed' ) {
		return new WP_Error(
			'jetpack_send_transport',
			$message,
			array(
				'status'  => 0,
				'wp_code' => $wp_code,
			)
		);
	}

	/**
	 * A per-message refusal inside an accepted answer.
	 *
	 * @param string $reason The service's words.
	 * @return WP_Error
	 */
	private static function refused( $reason ) {
		return new WP_Error(
			'jetpack_send_rejected',
			$reason,
			array(
				'status'      => 502,
				'http_status' => 202,
				'result'      => array(
					'status' => 'failed',
					'reason' => $reason,
				),
			)
		);
	}

	/**
	 * One row per classifier rule: the error, the domain check's Lockdown verdict, and the reason.
	 *
	 * @return array[]
	 */
	public static function provide_failures() {
		return array(
			'no recipient'                => array( new WP_Error( 'jetpack_send_no_recipients', 'The email has no valid recipient.' ), '', 'bad_address' ),
			'attachment gone'             => array( new WP_Error( 'jetpack_send_attachment_unreadable', 'x' ), '', 'attachment_missing' ),
			'attachments over 20 MB'      => array( new WP_Error( 'jetpack_send_attachment_too_large', 'x' ), '', 'too_large' ),
			'embedded images'             => array( new WP_Error( 'jetpack_send_unsupported', 'x', array( 'feature' => 'embeds' ) ), '', 'unsupported' ),
			'verified addresses only'     => array( self::http( 403, 'Can only send to verified email addresses' ), '', 'unverified' ),
			'outgoing requests blocked'   => array( self::transport( 'User has blocked requests through HTTP.', 'http_request_not_executed' ), '', 'blocked_by_site' ),
			'cURL 6'                      => array( self::transport( 'cURL error 6: Could not resolve host: api.example.net' ), '', 'cant_find' ),
			'cURL 28 resolving'           => array( self::transport( 'cURL error 28: Resolving timed out after 5000 milliseconds' ), '', 'cant_find' ),
			'cURL 7'                      => array( self::transport( 'cURL error 7: Failed to connect to api.example.net port 443' ), '', 'cant_connect' ),
			'cURL 28 connecting'          => array( self::transport( 'cURL error 28: Connection timed out after 30000 milliseconds' ), '', 'cant_connect' ),
			'cURL 28 after sending'       => array( self::transport( 'cURL error 28: Operation timed out after 30001 milliseconds with 0 out of 0 bytes received' ), '', 'no_answer' ),
			'cURL 35'                     => array( self::transport( 'cURL error 35: OpenSSL SSL_connect: SSL_ERROR_SYSCALL' ), '', 'insecure' ),
			'cURL 60'                     => array( self::transport( 'cURL error 60: SSL certificate problem: unable to get local issuer certificate' ), '', 'insecure' ),
			'cURL 56'                     => array( self::transport( 'cURL error 56: Recv failure: Connection reset by peer' ), '', 'service_down' ),
			'other network error'         => array( self::transport( 'cURL error 3: URL using bad/illegal format' ), '', 'cant_connect' ),
			'503 with an HTML page'       => array( self::http( 503, 'The sending service returned HTTP 503.' ), '', 'service_down' ),
			'401'                         => array( self::http( 401, 'Unauthorized' ), '', 'account' ),
			'413'                         => array( self::http( 413, 'Payload Too Large' ), '', 'too_large' ),
			'429 over the limit'          => array( self::http( 429, 'Monthly limit reached' ), '', 'limit' ),
			'429 too fast'                => array( self::http( 429, 'Too Many Requests' ), '', 'busy' ),
			'403 with lockdown words'     => array( self::http( 403, '550 5.7.1 This sender is not authorized to send from example.com' ), '', 'lockdown' ),
			'bare 403, lockdown failed'   => array( self::http( 403, '' ), 'failed', 'lockdown' ),
			'bare 403, lockdown passed'   => array( self::http( 403, '' ), 'passed', 'account' ),
			'403 bad key'                 => array( self::http( 403, 'Invalid API key' ), '', 'account' ),
			'403 suspended'               => array( self::http( 403, 'Sub-account is suspended' ), '', 'paused' ),
			'403 the service lost a key'  => array( self::http( 403, 'DKIM key not found for selector jpsend' ), '', 'account' ),
			'400 [SDNF]'                  => array( self::http( 400, '550 5.1.2 [SDNF] Sender Domain Not Found.' ), '', 'sender_domain' ),
			'[BFD]'                       => array( self::refused( '550 5.7.1 [BFD] Sender prohibited by SPF' ), '', 'spf' ),
			'DKIM record'                 => array( self::refused( 'DKIM signature verification failed' ), '', 'dkim' ),
			'[CS] virus'                  => array( self::refused( '550 5.7.1 [CS] Our system has detected that this message is a virus.' ), '', 'virus' ),
			'[CS]'                        => array( self::refused( '550 5.7.1 [CS] Message blocked.' ), '', 'content' ),
			'[UNS]'                       => array( self::refused( '[UNS] Recipient has unsubscribed from your list.' ), '', 'suppressed' ),
			'[BR]'                        => array( self::refused( '[BR] Too many invalid recipients.' ), '', 'bad_list' ),
			'[STF]'                       => array( self::refused( '[STF] Sending too fast.' ), '', 'busy' ),
			'[CSR]'                       => array( self::refused( '[CSR] Account blocked.' ), '', 'paused' ),
			'400 [FEB]'                   => array( self::http( 400, '[FEB] The message contained an attachment type that is not allowed.' ), '', 'attachment_blocked' ),
			'daily limit'                 => array( self::refused( 'This sender has exceeded their daily limit for email api requests.' ), '', 'limit' ),
			'400 naming the address'      => array( self::http( 400, 'personalizations[0].to[0].email: invalid email address' ), '', 'bad_address' ),
			'400 naming an attachment'    => array( self::http( 400, 'attachments[0].content: is required' ), '', 'attachment_blocked' ),
			'400 otherwise'               => array( self::http( 400, 'Malformed JSON' ), '', 'account' ),
			'2xx with no readable result' => array( new WP_Error( 'jetpack_send_unclear', 'x', array( 'http_status' => 202 ) ), '', 'unclear' ),
			'user unknown'                => array( self::refused( '550 5.1.1 User unknown' ), '', 'rejected' ),
			'spam words'                  => array( self::refused( 'Message looks like spam' ), '', 'content' ),
			'nothing known'               => array( self::refused( 'Something odd happened' ), '', 'unknown' ),
		);
	}

	/**
	 * @dataProvider provide_failures
	 *
	 * @param WP_Error $error    The error.
	 * @param string   $lockdown The last domain check's Lockdown verdict.
	 * @param string   $expected Reason.
	 */
	#[DataProvider( 'provide_failures' )]
	public function test_classify( WP_Error $error, $lockdown, $expected ) {
		$this->assertSame( $expected, Failure_Reason::classify( $error, array( 'records' => array( 'domain_lockdown' => $lockdown ) ) ) );
	}

	public function test_owners_match_the_fixture_the_dashboard_reads() {
		$fixture = (array) json_decode( (string) file_get_contents( __DIR__ . '/../fixtures/failure-reasons.json' ), true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents

		$this->assertSame( Failure_Reason::OWNERS, $fixture['owners'] );
		$this->assertEqualsCanonicalizing( $fixture['host_reasons'], array_values( array_unique( array_merge( array_values( Failure_Reason::HOST_KEYS ), array( 'host_failed' ) ) ) ) );
	}

	/**
	 * The host's mailer's messages on a French site, and the outcome each means.
	 *
	 * @return array[]
	 */
	public static function provide_host_failures() {
		return array(
			'no mail on the server'  => array( 'Impossible d’instancier la fonction mail.', 'host_off' ),
			'wrong password'         => array( 'Erreur SMTP : échec de l’authentification.', 'host_login' ),
			'no answer'              => array( 'Erreur SMTP : impossible de se connecter au serveur SMTP.', 'host_unreachable' ),
			'recipient refused'      => array( 'Erreur SMTP : les destinataires suivants ont échoué : j@example.com', 'host_refused' ),
			'bad address'            => array( 'Adresse invalide : (to): nope', 'bad_address' ),
			'missing attachment'     => array( 'Impossible d’accéder au fichier : facture.pdf', 'attachment_missing' ),
			'anything else'          => array( 'Erreur inconnue', 'host_failed' ),
			'English, with no table' => array( 'Could not instantiate mail function.', 'host_off' ),
		);
	}

	/**
	 * @dataProvider provide_host_failures
	 *
	 * @param string $message  The mailer's message, as wp_mail_failed passes it.
	 * @param string $expected Outcome.
	 */
	#[DataProvider( 'provide_host_failures' )]
	public function test_host_outcome_comes_from_the_mailers_own_table_not_english_words( $message, $expected ) {
		if ( 0 !== strpos( $message, 'Could not' ) ) {
			$GLOBALS['phpmailer'] = new class() {
				/**
				 * The mailer's table, in French.
				 *
				 * @return array
				 */
				public function getTranslations() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.MethodNameInvalid -- The mailer's own name.
					return array(
						'instantiate'       => 'Impossible d’instancier la fonction mail.',
						'authenticate'      => 'Erreur SMTP : échec de l’authentification.',
						'connect_host'      => 'Erreur SMTP : impossible de se connecter au serveur SMTP.',
						'recipients_failed' => 'Erreur SMTP : les destinataires suivants ont échoué : ',
						'invalid_address'   => 'Adresse invalide : ',
						'file_access'       => 'Impossible d’accéder au fichier : ',
					);
				}
			};
		}

		$error = new WP_Error( 'wp_mail_failed', $message, array( 'phpmailer_exception_code' => 2 ) );

		$this->assertSame( $expected, Failure_Reason::host_reason( $error ) );
	}

	public function test_a_records_failure_keeps_the_verdicts_and_never_the_request() {
		$error = new WP_Error(
			'jetpack_send_http_403',
			'This sender is not authorized to send from example.com',
			array(
				'status'     => 403,
				'errors'     => array( 'This sender is not authorized to send from example.com', str_repeat( 'x', 600 ) ),
				'ms'         => 412,
				'request_id' => 'req-9',
				'headers'    => array( 'X-Api-Key' => 'secret' ),
				'body'       => 'payload',
			)
		);

		$detail = Failure_Reason::detail(
			$error,
			array(
				'fallback' => true,
				'records'  => array(
					'domain_lockdown' => 'failed',
					'dkim'            => 'passed',
					'spf'             => 'soft failed',
					'checked_at'      => '2026-10-19T18:10:00Z',
				),
				'locale'   => 'fr_FR',
			)
		);

		// It answered with a refusal, so it stopped at the answer, not waiting for one.
		$this->assertSame( 'result', $detail['stage'] );
		$this->assertSame( 403, $detail['http_status'] );
		$this->assertSame( 'on', $detail['fallback'] );
		$this->assertSame( 412, $detail['timing']['ms'] );
		$this->assertSame( 'req-9', $detail['request_id'] );
		$this->assertSame( 'failed', $detail['records']['lockdown'] );
		$this->assertSame( 500, mb_strlen( $detail['service_errors'][1] ) );
		$this->assertStringNotContainsString( 'secret', (string) wp_json_encode( $detail, JSON_UNESCAPED_SLASHES ) );
		$this->assertStringNotContainsString( 'payload', (string) wp_json_encode( $detail, JSON_UNESCAPED_SLASHES ) );
	}

	public function test_a_timeout_after_sending_says_so() {
		$detail = Failure_Reason::detail( self::transport( 'cURL error 28: Operation timed out after 30001 milliseconds with 0 bytes received' ) );

		$this->assertSame(
			array(
				'wp_code' => 'http_request_failed',
				'errno'   => 28,
				'phase'   => 'after_send',
				'message' => 'cURL error 28: Operation timed out after 30001 milliseconds with 0 bytes received',
			),
			$detail['transport']
		);
		$this->assertArrayNotHasKey( 'records', $detail );
	}
}
