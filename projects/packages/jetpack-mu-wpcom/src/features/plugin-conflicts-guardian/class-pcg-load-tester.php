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
	 * Fires two loopback requests in parallel via the WP HTTP layer's
	 * multi-request API: one against the front-end (`home_url('/')`) and
	 * one against an admin page (`admin_url('index.php')`) so
	 * `admin_init` actually fires. The admin probe forwards the current
	 * admin's WordPress auth cookies so the loopback can clear
	 * `auth_redirect()`.
	 *
	 * Front-end fatal wins; otherwise the admin verdict is returned.
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

		$front = $this->prepare_probe( $plugin_main, home_url( '/' ), false );
		$admin = $this->prepare_probe( $plugin_main, admin_url( 'index.php' ), true );

		$requests = array(
			'front' => $front['request'],
			'admin' => $admin['request'],
		);

		$options = array(
			'timeout'   => self::PROBE_TIMEOUT,
			'redirects' => 0,
		);

		try {
			$responses = \WpOrg\Requests\Requests::request_multiple( $requests, $options );
		} catch ( \Throwable $t ) {
			delete_transient( self::transient_key( $front['token'] ) );
			delete_transient( self::transient_key( $admin['token'] ) );
			return array(
				'status' => 'error',
				'reason' => sprintf( 'Probe request failed: %s', $t->getMessage() ),
			);
		}

		delete_transient( self::transient_key( $front['token'] ) );
		delete_transient( self::transient_key( $admin['token'] ) );

		$front_result = $this->parse_response( $responses['front'], $plugin_main, false );
		if ( ! $this->is_ok( $front_result ) ) {
			return $front_result;
		}

		return $this->parse_response( $responses['admin'], $plugin_main, true );
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
	 * Stash a probe transient and build the request descriptor for
	 * `Requests::request_multiple`.
	 *
	 * @param string $plugin_main Absolute path to the plugin's main PHP file.
	 * @param string $base_url    Base URL to probe (front-end or admin).
	 * @param bool   $is_admin    True for the admin probe — adds
	 *                            `pcg_admin=1` so the endpoint defers its
	 *                            verdict to `admin_init`, and forwards the
	 *                            current admin's auth cookies.
	 * @return array{token:string,request:array}
	 */
	protected function prepare_probe( $plugin_main, $base_url, $is_admin ) {
		$token = wp_generate_password( 32, false );
		set_transient(
			self::transient_key( $token ),
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

		$headers = array();
		if ( $is_admin ) {
			$cookie_header = $this->collect_auth_cookie_header();
			if ( '' !== $cookie_header ) {
				$headers['Cookie'] = $cookie_header;
			}
		}

		return array(
			'token'   => $token,
			'request' => array(
				'url'     => $url,
				'type'    => 'GET',
				'headers' => $headers,
			),
		);
	}

	/**
	 * Translate a `Requests::request_multiple` response into a probe verdict.
	 *
	 * @param mixed  $response    Either a `WpOrg\Requests\Response` or an
	 *                            exception thrown for that single request.
	 * @param string $plugin_main Plugin main file (for fallback diagnostics).
	 * @param bool   $is_admin    True when this was the admin probe.
	 * @return array{status:string,reason?:string,errno?:int,message?:string,file?:string,line?:int}
	 */
	protected function parse_response( $response, $plugin_main, $is_admin ) {
		if ( $response instanceof \Throwable ) {
			return array(
				'status' => 'error',
				'reason' => sprintf( 'Probe request failed: %s', $response->getMessage() ),
			);
		}

		$code = isset( $response->status_code ) ? (int) $response->status_code : 0;
		$body = isset( $response->body ) ? (string) $response->body : '';

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
	 * Build a `Cookie:` header from the current request's WP auth cookies
	 * so the admin loopback authenticates as the same admin who clicked
	 * Activate. Without these the probe would 302 to wp-login.php.
	 *
	 * @return string
	 */
	protected function collect_auth_cookie_header() {
		if ( empty( $_COOKIE ) || ! is_array( $_COOKIE ) ) {
			return '';
		}
		$pairs = array();
		foreach ( $_COOKIE as $name => $value ) {
			if ( ! is_string( $name ) || ! is_string( $value ) ) {
				continue;
			}
			if ( 0 !== strpos( $name, 'wordpress_' ) && 0 !== strpos( $name, 'wp-' ) ) {
				continue;
			}
			$pairs[] = $name . '=' . wp_unslash( $value );
		}
		return implode( '; ', $pairs );
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
