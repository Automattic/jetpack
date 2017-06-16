<?php
/**
 * Plugin Name: PWA
 * Description: Add Progressive Web App support to your WordPress site.
 * Plugin URI: https://github.com/automattic/jetpack
 * Author: Automattic
 * Author URI: https://automattic.com
 * Version: 0.4.2
 * Text Domain: pwa
 * Domain Path: /languages/
 * License: GPLv2 or later
 */

define( 'PWA_SW_QUERY_VAR', 'jetpack_service_worker' );
add_action( 'jetpack_activate_module_pwa', 'pwa_activate' );
add_action( 'jetpack_deactivate_module_pwa', 'pwa_deactivate' );
add_action( 'wp', 'pwa_render_service_worker' );
add_filter( 'query_vars', 'pwa_register_query_vars' );
add_action( 'wp_enqueue_scripts', 'pwa_enqueue_script' );

function pwa_activate() {
	if ( ! did_action( 'pwa_init' ) ) {
		pwa_init();
	}
	flush_rewrite_rules();
}

function pwa_deactivate() {
	flush_rewrite_rules();
}

function pwa_register_query_vars( $vars ) {
    $vars[] = PWA_SW_QUERY_VAR;
    return $vars;
}

add_action( 'init', 'pwa_init' );
function pwa_init() {
	if ( false === apply_filters( 'pwa_is_enabled', true ) ) {
		return;
	}

	do_action( 'pwa_init' );
    add_rewrite_rule('service-worker.js$', 'index.php?' . PWA_SW_QUERY_VAR . '=1', 'top');
    wp_register_script( 'jetpack-register-service-worker', plugins_url( 'assets/register-service-worker.js', __FILE__ ), false, '1.5' );
}

function pwa_render_service_worker() {
    global $wp;
    if ( isset( $wp->query_vars[ PWA_SW_QUERY_VAR ] ) ) {
        header( 'Content-Type: application/javascript; charset=utf-8' );
        echo file_get_contents( plugin_dir_path( __FILE__ ) . 'assets/service-worker.js' );
        exit;
    }
}

function pwa_enqueue_script() {
    wp_enqueue_script( 'jetpack-register-service-worker' );
}