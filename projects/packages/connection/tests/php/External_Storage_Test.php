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
	 * Reset provider after each test.
	 */
	public function tearDown(): void {
		parent::tearDown();

		// Reset the provider using reflection
		$reflection = new \ReflectionClass( External_Storage::class );
		$property   = $reflection->getProperty( 'provider' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
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
		// Clear any existing transients
		delete_transient( 'jetpack_ext_storage_rate_limit_test_key' );

		// Use reflection to access the private should_log_event method
		$reflection = new \ReflectionClass( External_Storage::class );
		$method     = $reflection->getMethod( 'should_log_event' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		// First call should return true (no rate limiting yet)
		$result1 = $method->invoke( null, 'test_key' );
		$this->assertTrue( $result1 );

		// Verify rate limit transient was set
		$this->assertNotFalse( get_transient( 'jetpack_ext_storage_rate_limit_test_key' ) );

		// Second immediate call should return false (rate limited)
		$result2 = $method->invoke( null, 'test_key' );
		$this->assertFalse( $result2 );

		// Clean up
		delete_transient( 'jetpack_ext_storage_rate_limit_test_key' );
	}

	/**
	 * Test empty state delay logic by directly testing the private method.
	 *
	 * Note: We use reflection to test the delay logic without triggering debug logging.
	 */
	public function test_empty_state_delay_logic() {
		// Clear any existing transients
		delete_transient( 'jetpack_external_storage_empty_delay_test_key' );

		// Use reflection to access the private should_report_empty_state method
		$reflection = new \ReflectionClass( External_Storage::class );
		$method     = $reflection->getMethod( 'should_report_empty_state' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		// First call should return false (sets delay, doesn't report yet)
		$result1 = $method->invoke( null, 'test_key' );
		$this->assertFalse( $result1 );

		// Verify delay transient was set
		$this->assertNotFalse( get_transient( 'jetpack_external_storage_empty_delay_test_key' ) );

		// Second immediate call should still return false (within delay period)
		$result2 = $method->invoke( null, 'test_key' );
		$this->assertFalse( $result2 );

		// Clean up
		delete_transient( 'jetpack_external_storage_empty_delay_test_key' );
	}
}
