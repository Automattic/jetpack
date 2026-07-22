<?php

use PHPUnit\Framework\Attributes\CoversClass;

/**
 * @covers \Jetpack_Heartbeat
 */
#[CoversClass( Jetpack_Heartbeat::class )]
class Jetpack_Heartbeat_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * @since 3.9.0
	 */
	public function test_init() {
		$this->assertInstanceOf( 'Jetpack_Heartbeat', Jetpack_Heartbeat::init() );
	}

	/**
	 * @since 3.9.0
	 */
	public function test_generate_stats_array() {
		$prefix = 'test';

		$result = Jetpack_Heartbeat::generate_stats_array( $prefix );

		$this->assertNotEmpty( $result );
		$this->assertArrayHasKey( $prefix . 'version', $result );
	}

	/**
	 * The environment stats moved to the Connection package, but the heartbeat data consumed by
	 * `Jetpack::get_stat_data()` and `Jetpack::jetpack_check_heartbeat_data()` must still emit
	 * exactly the same stat keys as before the split. This guards that guarantee by asserting the
	 * merged key set matches the golden list the plugin emitted previously.
	 */
	public function test_heartbeat_stats_key_set_is_unchanged_after_split() {
		// Avoid a network request for the `ssl` environment stat.
		set_transient( 'jetpack_https_test', 1 );

		$plugin_stats = Jetpack_Heartbeat::generate_stats_array();
		$env_stats    = \Automattic\Jetpack\Heartbeat::get_environment_stats();

		// The two sources must not share keys, so merging them is lossless.
		$this->assertSame(
			array(),
			array_intersect_key( $plugin_stats, $env_stats ),
			'Plugin-specific and environment heartbeat stats must not share keys.'
		);

		// This is exactly the array `get_stat_data()`/`jetpack_check_heartbeat_data()` build.
		$merged = array_merge( $plugin_stats, $env_stats );

		// Golden list of keys the plugin emitted before the environment stats moved to the package.
		$expected_keys = array(
			// Jetpack-plugin-specific stats.
			'version',
			'branch',
			'manage-enabled',
			// Site environment stats (now provided by the Connection package).
			'wp-version',
			'php-version',
			'wp-branch',
			'php-branch',
			'public',
			'ssl',
			'is-https',
			'language',
			'charset',
			'is-multisite',
			'plugins',
			'space-used',
			'is-multi-network',
		);

		// Conditional keys, mirroring the generators.
		if ( function_exists( 'get_mu_plugins' ) ) {
			$expected_keys[] = 'mu-plugins';
		}
		if ( ! empty( $_SERVER['SERVER_ADDR'] ) || ! empty( $_SERVER['LOCAL_ADDR'] ) ) {
			$expected_keys[] = 'ip-2-octets';
		}
		foreach ( Jetpack::get_available_modules() as $slug ) {
			$expected_keys[] = "module-{$slug}";
		}

		sort( $expected_keys );
		$actual_keys = array_keys( $merged );
		sort( $actual_keys );

		$this->assertSame( $expected_keys, $actual_keys );

		delete_transient( 'jetpack_https_test' );
	}

	/**
	 * `Jetpack::get_ssl_test_message()` maps the Connection package's neutral SSL reason code to
	 * the expected localized, `jetpack`-domain message.
	 */
	public function test_get_ssl_test_message_maps_reason_codes() {
		set_transient(
			'jetpack_https_test_error',
			array(
				'code'   => '',
				'detail' => '',
			)
		);
		$this->assertSame( '', Jetpack::get_ssl_test_message() );

		set_transient(
			'jetpack_https_test_error',
			array(
				'code'   => 'no_ssl_support',
				'detail' => '',
			)
		);
		$this->assertSame( 'WordPress reports no SSL support', Jetpack::get_ssl_test_message() );

		set_transient(
			'jetpack_https_test_error',
			array(
				'code'   => 'bad_response',
				'detail' => 'gateway timeout',
			)
		);
		$this->assertSame( 'Response was not OK: gateway timeout', Jetpack::get_ssl_test_message() );

		delete_transient( 'jetpack_https_test_error' );
	}
}
