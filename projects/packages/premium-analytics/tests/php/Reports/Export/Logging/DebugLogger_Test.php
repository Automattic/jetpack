<?php
/**
 * Tests for the CSV export Debug_Logger.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging;

use Automattic\Jetpack\PremiumAnalytics\Reports\Export\Spy_WC_Logger;
use Exception;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WC_Log_Levels;

require_once __DIR__ . '/../fixtures/class-spy-wc-logger.php';

/**
 * @covers \Automattic\Jetpack\PremiumAnalytics\Reports\Export\Logging\Debug_Logger
 */
#[CoversClass( Debug_Logger::class )]
class DebugLogger_Test extends TestCase {

	/**
	 * Spy WooCommerce logger capturing log() calls.
	 *
	 * @var Spy_WC_Logger
	 */
	private $wc_logger;

	/**
	 * Logger under test.
	 *
	 * @var Debug_Logger
	 */
	private $logger;

	protected function setUp(): void {
		parent::setUp();
		$this->wc_logger = new Spy_WC_Logger();
		$this->logger    = new Debug_Logger( $this->wc_logger );
	}

	public function test_log_message_uses_debug_level_and_prefixes_method() {
		$this->logger->log_message( 'hello', 'My_Class::method' );

		$this->assertCount( 1, $this->wc_logger->calls );
		$call = $this->wc_logger->calls[0];
		$this->assertSame( WC_Log_Levels::DEBUG, $call['level'] );
		$this->assertSame( 'My_Class::method hello', $call['message'] );
		$this->assertSame( 'jetpack-premium-analytics', $call['context']['source'] );
	}

	public function test_log_error_uses_error_level() {
		$this->logger->log_error( 'boom', 'M::m' );
		$this->assertSame( WC_Log_Levels::ERROR, $this->wc_logger->calls[0]['level'] );
		$this->assertStringContainsString( 'boom', $this->wc_logger->calls[0]['message'] );
	}

	public function test_log_exception_logs_message_at_error_level() {
		$this->logger->log_exception( new Exception( 'kaboom' ), 'M::m' );
		$this->assertSame( WC_Log_Levels::ERROR, $this->wc_logger->calls[0]['level'] );
		$this->assertStringContainsString( 'kaboom', $this->wc_logger->calls[0]['message'] );
	}

	public function test_log_response_json_encodes_payload() {
		$this->logger->log_response( array( 'a' => 1 ), 'M::m' );
		$this->assertSame( WC_Log_Levels::DEBUG, $this->wc_logger->calls[0]['level'] );
		$this->assertStringContainsString( '"a": 1', $this->wc_logger->calls[0]['message'] );
	}
}
