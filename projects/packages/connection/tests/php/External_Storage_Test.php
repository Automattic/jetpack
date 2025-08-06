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
	 * Clean up after tests.
	 */
	public function tearDown(): void {
		parent::tearDown();
		remove_all_filters( 'jetpack_external_storage_reportable_empty_options' );
	}

	/**
	 * Test should_report_empty_for_option with default options.
	 */
	public function test_should_report_empty_for_option() {
		// Default reportable options
		$this->assertTrue( External_Storage::should_report_empty_for_option( 'blog_token' ) );
		$this->assertTrue( External_Storage::should_report_empty_for_option( 'id' ) );

		// Non-reportable options
		$this->assertFalse( External_Storage::should_report_empty_for_option( 'user_tokens' ) );
		$this->assertFalse( External_Storage::should_report_empty_for_option( 'random_option' ) );
	}

	/**
	 * Test should_report_empty_for_option with filter.
	 */
	public function test_should_report_empty_for_option_with_filter() {
		add_filter(
			'jetpack_external_storage_reportable_empty_options',
			function ( $options ) {
				$options[] = 'master_user';
				return $options;
			}
		);

		$this->assertTrue( External_Storage::should_report_empty_for_option( 'master_user' ) );
	}

	/**
	 * Test log_event handles error and empty event types.
	 */
	public function test_log_event() {
		$this->expectNotToPerformAssertions();

		External_Storage::log_event( 'error', 'blog_token', 'Connection failed', 'atomic' );
		External_Storage::log_event( 'empty', 'id', '', 'vip' );
	}

	/**
	 * Test should_report_for_environment with constant.
	 */
	public function test_should_report_for_environment() {
		// Use reflection to test private method
		$method = new \ReflectionMethod( External_Storage::class, 'should_report_for_environment' );
		$method->setAccessible( true );

		// Should be false by default
		$this->assertFalse( $method->invoke( null ) );

		// Should be true when constant is set
		if ( ! defined( 'JETPACK_EXTERNAL_STORAGE_REPORTING_ENABLED' ) ) {
			define( 'JETPACK_EXTERNAL_STORAGE_REPORTING_ENABLED', true );
		}
		$this->assertTrue( $method->invoke( null ) );
	}

	/**
	 * Test empty state delay mechanism basics.
	 */
	public function test_empty_state_delay() {
		// Clean up
		delete_transient( 'jetpack_external_storage_empty_delay_blog_token' );

		$method = new \ReflectionMethod( External_Storage::class, 'should_report_empty_state' );
		$method->setAccessible( true );

		// First call should return false (sets delay)
		$this->assertFalse( $method->invoke( null, 'blog_token' ) );

		// Verify delay transient was set
		$this->assertNotFalse( get_transient( 'jetpack_external_storage_empty_delay_blog_token' ) );

		// Second call should still return false (within delay)
		$this->assertFalse( $method->invoke( null, 'blog_token' ) );

		// Non-reportable option should always return false
		$this->assertFalse( $method->invoke( null, 'user_tokens' ) );

		// Clean up
		delete_transient( 'jetpack_external_storage_empty_delay_blog_token' );
	}
}
