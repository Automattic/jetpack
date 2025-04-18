<?php
/**
 * Functions Test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Class FunctionsTest.
 */
class FunctionsTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Tests that wpcomsh_get_atomic_client_id returns a default value of 0
	 * when the constant has not been defined and a filter hook is not set.
	 */
	public function test_wpcomsh_get_atomic_client_id_default() {
		$this->assertSame( 0, wpcomsh_get_atomic_client_id() );
	}

	/**
	 * Tests that wpcomsh_get_atomic_client_id returns the constant when it's been
	 * defined.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_wpcomsh_get_atomic_client_id_defined() {
		define( 'ATOMIC_CLIENT_ID', '2' );
		add_filter(
			'wpcomsh_get_atomic_client_id',
			function () {
				return '3';
			}
		);
		$this->assertSame( 2, wpcomsh_get_atomic_client_id() );
	}

	/**
	 * Tests that wpcomsh_get_atomic_client_id returns the integer value of the
	 * value provided by filter hook.
	 */
	public function test_wpcomsh_get_atomic_client_id_filter() {
		add_filter(
			'wpcomsh_get_atomic_client_id',
			function () {
				return '1';
			}
		);
		$this->assertSame( 1, wpcomsh_get_atomic_client_id() );
	}

	/**
	 * Tests that wpcom_newsletter_categories_location returns modal
	 */
	public function test_newsletter_categories_location_filter() {
		$this->assertSame( 'modal', apply_filters( 'wpcom_newsletter_categories_location', 'block' ) );
		$this->assertSame( 'modal', wpcomsh_newsletter_categories_location() );
	}

	/**
	 * Tests that wpcomsh_ensure_critical_plugins_active returns the input value when it's not an array.
	 */
	public function test_ensure_critical_plugins_active_non_array() {
		$this->assertSame( false, wpcomsh_ensure_critical_plugins_active( false ) );
		$this->assertSame( null, wpcomsh_ensure_critical_plugins_active( null ) );
		$this->assertSame( 'string', wpcomsh_ensure_critical_plugins_active( 'string' ) );
	}

	/**
	 * Tests that wpcomsh_ensure_critical_plugins_active adds critical plugins to the list if they're missing.
	 */
	public function test_ensure_critical_plugins_active_adds_missing_plugins() {
		$active_plugins = array( 'some-plugin/some-plugin.php' );
		$result         = wpcomsh_ensure_critical_plugins_active( $active_plugins );

		// Verify that all critical plugins are added
		foreach ( WPCOM_CORE_ATOMIC_PLUGINS as $critical_plugin ) {
			$this->assertContains( $critical_plugin, $result );
		}

		// Verify that the original plugin is still in the list
		$this->assertContains( 'some-plugin/some-plugin.php', $result );
	}

	/**
	 * Tests that wpcomsh_ensure_critical_plugins_active doesn't duplicate plugins that are already in the list.
	 */
	public function test_ensure_critical_plugins_active_no_duplicates() {
		$active_plugins = array_merge(
			array( 'some-plugin/some-plugin.php' ),
			WPCOM_CORE_ATOMIC_PLUGINS
		);
		$result         = wpcomsh_ensure_critical_plugins_active( $active_plugins );

		// Count occurrences of each critical plugin
		foreach ( WPCOM_CORE_ATOMIC_PLUGINS as $critical_plugin ) {
			$count = array_count_values( $result )[ $critical_plugin ];
			$this->assertSame( 1, $count, "Plugin {$critical_plugin} appears multiple times in the result" );
		}

		// Verify that the result has the expected length
		$expected_length = count( WPCOM_CORE_ATOMIC_PLUGINS ) + 1; // +1 for the 'some-plugin'
		$this->assertCount( $expected_length, $result );
	}

	/**
	 * Tests that wpcomsh_ensure_critical_plugins_active works with an empty input array.
	 */
	public function test_ensure_critical_plugins_active_empty_array() {
		$result = wpcomsh_ensure_critical_plugins_active( array() );

		// Verify that all critical plugins are added
		foreach ( WPCOM_CORE_ATOMIC_PLUGINS as $critical_plugin ) {
			$this->assertContains( $critical_plugin, $result );
		}

		// Verify that only critical plugins are in the result
		$this->assertSameSize( WPCOM_CORE_ATOMIC_PLUGINS, $result );
	}
}
