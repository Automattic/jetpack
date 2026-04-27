<?php
/**
 * HTTP-based plugin-load probe.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Runs a plugin's main file in a separate HTTP self-request and
 * returns the probe verdict as an associative array.
 */
class PCG_Load_Tester {

	const PROBE_TIMEOUT  = 15;
	const TOKEN_LIFETIME = 30;

	/**
	 * Run the probe against a plugin main file.
	 *
	 * Issues two probes — one against the front-end (`home_url('/')`) and
	 * one against an admin page so `admin_init` actually fires. The admin
	 * probe forwards the current admin's WordPress auth cookies so the
	 * loopback can clear `auth_redirect()`.
	 *
	 * The first non-ok verdict wins; if both come back `ok`, the admin
	 * probe's verdict (which carries the richer `did_admin_init`
	 * diagnostic) is returned.
	 *
	 * @param string $plugin_main Absolute path to the plugin's main PHP file.
	 * @return array{status:string,reason?:string,errno?:int,message?:string,file?:string,line?:int}
	 */
	public function test( $plugin_main ) {
		if ( '' === (string) $plugin_main || ! is_file( $plugin_main ) ) {
			return array(
				'status' => 'error',
				'reason' => 'Plugin main file not found for load probe.',
			);
		}

		$front_result = $this->probe_request( $plugin_main, home_url( '/' ), false );
		if ( ! $this->is_ok( $front_result ) ) {
			return $front_result;
		}

		return $this->probe_request( $plugin_main, admin_url( 'index.php' ), true );
	}

	/**
	 * Whether a probe verdict is a clean "ok".
	 *
	 * @param array $result Probe verdict.
	 * @return bool
	 */
	protected function is_ok( $result ) {
		return is_array( $result ) && isset( $result['status'] ) && 'ok' === $result['status'];
	}

	/**
	 * Issue a single loopback probe request.
	 *
	 * @param string $plugin_main Absolute path to the plugin's main PHP file.
	 * @param string $base_url    Base URL to probe (front-end or admin).
	 * @param bool   $is_admin    True for the admin probe — adds the
	 *                            `pcg_admin=1` flag so the endpoint defers
	 *                            its verdict to `admin_init`, and forwards
	 *                            the current admin's auth cookies.
	 * @return array{status:string,reason?:string,errno?:int,message?:string,file?:string,line?:int}
	 */
	protected function probe_request( $plugin_main, $base_url, $is_admin ) {
		$token = wp_generate_password( 32, false );
		set_transient(
			$this->transient_key( $token ),
			array(
				'plugin_main' => $plugin_main,
				'user_id'     => get_current_user_id(),
			),
			self::TOKEN_LIFETIME
		);

		$query = array(
			'pcg_probe' => '1',
			'token'     => $token,
		);
		if ( $is_admin ) {
			$query['pcg_admin'] = '1';
		}
		$url = add_query_arg( $query, $base_url );

		$args = array(
			'timeout'     => self::PROBE_TIMEOUT,
			'blocking'    => true,
			// Skip redirect chasing so a sneaky 301 doesn't swallow a probe result.
			'redirection' => 0,
		);
		if ( $is_admin ) {
			$cookies = $this->collect_auth_cookies();
			if ( ! empty( $cookies ) ) {
				$args['cookies'] = $cookies;
			}
		}

		$response = wp_remote_get( $url, $args );

		delete_transient( $this->transient_key( $token ) );

		if ( is_wp_error( $response ) ) {
			return array(
				'status' => 'error',
				'reason' => sprintf( 'Probe request failed: %s', $response->get_error_message() ),
			);
		}

		$code = (int) wp_remote_retrieve_response_code( $response );
		$body = (string) wp_remote_retrieve_body( $response );

		$decoded = json_decode( $body, true );
		if ( is_array( $decoded ) && isset( $decoded['status'] ) ) {
			return $decoded;
		}

		// Admin probe bounced to login (no/expired cookie) — don't block on this signal.
		if ( $is_admin && ( 301 === $code || 302 === $code ) ) {
			return array(
				'status' => 'ok',
				'reason' => 'Admin probe redirected; treating as inconclusive ok.',
			);
		}

		if ( 500 === $code ) {
			return array(
				'status'  => 'fatal',
				'message' => 'Probe request returned HTTP 500 without a JSON verdict; the plugin likely fatals during load.',
				'file'    => basename( $plugin_main ),
				'line'    => 0,
			);
		}

		return array(
			'status' => 'error',
			'reason' => sprintf( 'Probe returned HTTP %d without a verdict payload.', $code ),
		);
	}

	/**
	 * Collect the WordPress auth cookies from the current request so the
	 * admin loopback probe can authenticate as the same admin who clicked
	 * Activate. Without these the probe would 302 to wp-login.php.
	 *
	 * @return WP_Http_Cookie[]
	 */
	protected function collect_auth_cookies() {
		$cookies = array();
		if ( empty( $_COOKIE ) || ! is_array( $_COOKIE ) ) {
			return $cookies;
		}
		foreach ( $_COOKIE as $name => $value ) {
			if ( ! is_string( $name ) || ! is_string( $value ) ) {
				continue;
			}
			if ( 0 !== strpos( $name, 'wordpress_' ) && 0 !== strpos( $name, 'wp-' ) ) {
				continue;
			}
			$cookies[] = new WP_Http_Cookie(
				array(
					'name'  => $name,
					'value' => wp_unslash( $value ),
				)
			);
		}
		return $cookies;
	}

	/**
	 * Transient key for a probe token. Shared with the endpoint.
	 *
	 * @param string $token Random probe token.
	 * @return string
	 */
	public static function transient_key( $token ) {
		return 'pcg_probe_' . md5( (string) $token );
	}
}
