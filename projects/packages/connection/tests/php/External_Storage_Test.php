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

		// Reset the init_fired flag
		$init_fired_property = $reflection->getProperty( 'init_fired' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$init_fired_property->setAccessible( true );
		}
		$init_fired_property->setValue( null, false );

		// Remove any action callbacks added during tests
		remove_all_filters( 'jetpack_external_storage_init' );
		remove_all_filters( 'jetpack_external_storage_provider_registered' );
	}

	/**
	 * Test provider registration and get_value functionality.
	 */
	public function test_provider_registration_and_get_value() {
		$provider = new class() implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {
			public function is_available() {
				return true;
			}
			public function should_handle( $option_name ) {
				return 'blog_token' === $option_name;
			}
			public function get( $option_name ) {
				return 'blog_token' === $option_name ? 'test-token-value' : null;
			}
			public function get_environment_id() {
				return 'test';
			}
		};

		// Test registration
		$this->assertTrue( External_Storage::register_provider( $provider ) );

		// Test get_value returns provider value
		$this->assertSame( 'test-token-value', External_Storage::get_value( 'blog_token' ) );

		// Test get_value returns null for unhandled options
		$this->assertNull( External_Storage::get_value( 'unhandled_option' ) );
	}

	/**
	 * Test provider with only required methods (no optional methods).
	 */
	public function test_provider_without_optional_methods() {
		$provider = new class() implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {
			public function is_available() {
				return true;
			}
			public function should_handle( $option_name ) {
				return 'blog_token' === $option_name;
			}
			public function get( $option_name ) {
				return 'blog_token' === $option_name ? 'test-value' : null;
			}
			public function get_environment_id() {
				return 'test-minimal';
			}
		};

		External_Storage::register_provider( $provider );

		// Verify optional methods don't exist
		$this->assertFalse( method_exists( $provider, 'handle_error_event' ) );
		$this->assertFalse( method_exists( $provider, 'get_empty_state_delay_threshold' ) );

		// Verify provider still works
		$this->assertSame( 'test-value', External_Storage::get_value( 'blog_token' ) );
	}

	/**
	 * Test rate limiting with static cache prevents duplicate logs.
	 */
	public function test_rate_limiting_with_static_cache() {
		delete_transient( 'jetpack_ext_storage_rate_limit_error_rate_test' );
		delete_transient( 'jetpack_ext_storage_rate_limit_error_other_key' );
		delete_transient( 'jetpack_ext_storage_rate_limit_empty_rate_test' );

		$reflection = new \ReflectionClass( External_Storage::class );

		// Reset static cache
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
		$this->assertTrue( $method->invoke( null, 'rate_test', 'error' ) );

		// Verify both caches are set (key includes event type)
		$this->assertNotFalse( get_transient( 'jetpack_ext_storage_rate_limit_error_rate_test' ) );
		$this->assertArrayHasKey( 'error_rate_test', $logged_events_property->getValue() );

		// Second call with same key and event type should return false (blocked by static cache)
		$this->assertFalse( $method->invoke( null, 'rate_test', 'error' ) );

		// Different key should still work
		$this->assertTrue( $method->invoke( null, 'other_key', 'error' ) );

		// Same key with different event type should also work
		$this->assertTrue( $method->invoke( null, 'rate_test', 'empty' ) );
		$this->assertArrayHasKey( 'empty_rate_test', $logged_events_property->getValue() );

		// Clean up
		delete_transient( 'jetpack_ext_storage_rate_limit_error_rate_test' );
		delete_transient( 'jetpack_ext_storage_rate_limit_error_other_key' );
		delete_transient( 'jetpack_ext_storage_rate_limit_empty_rate_test' );
	}

	/**
	 * Test empty state delay mechanism with default threshold.
	 */
	public function test_empty_state_delay_mechanism() {
		delete_transient( 'jetpack_external_storage_empty_delay_delay_test' );

		$reflection = new \ReflectionClass( External_Storage::class );
		$method     = $reflection->getMethod( 'should_report_empty_state' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		// First call sets transient and returns false
		$this->assertFalse( $method->invoke( null, 'delay_test' ) );
		$this->assertNotFalse( get_transient( 'jetpack_external_storage_empty_delay_delay_test' ) );

		// Second call within delay period still returns false
		$this->assertFalse( $method->invoke( null, 'delay_test' ) );

		// Clean up
		delete_transient( 'jetpack_external_storage_empty_delay_delay_test' );
	}

	/**
	 * Test provider with custom delay threshold of 0 (immediate reporting).
	 */
	public function test_provider_custom_delay_threshold_zero() {
		delete_transient( 'jetpack_external_storage_empty_delay_immediate_test' );

		$provider = new class() implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {
			public function is_available() {
				return true;
			}
			public function should_handle( $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return true;
			}
			public function get( $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return null;
			}
			public function get_environment_id() {
				return 'test';
			}
			public function get_empty_state_delay_threshold() {
				return 0; // No delay - external storage is source of truth
			}
		};

		External_Storage::register_provider( $provider );

		$reflection = new \ReflectionClass( External_Storage::class );
		$method     = $reflection->getMethod( 'should_report_empty_state' );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		// First call sets transient and should return false
		$this->assertFalse( $method->invoke( null, 'immediate_test' ) );

		// Second call returns true immediately (threshold is 0)
		$this->assertTrue( $method->invoke( null, 'immediate_test' ) );

		// Clean up
		delete_transient( 'jetpack_external_storage_empty_delay_immediate_test' );
	}

	/**
	 * Test provider with optional methods implemented.
	 */
	public function test_provider_with_optional_methods() {
		$provider = new class() implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {
			public function is_available() {
				return true;
			}
			public function should_handle( $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return true;
			}
			public function get( $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return null;
			}
			public function get_environment_id() {
				return 'test';
			}
			public function get_empty_state_delay_threshold() {
				return 90;
			}
			public function handle_error_event( $event_type, $key, $details, $environment ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				// Custom error handling
			}
		};

		// Verify optional methods exist
		$this->assertTrue( method_exists( $provider, 'handle_error_event' ) );
		$this->assertTrue( method_exists( $provider, 'get_empty_state_delay_threshold' ) );

		// Verify custom threshold value
		$reflection = new \ReflectionMethod( $provider, 'get_empty_state_delay_threshold' );
		$this->assertSame( 90, $reflection->invoke( $provider ) );
	}

	/**
	 * Test that jetpack_external_storage_init fires on first get_value() call.
	 */
	public function test_init_action_fires_on_first_get_value() {
		$fired = 0;
		add_action(
			'jetpack_external_storage_init',
			function () use ( &$fired ) {
				++$fired;
			}
		);

		External_Storage::get_value( 'id' );
		$this->assertSame( 1, $fired, 'Init action should fire on first get_value() call' );

		External_Storage::get_value( 'blog_token' );
		$this->assertSame( 1, $fired, 'Init action should not fire again on subsequent calls' );
	}

	/**
	 * Test that a provider registered via the init action is used by the same get_value() call.
	 */
	public function test_init_action_allows_late_provider_registration() {
		$provider = new class() implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {
			public function is_available() {
				return true;
			}
			public function should_handle( $option_name ) {
				return 'id' === $option_name;
			}
			public function get( $option_name ) {
				return 'id' === $option_name ? 12345 : null;
			}
			public function get_environment_id() {
				return 'test-late';
			}
		};

		add_action(
			'jetpack_external_storage_init',
			function () use ( $provider ) {
				External_Storage::register_provider( $provider );
			}
		);

		$value = External_Storage::get_value( 'id' );
		$this->assertSame( 12345, $value, 'Provider registered during init action should serve the triggering read' );
	}

	/**
	 * Test that jetpack_external_storage_provider_registered fires on register_provider().
	 */
	public function test_provider_registered_action_fires() {
		$received_provider = null;
		add_action(
			'jetpack_external_storage_provider_registered',
			function ( $provider ) use ( &$received_provider ) {
				$received_provider = $provider;
			}
		);

		$provider = new class() implements \Automattic\Jetpack\Connection\Storage_Provider_Interface {
			public function is_available() {
				return true;
			}
			public function should_handle( $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return true;
			}
			public function get( $option_name ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
				return null;
			}
			public function get_environment_id() {
				return 'test-registered';
			}
		};

		External_Storage::register_provider( $provider );
		$this->assertSame( $provider, $received_provider, 'Registered action should pass the provider instance' );
	}
}
