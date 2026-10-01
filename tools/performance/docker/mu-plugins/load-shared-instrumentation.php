<?php
/**
 * Load instrumentation shared by the connected and control fixtures.
 *
 * @package automattic/jetpack-performance
 */

foreach ( glob( __DIR__ . '/shared/*.php' ) as $jetpack_performance_mu_plugin ) {
	require_once $jetpack_performance_mu_plugin;
}
