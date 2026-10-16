<?php

use Automattic\Jetpack\Status\Cache as StatusCache;
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

		/*
		 * This is the array `get_stat_data()` builds. `jetpack_check_heartbeat_data()` merges the
		 * `identitycrisis` stat on top of it as well -- see
		 * `test_check_heartbeat_data_flags_identity_crisis_as_bad()` below.
		 */
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
	 * The IDC stat moved to the Connection package's `jetpack_heartbeat_stats_array` filter callback,
	 * which `Jetpack::jetpack_check_heartbeat_data()` does not run. It must still rebuild the stat so
	 * `wp jetpack status full` keeps reporting identity crises.
	 */
	public function test_check_heartbeat_data_includes_identity_crisis_stat() {
		// Avoid a network request for the `ssl` environment stat.
		set_transient( 'jetpack_https_test', 1 );

		try {
			$stats = Jetpack::jetpack_check_heartbeat_data();

			$all_stats = array_merge( $stats['good'], $stats['caution'], $stats['bad'] );
			$this->assertArrayHasKey( 'identitycrisis', $all_stats );

			// Disconnected site, so there is no crisis to report and the stat is unremarkable.
			$this->assertSame( 'no', $stats['good']['identitycrisis'] );
		} finally {
			delete_transient( 'jetpack_https_test' );
		}
	}

	/**
	 * A site in an identity crisis must land in the `bad` bucket, which is what the WP-CLI status
	 * command prints in red.
	 */
	public function test_check_heartbeat_data_flags_identity_crisis_as_bad() {
		set_transient( 'jetpack_https_test', 1 );

		// Mock a connection so `Identity_Crisis::check_identity_crisis()` gets past its connection guard.
		Jetpack_Options::update_option( 'id', 1234 );
		Jetpack_Options::update_option( 'blog_token', 'asd.asd.1' );

		/*
		 * Deliberately does not match the local home/siteurl, so `validate_sync_error_idc_option()`
		 * cannot reach its remote-validation branch. Validity comes from the filter below instead,
		 * which keeps the test free of HTTP requests.
		 */
		Jetpack_Options::update_option(
			'sync_error_idc',
			array(
				'home'    => 'http://example.com',
				'siteurl' => 'http://example.com',
			)
		);

		add_filter( 'jetpack_offline_mode', '__return_false', 1000 );
		add_filter( 'jetpack_sync_error_idc_validation', '__return_true', 1000 );
		StatusCache::clear();

		try {
			$stats = Jetpack::jetpack_check_heartbeat_data();

			// The IDC stat is the only one the check can route to `bad`.
			$this->assertSame( array( 'identitycrisis' => 'yes' ), $stats['bad'] );
			$this->assertArrayNotHasKey( 'identitycrisis', $stats['good'] );
		} finally {
			remove_filter( 'jetpack_offline_mode', '__return_false', 1000 );
			remove_filter( 'jetpack_sync_error_idc_validation', '__return_true', 1000 );
			Jetpack_Options::delete_option( array( 'id', 'blog_token', 'sync_error_idc' ) );
			StatusCache::clear();
			delete_transient( 'jetpack_https_test' );
		}
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
