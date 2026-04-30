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
	 * Probe mode: files are currently inactive and the endpoint must
	 * `require_once` each one in order to exercise their load paths.
	 * Used by the activation guard.
	 */
	const MODE_ACTIVATION = 'activation';

	/**
	 * Probe mode: files are already loaded by WP's normal bootstrap (they
	 * were active plugins before the just-completed update). The endpoint
	 * must NOT re-`require` them — doing so would fatal with "Cannot
	 * redeclare class/function" — and instead just verifies that the
	 * bootstrap completed cleanly with the new code.
	 */
	const MODE_UPDATE = 'update';

	/**
	 * Run the probe against a set of plugin main files in a single
	 * loopback request pair.
	 *
	 * In MODE_ACTIVATION the probe endpoint `require_once`s each plugin in
	 * order under one `WP_SANDBOX_SCRAPING` request, so the batch resolves
	 * in one round-trip regardless of how many plugins are passed in. As a
	 * side effect this also catches conflicts that only fire when two
	 * plugins are loaded together (duplicate class, shared global, etc.) —
	 * which a per-plugin probe model could never see.
	 *
	 * In MODE_UPDATE the endpoint skips the `require_once` and just
	 * observes whether the surrounding WP bootstrap (which already loaded
	 * the freshly-installed plugin files) completes cleanly.
	 *
	 * Fires two loopback requests in parallel: one against `home_url('/')`
	 * (front-end) and one against `admin_url('index.php')` so `admin_init`
	 * fires. The admin probe forwards the current admin's WP auth cookies
	 * so the loopback can clear `auth_redirect()`. A captured fatal from
	 * either probe wins; otherwise the front-end verdict is returned. On a
	 * fatal/throwable the verdict's `plugin` key (when present) names the
	 * specific plugin main file the endpoint was loading at the time.
	 *
	 * @param string[] $plugin_mains Absolute paths to plugin main PHP files.
	 * @param string   $mode         Probe mode: self::MODE_ACTIVATION (default) or
	 *                               self::MODE_UPDATE. See class constants.
	 * @return array{status:string,reason?:string,errno?:int,class?:string,message?:string,file?:string,line?:int,plugin?:string}
	 */
	public function test( array $plugin_mains, $mode = self::MODE_ACTIVATION ) {
		$plugin_mains = array_values(
			array_filter(
				array_map( static fn( $p ) => (string) $p, $plugin_mains ),
				static fn( $p ) => '' !== $p && is_file( $p )
			)
		);
		if ( empty( $plugin_mains ) ) {
			return array(
				'status' => 'error',
				'reason' => 'No probable plugin main files supplied.',
			);
		}

		$front = $this->prepare_probe( $plugin_mains, home_url( '/' ), false, $mode );
		$admin = $this->prepare_probe( $plugin_mains, admin_url( 'index.php' ), true, $mode );

		try {
			$responses = \WpOrg\Requests\Requests::request_multiple(
				array(
					'front' => $front['request'],
					'admin' => $admin['request'],
				),
				array(
					'timeout'   => self::PROBE_TIMEOUT,
					'redirects' => 0,
				)
			);
		} catch ( \Throwable $t ) {
			return array(
				'status' => 'error',
				'reason' => sprintf( 'Probe request failed: %s', $t->getMessage() ),
			);
		} finally {
			delete_transient( self::transient_key( $front['token'] ) );
			delete_transient( self::transient_key( $admin['token'] ) );
		}

		$front_result = $this->parse_response( $responses['front'], false );
		$admin_result = $this->parse_response( $responses['admin'], true );

		// fatal/throwable wins; an inconclusive `error` from one probe must
		// not shadow a real fatal from the other. Front-end is the canonical
		// "site works" signal when neither probe captured a fatal.
		if ( $this->is_block( $front_result ) ) {
			return $front_result;
		}
		if ( $this->is_block( $admin_result ) ) {
			return $admin_result;
		}
		return $front_result;
	}

	/**
	 * Whether a verdict is a captured fatal that should block the activation.
	 *
	 * @param array $result Probe verdict.
	 * @return bool
	 */
	protected function is_block( $result ) {
		$status = is_array( $result ) ? (string) ( $result['status'] ?? '' ) : '';
		return 'fatal' === $status || 'throwable' === $status;
	}

	/**
	 * Build the transient payload that the probe endpoint will consume.
	 *
	 * Exposed for unit tests so they can assert the stash shape without
	 * needing a live HTTP loopback. Not part of the public API.
	 *
	 * @internal
	 * @param string[] $plugin_mains Absolute paths to plugin main PHP files.
	 * @param string   $mode         Probe mode constant.
	 * @return array{plugins:string[],mode:string}
	 */
	public static function build_probe_payload( array $plugin_mains, $mode = self::MODE_ACTIVATION ) {
		return array(
			'plugins' => array_values( array_map( static fn( $p ) => (string) $p, $plugin_mains ) ),
			'mode'    => self::MODE_UPDATE === $mode ? self::MODE_UPDATE : self::MODE_ACTIVATION,
		);
	}

	/**
	 * Stash a probe transient (the list of plugin main files to require
	 * and the probe mode) and build the request descriptor for
	 * `Requests::request_multiple`.
	 *
	 * @param string[] $plugin_mains Absolute paths to plugin main PHP files.
	 * @param string   $base_url     Base URL to probe (front-end or admin).
	 * @param bool     $is_admin     Adds `pcg_admin=1` and forwards auth cookies.
	 * @param string   $mode         Probe mode constant.
	 * @return array{token:string,request:array}
	 */
	protected function prepare_probe( array $plugin_mains, $base_url, $is_admin, $mode = self::MODE_ACTIVATION ) {
		$token = wp_generate_password( 32, false );
		set_transient( self::transient_key( $token ), self::build_probe_payload( $plugin_mains, $mode ), self::TOKEN_LIFETIME );

		$query   = array(
			'pcg_probe' => '1',
			'token'     => $token,
		);
		$headers = array();
		if ( $is_admin ) {
			$query['pcg_admin'] = '1';
			$cookie_header      = $this->collect_auth_cookie_header();
			if ( '' !== $cookie_header ) {
				$headers['Cookie'] = $cookie_header;
			}
		}

		return array(
			'token'   => $token,
			'request' => array(
				'url'     => add_query_arg( $query, $base_url ),
				'type'    => 'GET',
				'headers' => $headers,
			),
		);
	}

	/**
	 * Translate a `Requests::request_multiple` response into a probe verdict.
	 *
	 * @param mixed $response A `WpOrg\Requests\Response`, or an exception
	 *                        thrown for that single request.
	 * @param bool  $is_admin True when this was the admin probe.
	 * @return array{status:string,reason?:string,errno?:int,class?:string,message?:string,file?:string,line?:int,plugin?:string}
	 */
	protected function parse_response( $response, $is_admin ) {
		if ( $response instanceof \Throwable ) {
			return array(
				'status' => 'error',
				'reason' => sprintf( 'Probe request failed: %s', $response->getMessage() ),
			);
		}

		$code = (int) ( $response->status_code ?? 0 );
		$body = (string) ( $response->body ?? '' );

		$decoded = json_decode( $body, true );
		if ( is_array( $decoded ) && isset( $decoded['status'] ) ) {
			return $decoded;
		}

		// Admin probe bounced to login (no/expired cookie). Distinct status so
		// we can measure how often it fires; treated as ok by callers.
		if ( $is_admin && ( 301 === $code || 302 === $code ) ) {
			return array(
				'status' => 'ok-inconclusive',
				'reason' => 'Admin probe redirected; treating as inconclusive ok.',
			);
		}

		if ( 500 === $code ) {
			return array(
				'status'  => 'fatal',
				'message' => 'Probe request returned HTTP 500 without a JSON verdict; the plugin likely fatals during load.',
			);
		}

		// Probe endpoint always emits JSON; a 2xx without one means the
		// bootstrap was terminated mid-flight (exit/die during load/init/admin_init).
		// Block, since the same termination would affect matching future requests.
		if ( $code >= 200 && $code < 300 ) {
			return array(
				'status'  => 'fatal',
				'message' => sprintf(
					'Probe completed without a verdict (HTTP %d, non-JSON body). A plugin in the batch may have terminated the request during load, init, or admin_init.',
					$code
				),
			);
		}

		return array(
			'status' => 'error',
			'reason' => sprintf( 'Probe returned HTTP %d without a verdict payload.', $code ),
		);
	}

	/**
	 * `Cookie:` header from the current request's WP auth cookies, so the
	 * admin loopback authenticates as the same user. Empty if none found.
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
			if ( ! str_starts_with( $name, 'wordpress_' ) && ! str_starts_with( $name, 'wp-' ) ) {
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
