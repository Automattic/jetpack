<?php
/**
 * External Storage functionality testing.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack\Connection;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * External Storage functionality testing.
 *
 * @covers \Automattic\Jetpack\Connection\External_Storage
 */
#[CoversClass( External_Storage::class )]
class External_Storage_Test extends TestCase {

	/**
	 * Reset provider after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();

		// Reset the provider using reflection
		$reflection = new \ReflectionClass( External_Storage::class );
		$property   = $reflection->getProperty( 'provider' );
		$property->setAccessible( true );
		$property->setValue( null, null );
	}

	/**
	 * Test get_option with no provider returns null.
	 */
	public function test_get_option_no_provider() {
		$this->assertNull( External_Storage::get_option( 'blog_token' ) );
	}

	/**
	 * Test log_event method doesn't throw errors.
	 */
	public function test_log_event() {
		$this->expectNotToPerformAssertions();

		External_Storage::log_event( 'error', 'blog_token', 'Connection failed', 'atomic' );
		External_Storage::log_event( 'empty', 'id', '', 'test' );
	}
}
