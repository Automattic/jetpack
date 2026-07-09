<?php
/**
 * Tests for the WooCommerce-free Error_Log_Logger.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging;

use Exception;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Error_Log_Logger
 */
#[CoversClass( Error_Log_Logger::class )]
class ErrorLogLogger_Test extends TestCase {

	/**
	 * Temporary error log path.
	 *
	 * @var string
	 */
	private $log_file;

	/**
	 * Previous error_log ini setting.
	 *
	 * @var string|false
	 */
	private $previous_error_log;

	protected function setUp(): void {
		parent::setUp();

		$this->log_file           = tempnam( sys_get_temp_dir(), 'pa-error-log-' );
		$this->previous_error_log = ini_get( 'error_log' );
		ini_set( 'error_log', $this->log_file );
	}

	protected function tearDown(): void {
		if ( false !== $this->previous_error_log ) {
			ini_set( 'error_log', $this->previous_error_log );
		}

		if ( is_string( $this->log_file ) && file_exists( $this->log_file ) ) {
			unlink( $this->log_file );
		}

		parent::tearDown();
	}

	public function test_logs_messages_errors_exceptions_and_responses() {
		$logger = new Error_Log_Logger();

		$logger->log_message( 'hello', 'My_Class::method' );
		$logger->log_error( 'boom', 'My_Class::method' );
		$logger->log_exception( new Exception( 'kaboom' ), 'My_Class::method' );
		$logger->log_response( array( 'url' => 'https://example.com/a' ), 'My_Class::method' );

		$resource = fopen( 'php://temp', 'r' );
		try {
			$logger->log_response( array( 'resource' => $resource ), 'My_Class::method' );
		} finally {
			fclose( $resource );
		}

		$contents = file_get_contents( $this->log_file );
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			$this->assertStringContainsString( '[jetpack-premium-analytics] INFO: My_Class::method hello', $contents );
			$this->assertStringContainsString( '[jetpack-premium-analytics] ERROR: My_Class::method boom', $contents );
			$this->assertStringContainsString( '[jetpack-premium-analytics] ERROR: My_Class::method kaboom', $contents );
			$this->assertStringContainsString( '{"url":"https://example.com/a"}', $contents );
		} else {
			$this->assertSame( '', $contents );
		}
	}
}
