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
	 * Set up a test provider before each test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Register a simple test provider for more realistic testing
		$test_provider = new class() implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {
			public function is_available() {
				return true;
			}
			public function should_handle( $option_name ) {
				return in_array( $option_name, array( 'blog_token', 'id', 'test_key' ), true );
			}
			public function get( $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				// Return null to simulate empty state for testing
				return null;
			}
			public function get_environment_id() {
				return 'test';
			}
		};

		External_Storage::register_provider( $test_provider );
	}

	/**
	 * Reset provider and static caches after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();

		$reflection = new \ReflectionClass( External_Storage::class );

		// Reset the provider
		$provider_property = $reflection->getProperty( 'provider' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$provider_property->setAccessible( true );
		}
		$provider_property->setValue( null, null );

		// Reset the static logged_events cache
		$logged_events_property = $reflection->getProperty( 'logged_events' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$logged_events_property->setAccessible( true );
		}
		$logged_events_property->setValue( null, array() );
	}

	/**
	 * Test get_value with provider that returns null (empty state).
	 *
	 * Note: This test avoids calling get_value() which would trigger logging.
	 * Instead we test the provider registration and basic functionality.
	 */
	public function test_provider_returns_null() {
		// Test that we can register a provider and it behaves as expected
		$reflection        = new \ReflectionClass( External_Storage::class );
		$provider_property = $reflection->getProperty( 'provider' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$provider_property->setAccessible( true );
		}
		$provider = $provider_property->getValue();

		// Verify provider is registered and behaves correctly
		$this->assertNotNull( $provider );
		$this->assertTrue( $provider->is_available() );
		$this->assertTrue( $provider->should_handle( 'blog_token' ) );
		$this->assertNull( $provider->get( 'blog_token' ) );
		$this->assertEquals( 'test', $provider->get_environment_id() );
	}

	/**
	 * Test provider registration and usage.
	 */
	public function test_provider_registration_and_usage() {
		// Create a simple mock provider implementing the interface
		$provider = new class() implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {
			public function is_available() {
				return true;
			}
			public function should_handle( $option_name ) {
				return 'blog_token' === $option_name;
			}
			public function get( $option_name ) {
				if ( 'blog_token' === $option_name ) {
					return 'test-token-value';
				}
				return null;
			}
			public function get_environment_id() {
				return 'test';
			}
		};

		// Register provider
		$result = External_Storage::register_provider( $provider );
		$this->assertTrue( $result );

		// Test that it returns the expected value
		$this->assertEquals( 'test-token-value', External_Storage::get_value( 'blog_token' ) );

		// Test that it returns null for unhandled options
		$this->assertNull( External_Storage::get_value( 'id' ) );
	}

	/**
	 * Test that interface ensures all required methods are implemented.
	 */
	public function test_interface_enforces_required_methods() {
		// Create a provider that implements the interface
		$provider = new class() implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {
			public function is_available() {
				return false;
			}
			public function should_handle( $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return false;
			}
			public function get( $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return null;
			}
			public function get_environment_id() {
				return 'test-minimal';
			}
		};

		// Registration should succeed because all required methods are present
		$result = External_Storage::register_provider( $provider );
		$this->assertTrue( $result );

		// Test that the provider works as expected
		$this->assertFalse( $provider->is_available() );
		$this->assertFalse( $provider->should_handle( 'blog_token' ) );
		$this->assertNull( $provider->get( 'blog_token' ) );
		$this->assertEquals( 'test-minimal', $provider->get_environment_id() );
	}

	/**
	 * Test log_event method exists and is callable.
	 *
	 * Note: We only test method existence to avoid triggering debug logging.
	 */
	public function test_log_event_method_exists() {
		// Test that the method exists and is callable
		$this->assertTrue( method_exists( 'Automattic\Jetpack\Connection\External_Storage', 'log_event' ) );
		$this->assertTrue( is_callable( array( 'Automattic\Jetpack\Connection\External_Storage', 'log_event' ) ) );

		// Don't call the method to avoid debug logging output
	}

	/**
	 * Test rate limiting logic by directly testing the private method.
	 *
	 * Note: We use reflection to test the rate limiting logic without triggering debug logging.
	 */
	public function test_rate_limiting_logic() {
		// Clear any existing transients and static cache
		delete_transient( 'jetpack_ext_storage_rate_limit_test_key' );

		$reflection = new \ReflectionClass( External_Storage::class );

		// Reset static cache before test
		$logged_events_property = $reflection->getProperty( 'logged_events' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$logged_events_property->setAccessible( true );
		}
		$logged_events_property->setValue( null, array() );

		// Use reflection to access the private should_log_event method
		$method = $reflection->getMethod( 'should_log_event' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		// First call should return true (no rate limiting yet)
		$result1 = $method->invoke( null, 'test_key' );
		$this->assertTrue( $result1 );

		// Verify rate limit transient was set
		$this->assertNotFalse( get_transient( 'jetpack_ext_storage_rate_limit_test_key' ) );

		// Second immediate call should return false (rate limited by static cache)
		$result2 = $method->invoke( null, 'test_key' );
		$this->assertFalse( $result2 );

		// Clean up
		delete_transient( 'jetpack_ext_storage_rate_limit_test_key' );
	}

	/**
	 * Test static cache prevents duplicate logs in same request.
	 */
	public function test_static_cache_prevents_duplicate_logs() {
		// Clear any existing transients and static cache
		delete_transient( 'jetpack_ext_storage_rate_limit_static_test' );

		$reflection = new \ReflectionClass( External_Storage::class );

		// Reset static cache before test
		$logged_events_property = $reflection->getProperty( 'logged_events' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$logged_events_property->setAccessible( true );
		}
		$logged_events_property->setValue( null, array() );

		$method = $reflection->getMethod( 'should_log_event' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		// First call should return true
		$result1 = $method->invoke( null, 'static_test' );
		$this->assertTrue( $result1 );

		// Verify static cache was set
		$logged_events = $logged_events_property->getValue( null );
		$this->assertArrayHasKey( 'static_test', $logged_events );

		// Second call should return false (blocked by static cache, not transient)
		$result2 = $method->invoke( null, 'static_test' );
		$this->assertFalse( $result2 );

		// Different key should still work
		$result3 = $method->invoke( null, 'different_key' );
		$this->assertTrue( $result3 );

		// Clean up
		delete_transient( 'jetpack_ext_storage_rate_limit_static_test' );
		delete_transient( 'jetpack_ext_storage_rate_limit_different_key' );
	}
}
