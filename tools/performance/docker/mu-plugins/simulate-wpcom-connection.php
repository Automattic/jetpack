<?php
/**
 * Plugin Name: Simulate WordPress.com Connection
 * Description: Enable connection simulation only in the connected performance fixture.
 *
 * @package Jetpack_Performance_Testing
 */

defined( 'ABSPATH' ) || exit;

if ( false === getenv( 'WPCOM_SIMULATED_LATENCY_MS' ) ) {
	return;
}

// Load separately so PHP cannot declare the simulator class before the control returns.
require_once __DIR__ . '/connection-simulation/class-jetpack-wpcom-connection-simulator.php';
