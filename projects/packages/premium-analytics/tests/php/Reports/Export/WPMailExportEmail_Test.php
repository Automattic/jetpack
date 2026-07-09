<?php
/**
 * Tests for Wp_Mail_Export_Email.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

require_once __DIR__ . '/fixtures/class-spy-logger.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Wp_Mail_Export_Email
 */
#[CoversClass( Wp_Mail_Export_Email::class )]
class WPMailExportEmail_Test extends TestCase {

	/**
	 * Temp files to clean up.
	 *
	 * @var string[]
	 */
	private $files = array();

	/**
	 * @after
	 */
	#[After]
	public function cleanup() {
		foreach ( $this->files as $file ) {
			if ( file_exists( $file ) ) {
				wp_delete_file( $file );
			}
		}
		$this->files = array();
	}

	private function make_file( string $contents ): string {
		$file          = trailingslashit( sys_get_temp_dir() ) . 'pa-wp-mail-test-' . wp_generate_password( 8, false ) . '.csv';
		$this->files[] = $file;
		file_put_contents( $file, $contents ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		return $file;
	}

	public function test_send_export_email_attaches_csv_and_logs_success() {
		$logger = new Spy_Logger();
		$email  = new Wp_Mail_Export_Email( $logger );
		$file   = $this->make_file( "Title,Views\nHello,5\n" );
		$sent   = array(
			'attachments' => array(),
			'message'     => '',
			'to'          => '',
		);

		$capture = static function ( $return, $atts ) use ( &$sent ) {
			$sent = array(
				'attachments' => is_array( $atts['attachments'] ?? null ) ? $atts['attachments'] : array(),
				'message'     => (string) ( $atts['message'] ?? '' ),
				'to'          => (string) ( $atts['to'] ?? '' ),
			);
			return true;
		};

		add_filter( 'pre_wp_mail', $capture, 10, 2 );
		try {
			$result = $email->send_export_email(
				'admin@example.com',
				'Top Posts & Pages',
				array(
					'from' => '2026-01-01T00:00:00',
					'to'   => '2026-01-03T00:00:00',
				),
				$file
			);
		} finally {
			remove_filter( 'pre_wp_mail', $capture );
		}

		$this->assertTrue( $result );
		$this->assertSame( 'admin@example.com', $sent['to'] );
		$this->assertSame( array( $file ), $sent['attachments'] );
		$this->assertSame( 'message', $logger->entries[0]['level'] );
	}

	public function test_send_export_email_formats_request_dates_without_timezone_shift() {
		$email = new Wp_Mail_Export_Email();
		$file  = $this->make_file( "Title,Views\nHello,5\n" );
		$sent  = array(
			'message' => '',
		);

		$capture = static function ( $return, $atts ) use ( &$sent ) {
			$sent['message'] = (string) ( $atts['message'] ?? '' );
			return true;
		};

		add_filter( 'pre_wp_mail', $capture, 10, 2 );
		try {
			$result = $email->send_export_email(
				'admin@example.com',
				'Top Posts & Pages',
				array(
					'from' => '2026-01-01T23:00:00-05:00',
					'to'   => '2026-01-03T01:00:00+09:00',
				),
				$file
			);
		} finally {
			remove_filter( 'pre_wp_mail', $capture );
		}

		$this->assertTrue( $result );
		$this->assertStringContainsString( 'Date range: January 1, 2026 to January 3, 2026', $sent['message'] );
	}

	public function test_send_export_email_omits_date_range_when_request_dates_are_invalid() {
		$email = new Wp_Mail_Export_Email();
		$file  = $this->make_file( "Title,Views\nHello,5\n" );
		$sent  = array(
			'message' => '',
		);

		$capture = static function ( $return, $atts ) use ( &$sent ) {
			$sent['message'] = (string) ( $atts['message'] ?? '' );
			return true;
		};

		add_filter( 'pre_wp_mail', $capture, 10, 2 );
		try {
			$result = $email->send_export_email(
				'admin@example.com',
				'Top Posts & Pages',
				array(
					'from' => 'not-a-date',
					'to'   => '2026-01-03T00:00:00',
				),
				$file
			);
		} finally {
			remove_filter( 'pre_wp_mail', $capture );
		}

		$this->assertTrue( $result );
		$this->assertStringNotContainsString( 'Date range:', $sent['message'] );
	}

	public function test_send_export_email_fails_when_file_missing() {
		$logger = new Spy_Logger();
		$email  = new Wp_Mail_Export_Email( $logger );

		$this->assertFalse( $email->send_export_email( 'admin@example.com', 'Top Posts', array(), '/does/not/exist.csv' ) );
		$this->assertSame( 'error', $logger->entries[0]['level'] );
	}

	public function test_send_export_email_fails_when_file_is_too_large() {
		$logger = new Spy_Logger();
		$email  = new Wp_Mail_Export_Email( $logger );
		$file   = $this->make_file( 'x' );

		$handle = fopen( $file, 'c' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fopen
		fseek( $handle, Wp_Mail_Export_Email::MAX_ATTACHMENT_SIZE );
		fwrite( $handle, 'x' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fwrite
		fclose( $handle ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_fclose

		$this->assertFalse( $email->send_export_email( 'admin@example.com', 'Top Posts', array(), $file ) );
		$this->assertSame( 'error', $logger->entries[0]['level'] );
	}
}
