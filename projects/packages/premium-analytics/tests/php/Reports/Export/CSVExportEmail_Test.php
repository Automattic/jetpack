<?php
/**
 * Tests for Csv_Export_Email::send_export_email (attachment-only delivery).
 *
 * @package automattic/jetpack-premium-analytics
 *
 * @phan-file-suppress PhanUndeclaredProperty -- $sent_args is captured by the test WC_Email stub (tests/php/mocks/woocommerce-mocks.php), which Phan does not analyze.
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export;

use PHPUnit\Framework\Attributes\After;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Csv_Export_Email
 */
#[CoversClass( Csv_Export_Email::class )]
class CSVExportEmail_Test extends TestCase {

	/**
	 * Temp CSV file path.
	 *
	 * @var string
	 */
	private $file = '';

	/**
	 * @after
	 */
	#[After]
	public function cleanup() {
		if ( $this->file && file_exists( $this->file ) ) {
			wp_delete_file( $this->file );
		}
	}

	private function make_file( string $contents ): string {
		$this->file = trailingslashit( sys_get_temp_dir() ) . 'pa-email-test-' . wp_generate_password( 8, false ) . '.csv';
		file_put_contents( $this->file, $contents ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		return $this->file;
	}

	public function test_send_attaches_csv_and_reports_success() {
		$email = new Csv_Export_Email();
		$path  = $this->make_file( "Month,Orders\n2026-01-01,5\n" );

		$sent = $email->send_export_email(
			'admin@example.com',
			'Orders Over Time',
			array(
				'from' => 'x',
				'to'   => 'y',
			),
			$path
		);

		$this->assertTrue( $sent );
		$this->assertIsArray( $email->sent_args );
		$this->assertSame( 'admin@example.com', $email->sent_args['to'] );
		$this->assertSame( array( $path ), $email->sent_args['attachments'] );
	}

	public function test_send_fails_when_file_missing_and_does_not_email() {
		$email = new Csv_Export_Email();

		$sent = $email->send_export_email( 'admin@example.com', 'Orders', array(), '/does/not/exist.csv' );

		$this->assertFalse( $sent );
		$this->assertNull( $email->sent_args, 'No email should be sent when the attachment is unavailable.' );
	}
}
