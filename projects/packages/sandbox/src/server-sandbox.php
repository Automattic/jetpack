<?php
/**
 * This feature is only useful for Automattic developers.
 * It configures Jetpack to talk to staging/sandbox servers
 * on WordPress.com instead of production servers.
 *
 * @package automattic/jetpack-sandbox
 */

/**
 * Returns the new url and host values.
 *
 * @param string $sandbox Sandbox domain.
 * @param string $url URL of request about to be made.
 * @param array  $headers Headers of request about to be made.
 *
 * @return array [ 'url' => new URL, 'host' => new Host ]
 */
function jetpack_connection_server_sandbox_request_parameters( $sandbox, $url, $headers ) {
	$host = '';

	$url_host = wp_parse_url( $url, PHP_URL_HOST );

	switch ( $url_host ) {
		case 'public-api.wordpress.com':
		case 'jetpack.wordpress.com':
		case 'jetpack.com':
		case 'dashboard.wordpress.com':
			$host = isset( $headers['Host'] ) ? $headers['Host'] : $url_host;
			$url  = preg_replace(
				'@^(https?://)' . preg_quote( $url_host, '@' ) . '(?=[/?#].*|$)@',
				'${1}' . $sandbox,
				$url,
				1
			);
	}

	return compact( 'url', 'host' );
}

/**
 * Modifies parameters of request in order to send the request to the
 * server specified by `JETPACK__SANDBOX_DOMAIN`.
 *
 * Attached to the `requests-requests.before_request` filter.
 *
 * @param string $url URL of request about to be made.
 * @param array  $headers Headers of request about to be made.
 * @return void
 */
function jetpack_connection_server_sandbox( &$url, &$headers ) {
	if ( ! defined( 'JETPACK__SANDBOX_DOMAIN' ) ) {
		return;
	}

	$original_url = $url;

	$request_parameters = jetpack_connection_server_sandbox_request_parameters( JETPACK__SANDBOX_DOMAIN, $url, $headers );

	$url = $request_parameters['url'];

	if ( $request_parameters['host'] ) {
		$headers['Host'] = $request_parameters['host'];

		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			error_log( sprintf( "SANDBOXING via '%s': '%s'", JETPACK__SANDBOX_DOMAIN, $original_url ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
		}
	}
}

add_action( 'requests-requests.before_request', 'jetpack_connection_server_sandbox', 10, 2 );

/**
 * Adds a "Jetpack API Sandboxed" item to the admin bar if the JETPACK__SANDBOX_DOMAIN
 * constant is set.
 *
 * Attached to the `admin_bar_menu` action.
 *
 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
 */
function jetpack_connection_admin_bar_add_sandbox_item( $wp_admin_bar ) {
	if ( ! defined( 'JETPACK__SANDBOX_DOMAIN' ) ) {
		return;
	}

	$node = array(
		'id'    => 'jetpack-connection-api-sandbox',
		'title' => 'Jetpack API Sandboxed',
		'meta'  => array(
			'title' => 'Sandboxing via ' . JETPACK__SANDBOX_DOMAIN,
		),
	);

	$wp_admin_bar->add_menu( $node );
}

add_action( 'admin_bar_menu', 'jetpack_connection_admin_bar_add_sandbox_item', 999 );
