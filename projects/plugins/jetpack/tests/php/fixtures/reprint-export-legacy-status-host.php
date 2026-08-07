<?php
/**
 * Exercises Reprint export with a legacy Status Host class loaded first.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Reprint_Export\Reprint_Exporter;
use Automattic\Jetpack\Status\Host;

/**
 * Minimal WordPress filter stub required by Reprint_Exporter::is_available().
 *
 * @param string $hook_name Filter name.
 * @param mixed  $value     Filter value.
 * @return mixed
 */
function apply_filters( $hook_name, $value ) {
	unset( $hook_name );
	return $value;
}

$plugin_dir = dirname( __DIR__, 3 );

// Simulate a third-party plugin defining the Status 6.1.5 class before Jetpack loads.
require __DIR__ . '/legacy-status/class-host.php';
require $plugin_dir . '/vendor/autoload.php';
require $plugin_dir . '/src/reprint-export/class-reprint-exporter.php';

$expected_host_methods = array(
	'allow_wpcom_environments',
	'allow_wpcom_public_api_domain',
	'get_calypso_env',
	'get_known_host_guess',
	'get_source_query',
	'get_wpcom_site_id',
	'is_atomic_platform',
	'is_newspack_site',
	'is_p2_site',
	'is_vip_site',
	'is_woa_site',
	'is_wpcom_platform',
	'is_wpcom_simple',
);
$actual_host_methods   = get_class_methods( Host::class );
sort( $expected_host_methods );
sort( $actual_host_methods );

if ( $expected_host_methods !== $actual_host_methods ) {
	throw new RuntimeException(
		'The legacy Host fixture does not match the jetpack-status 6.1.5 public API. Actual methods: ' . implode( ', ', $actual_host_methods )
	);
}

if ( method_exists( Host::class, 'is_pressable' ) ) {
	throw new RuntimeException( 'The legacy Host fixture was not loaded.' );
}

Constants::set_constant( 'IS_PRESSABLE', true );
if ( ! Reprint_Exporter::is_available() ) {
	throw new RuntimeException( 'Reprint should be available on Pressable.' );
}

Constants::set_constant( 'IS_PRESSABLE', false );
if ( Reprint_Exporter::is_available() ) {
	throw new RuntimeException( 'Reprint should be unavailable on a generic host.' );
}

Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
Constants::set_constant( 'ATOMIC_CLIENT_ID', 456 );
if ( ! Reprint_Exporter::is_available() ) {
	throw new RuntimeException( 'Reprint should be available on Atomic.' );
}

echo "OK\n";
