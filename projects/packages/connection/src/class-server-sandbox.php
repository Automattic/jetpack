<?php
/**
 * The Server_Sandbox class.
 *
 * This feature is only useful for Automattic developers.
 * It configures Jetpack to talk to staging/sandbox servers
 * on WordPress.com instead of production servers.
 *
 * @package automattic/jetpack-sandbox
 */

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;

/**
 * The Server_Sandbox class.
 */
class Server_Sandbox {

	/**
	 * Sets up the action hooks for the server sandbox.
	 */
	public function init() {
		if ( did_action( 'jetpack_server_sandbox_init' ) ) {
			return;
		}

		add_action( 'requests-requests.before_request', array( $this, 'server_sandbox' ), 10, 2 );
		add_action( 'admin_bar_menu', array( $this, 'admin_bar_add_sandbox_item' ), 999 );

		/**
		 * Fires when the server sandbox is initialized. This action is used to ensure that
		 * the server sandbox action hooks are set up only once.
		 *
		 * @since $$next_version$$
		 */
		do_action( 'jetpack_server_sandbox_init' );
	}

	/**
	 * Returns the new url and host values.
	 *
	 * @param string $sandbox Sandbox domain.
	 * @param string $url URL of request about to be made.
	 * @param array  $headers Headers of request about to be made.
	 *
	 * @return array [ 'url' => new URL, 'host' => new Host ]
	 */
	public function server_sandbox_request_parameters( $sandbox, $url, $headers ) {
		$host = '';

		if ( ! is_string( $sandbox ) || ! is_string( $url ) ) {
			return array(
				'url'  => $url,
				'host' => $host,
			);
		}

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
	public function server_sandbox( &$url, &$headers ) {
		if ( ! Constants::get_constant( 'JETPACK__SANDBOX_DOMAIN' ) ) {
			return;
		}

		$original_url = $url;

		$request_parameters = $this->server_sandbox_request_parameters( Constants::get_constant( 'JETPACK__SANDBOX_DOMAIN' ), $url, $headers );

		$url = $request_parameters['url'];

		if ( $request_parameters['host'] ) {
			$headers['Host'] = $request_parameters['host'];

			if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
				error_log( sprintf( "SANDBOXING via '%s': '%s'", Constants::get_constant( 'JETPACK__SANDBOX_DOMAIN' ), $original_url ) ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			}
		}
	}

	/**
	 * Adds a "Jetpack API Sandboxed" item to the admin bar if the JETPACK__SANDBOX_DOMAIN
	 * constant is set.
	 *
	 * Attached to the `admin_bar_menu` action.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar The WP_Admin_Bar instance.
	 */
	public function admin_bar_add_sandbox_item( $wp_admin_bar ) {
		if ( ! Constants::get_constant( 'JETPACK__SANDBOX_DOMAIN' ) ) {
			return;
		}

		$node = array(
			'id'    => 'jetpack-connection-api-sandbox',
			'title' => 'Jetpack API Sandboxed',
			'meta'  => array(
				'title' => 'Sandboxing via ' . Constants::get_constant( 'JETPACK__SANDBOX_DOMAIN' ),
			),
		);

		$wp_admin_bar->add_menu( $node );
	}
}
