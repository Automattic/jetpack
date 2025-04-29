<?php
/**
 * PHPUnit bootstrap file.
 *
 * @package wpcomsh
 */

$_tests_dir      = getenv( 'WP_TESTS_DIR' );
$_core_dir       = getenv( 'WP_CORE_DIR' );
$_wp_content_dir = getenv( 'WP_CONTENT_DIR' ) ?: $_core_dir; // phpcs:ignore Universal.Operators
$wp_branch       = getenv( 'WP_BRANCH' );

if ( ! $_tests_dir ) {
	if ( $wp_branch ) {
		$_tests_dir = '/tmp/wordpress-' . $wp_branch . '/tests/phpunit';
	} else {
		$_tests_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress-tests-lib';
	}
}

if ( ! $_core_dir ) {
	if ( $wp_branch ) {
		$_core_dir = '/tmp/wordpress-' . $wp_branch . '/src';
	} else {
		$_core_dir = rtrim( sys_get_temp_dir(), '/\\' ) . '/wordpress/';
	}
}

define( 'IS_ATOMIC', true );
define( 'WPMU_PLUGIN_DIR', "{$_wp_content_dir}/mu-plugins" );

if ( ! file_exists( $_tests_dir . '/includes/functions.php' ) ) {
	echo "Could not find $_tests_dir/includes/functions.php, have you run bin/install-wp-tests.sh ?" . PHP_EOL; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
	exit( 1 );
}

// Include library files.
$lib = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( __DIR__ . '/lib' ) );
foreach ( new RegexIterator( $lib, '/^.*\.php$/', RegexIterator::GET_MATCH ) as $file ) {
	require_once $file[0];
}

// Give access to tests_add_filter() function.
require_once $_tests_dir . '/includes/functions.php';

// Speed things up by turning down the password hashing cost.
tests_add_filter(
	'wp_hash_password_options',
	function ( $options ) {
		$options['cost'] = 4;
		return $options;
	}
);

/**
 * Manually load the plugin being tested.
 */
function _manually_load_plugin() {

	if ( file_exists( WPMU_PLUGIN_DIR . '/wpcomsh-loader.php' ) ) {
		return;
	}

	require_once dirname( __DIR__ ) . '/wpcomsh.php';
}
tests_add_filter( 'muplugins_loaded', '_manually_load_plugin' );

/**
 * Add the various plugins to the active options array.
 */
function _manually_load_other_plugins( $active_plugins ) {
	// Get the JP_MONO_INTEGRATION_PLUGINS env var to include other plugins.
	$plugins = getenv( 'JP_MONO_INTEGRATION_PLUGINS' );
	if ( $plugins ) {
		$plugins = explode( ',', $plugins );
		require_once ABSPATH . 'wp-admin/includes/plugin.php';
		$all_plugins = get_plugins();
		foreach ( $plugins as $plugin ) {
			// Ignore wpcomsh and jetpack for now.
			if ( 'wpcomsh' === $plugin || 'jetpack' === $plugin ) {
				continue;
			}
			// Find the main plugin file for this plugin directory
			foreach ( $all_plugins as $plugin_file => $plugin_data ) {
				if ( strpos( $plugin_file, $plugin . '/' ) === 0 ) {
					$active_plugins[] = $plugin_file;
					break;
				}
			}
		}
	}
	return $active_plugins;
}

tests_add_filter( 'option_active_plugins', '_manually_load_other_plugins' );

// Override WP_TESTS_CONFIG_FILE_PATH via environment.
// Important for monorepo CI, if you don't do this then different test runs might collide!
if ( false !== getenv( 'WP_TESTS_CONFIG_FILE_PATH' ) ) {
	define( 'WP_TESTS_CONFIG_FILE_PATH', getenv( 'WP_TESTS_CONFIG_FILE_PATH' ) );
}

// Load trait for WP_UnitTestCase PHPUnit 10 compat.
require_once __DIR__ . '/WP_UnitTestCase_Fix.php';

// Start up the WP testing environment.
require_once $_tests_dir . '/includes/bootstrap.php';
