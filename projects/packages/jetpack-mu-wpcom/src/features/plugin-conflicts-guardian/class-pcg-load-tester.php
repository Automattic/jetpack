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

	/** Activation guard: plugins are inactive; endpoint require_once's each. */
	const MODE_ACTIVATION = 'activation';

	/**
	 * Post-update healthcheck: plugins are already loaded by WP's bootstrap;
	 * endpoint skips require_once (would fatal with "Cannot redeclare").
	 */
	const MODE_UPDATE = 'update';

	/**
	 * Probe a batch of plugin main files in one loopback request pair.
	 *
	 * Fires front-end + admin probes in parallel; front-end auth cookies are
	 * forwarded so admin_init can fire. Fatal from either wins; otherwise
	 * front-end's verdict. On fatal/throwable, the verdict's `plugin` key
	 * names the file the endpoint was loading at the time.
	 *
	 * @param string[] $plugin_mains Absolute paths to plugin main PHP files.
	 * @param string   $mode         self::MODE_ACTIVATION or self::MODE_UPDATE.
	 * @return array{status:string,reason?:string,errno?:int,class?:string,message?:string,file?:string,line?:int,plugin?:string}
	 */
	public function test( array $plugin_mains, $mode = self::MODE_ACTIVATION ) {
		$plugin_mains = array_values(
			array_filter(
				array_map( static fn( $p ) => (string) $p, $plugin_mains ),
				static fn( $p ) => '' !== $p && is_file( $p ) && is_readable( $p )
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
					// Follow up to 5 redirects (matching `wp_remote_get`'s
					// default) so canonical http->https / trailing-slash
					// / non-www->www on the front-end probe and
					// force_ssl_admin's http->https bounce on the admin
					// probe both reach a real verdict, with headroom for
					// multilingual plugins layering a locale redirect on
					// top. WP emits full-URL Location headers from
					// `home_url`/`set_url_scheme` so `pcg_probe`/`token`
					// survives, and Requests re-sends the forwarded
					// `Cookie:` header on the followed request so the
					// admin loopback still authenticates after the
					// scheme bounce.
					'redirects' => 5,
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

		$front_result = $this->parse_response( $responses['front'] );
		$admin_result = $this->parse_response( $responses['admin'] );

		// Log transport-level errors (most often timeouts at PROBE_TIMEOUT)
		// so we can see how often they fire before deciding whether to
		// scale the timeout with batch size.
		if ( $this->is_error( $front_result ) || $this->is_error( $admin_result ) ) {
			$this->log_probe_error( $mode, $plugin_mains, $front_result, $admin_result );
		}

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
	 * Whether a verdict is a transport-level error (timeout, connection
	 * failure, non-JSON body). Distinct from `is_block` — errors are
	 * inconclusive and don't block activation, but are worth logging.
	 *
	 * @param array $result Probe verdict.
	 * @return bool
	 */
	protected function is_error( $result ) {
		$status = is_array( $result ) ? (string) ( $result['status'] ?? '' ) : '';
		return 'error' === $status;
	}

	/**
	 * Log a probe transport error to logstash whenever either probe came
	 * back as `error` (timeout at PROBE_TIMEOUT, connection failure,
	 * non-JSON body). Lets us measure timeout frequency vs. batch size
	 * before deciding whether to scale `PROBE_TIMEOUT` with N.
	 *
	 * @param string   $mode         Probe mode constant.
	 * @param string[] $plugin_mains Absolute paths to plugin main PHP files.
	 * @param array    $front_result Front-end probe verdict.
	 * @param array    $admin_result Admin probe verdict.
	 * @return void
	 */
	protected function log_probe_error( $mode, array $plugin_mains, array $front_result, array $admin_result ) {
		pcg_log_event(
			'Probe transport error',
			array(
				'mode'    => $mode,
				'plugins' => $this->relative_basenames( $plugin_mains ),
				'front'   => $this->probe_error_reason( $front_result ),
				'admin'   => $this->probe_error_reason( $admin_result ),
			)
		);
	}

	/**
	 * Strip `WP_PLUGIN_DIR/` from each absolute path so log entries carry
	 * the canonical plugin basename (e.g. `akismet/akismet.php`).
	 *
	 * @param string[] $plugin_mains Absolute paths to plugin main PHP files.
	 * @return string[]
	 */
	protected function relative_basenames( array $plugin_mains ) {
		$prefix = WP_PLUGIN_DIR . '/';
		$out    = array();
		foreach ( $plugin_mains as $path ) {
			$out[] = str_starts_with( (string) $path, $prefix )
				? substr( (string) $path, strlen( $prefix ) )
				: (string) $path;
		}
		return $out;
	}

	/**
	 * One-line reason from a probe verdict — `reason` if set, else
	 * `status`, else empty. Used for diagnostic logs.
	 *
	 * @param array $result Probe verdict.
	 * @return string
	 */
	protected function probe_error_reason( array $result ) {
		return (string) ( $result['reason'] ?? $result['status'] ?? '' );
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
	 * Stash a probe transient and build the `Requests::request_multiple`
	 * descriptor for one of the two parallel probes.
	 *
	 * @param string[] $plugin_mains Absolute paths to plugin main PHP files.
	 * @param string   $base_url     Front-end or admin base URL.
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
	 * @return array{status:string,reason?:string,errno?:int,class?:string,message?:string,file?:string,line?:int,plugin?:string}
	 */
	protected function parse_response( $response ) {
		if ( $response instanceof \Throwable ) {
			// Exceeded our redirect budget. The bootstrap was healthy
			// enough to issue several redirects in a row, so treat as
			// inconclusive rather than an error. Matched on the typed
			// exception code so a future upstream wording change doesn't
			// reclassify these.
			if ( $response instanceof \WpOrg\Requests\Exception && 'toomanyredirects' === $response->getType() ) {
				return array(
					'status' => 'ok-inconclusive',
					'reason' => 'Probe exceeded redirect budget; treating as inconclusive ok.',
				);
			}
			return array(
				'status' => 'error',
				'reason' => sprintf( 'Probe request failed: %s', $response->getMessage() ),
			);
		}

		$code           = (int) ( $response->status_code ?? 0 );
		$body           = (string) ( $response->body ?? '' );
		$redirect_count = (int) ( $response->redirects ?? 0 );

		$decoded = json_decode( $body, true );
		if ( is_array( $decoded ) && isset( $decoded['status'] ) ) {
			return $decoded;
		}

		// Unfollowed 3xx safety net (shouldn't happen now that we follow
		// up to 3, but keep for cases Requests refuses — cross-scheme
		// downgrade, malformed Location, etc.). Treated as ok by callers
		// since a redirect at this layer means the bootstrap completed
		// cleanly enough to issue one.
		if ( $code >= 300 && $code < 400 ) {
			return array(
				'status' => 'ok-inconclusive',
				'reason' => sprintf( 'Probe redirected (HTTP %d); treating as inconclusive ok.', $code ),
			);
		}

		if ( 500 === $code ) {
			return array(
				'status'  => 'fatal',
				'message' => 'Probe request returned HTTP 500 without a JSON verdict; the plugin likely fatals during load.',
			);
		}

		if ( $code >= 200 && $code < 300 ) {
			// We followed at least one redirect and the destination
			// dropped our probe query (no JSON verdict back). Bootstrap
			// was healthy enough to render the destination, so treat as
			// inconclusive rather than fatal.
			if ( $redirect_count > 0 ) {
				return array(
					'status' => 'ok-inconclusive',
					'reason' => sprintf( 'Probe followed %d redirect(s) but destination dropped the probe query; treating as inconclusive ok.', $redirect_count ),
				);
			}
			// Probe endpoint always emits JSON; a 2xx without one and no
			// redirect means the bootstrap was terminated mid-flight
			// (exit/die during load/init/admin_init). Block, since the
			// same termination would affect future requests.
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
