<?php
/**
 * Runs a generated standalone bootstrap the way `auto_prepend_file` would and reports what it left behind.
 *
 * The bootstrap path comes from the JETPACK_WAF_TEST_BOOTSTRAP environment variable, or the first argument under the CLI SAPI.
 *
 * @package automattic/jetpack-waf
 */

/**
 * Names the registered autoloaders, by class for objects.
 *
 * @return string[]
 */
function jetpack_waf_test_autoloaders() {
	$autoloaders = spl_autoload_functions();
	// PHP 7.4 returns false when nothing was ever registered.
	if ( ! $autoloaders ) {
		return array();
	}
	return array_map(
		function ( $autoloader ) {
			return is_object( $autoloader ) ? get_class( $autoloader ) : 'callable';
		},
		$autoloaders
	);
}

$bootstrap = getenv( 'JETPACK_WAF_TEST_BOOTSTRAP' );
if ( ! $bootstrap ) {
	$bootstrap = $argv[1];
}
$before = array_keys( get_defined_vars() );

require $bootstrap;

// Superglobals appear in get_defined_vars() once first used, so they are not leaks.
$leaked = array_values(
	array_filter(
		array_diff( array_keys( get_defined_vars() ), $before, array( 'before' ) ),
		function ( $name ) {
			return 'GLOBALS' !== $name && ! preg_match( '/^_[A-Z]+$/', $name );
		}
	)
);

// Delimited on its own line so that headers or startup notices around it cannot corrupt the report.
echo "\nJETPACK_WAF_REPORT:", json_encode(
	array(
		'sapi'           => PHP_SAPI,
		'run'            => defined( 'JETPACK_WAF_RUN' ) ? JETPACK_WAF_RUN : null,
		'rules_waf'      => defined( 'JETPACK_WAF_TEST_RULES_WAF' ) ? JETPACK_WAF_TEST_RULES_WAF : null,
		'autoloaders'    => jetpack_waf_test_autoloaders(),
		'variables'      => $leaked,
		'runner_loaded'  => class_exists( Automattic\Jetpack\Waf\Waf_Runner::class, false ),
		'runtime_loaded' => class_exists( Automattic\Jetpack\Waf\Waf_Runtime::class, false ),
		// Neither class is loaded during a run; only the WAF one should still resolve afterwards.
		'loads_waf'      => class_exists( Automattic\Jetpack\Waf\Waf_Blocklog_Manager::class ),
		'loads_other'    => class_exists( Automattic\Jetpack\Modules::class ),
		'package_files'  => array_values(
			array_filter(
				get_included_files(),
				function ( $file ) {
					return substr( $file, -11 ) === 'actions.php' || substr( $file, -7 ) === 'cli.php';
				}
			)
		),
	),
	JSON_UNESCAPED_SLASHES
), "\n";
