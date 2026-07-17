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

	const PROBE_TIMEOUT = 15;

	/**
	 * Probe-token transient TTL, in seconds.
	 *
	 * Must outlast the *whole* probe, not a single hop: each followed
	 * redirect (`redirects => 5`) is a fresh request that re-reads the same
	 * transient, so the worst case is `PROBE_TIMEOUT` × several hops. The
	 * old 30s was shorter than that and a slow redirect chain (e.g. the
	 * force_ssl_admin http→https bounce on a sluggish site) could outlive
	 * the token, making the endpoint bail with "Invalid or expired probe
	 * token." `test()` deletes the transient in its `finally` block anyway,
	 * so a generous TTL never leaks.
	 */
	const TOKEN_LIFETIME = 300;

	/**
	 * Engine-fatal mask used by the probe shutdown classifier. Anything
	 * outside this mask (notice, warning, deprecation, or `error_get_last`
	 * returning null after a clean `exit`) is treated as not-a-fatal.
	 *
	 * `E_RECOVERABLE_ERROR` is included even though it's "catchable" by a
	 * custom `set_error_handler` — by the time PHP shutdown fires with
	 * `error_get_last()` still pointing at it, no handler caught it, so
	 * it terminated execution like any other fatal. The probe context
	 * doesn't install a recovery handler, so the only way this errno
	 * lands in `error_get_last()` here is the uncaught path.
	 */
	const SHUTDOWN_FATAL_MASK = E_ERROR | E_PARSE | E_CORE_ERROR | E_COMPILE_ERROR | E_USER_ERROR | E_RECOVERABLE_ERROR;

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
					// Match `wp_remote_get`'s default; covers http->https,
					// force_ssl_admin's scheme bounce, and locale redirects.
					// `build_same_host_cookie_hook` keeps admin auth from
					// leaking if the redirect points off-host.
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

		// Every surface that captured a fatal. An admin-only fatal still
		// crashes the site, so both must be confirmed. Front-end is the
		// canonical verdict when both block.
		$blocking = array();
		if ( $this->is_block( $front_result ) ) {
			$blocking['front'] = $front_result;
		}
		if ( $this->is_block( $admin_result ) ) {
			$blocking['admin'] = $admin_result;
		}

		if ( ! empty( $blocking ) ) {
			$verdict = $this->is_block( $front_result ) ? $front_result : $admin_result;

			// Confirm each blocking surface via WP's normal active-plugin
			// bootstrap; downgrade only when EVERY one comes back an explicit
			// clean `ok`. Anything else keeps the captured fatal (see
			// is_clean_confirmation). Update mode never confirms — fatals must
			// block so PCG_Rollback can fire.
			if ( self::MODE_ACTIVATION === $mode ) {
				$clean_confirmation = null;
				foreach ( array_keys( $blocking ) as $surface ) {
					$confirmation = $this->confirm_via_normal_load( $plugin_mains, $surface );
					if ( ! $this->is_clean_confirmation( $confirmation ) ) {
						$clean_confirmation = null;
						break;
					}
					$clean_confirmation = $confirmation;
				}
				if ( null !== $clean_confirmation ) {
					return $this->downgrade_after_confirmation( $verdict, $clean_confirmation );
				}
			}
			return $verdict;
		}

		// Neither probe blocked. Log if either verdict was a transport-level
		// error or a synthesized ok-inconclusive (HTTP 500, marker+non-JSON,
		// redirect-budget exhaustion) — those are the allow paths under the
		// "only block on captured fatal" policy, and the log is how we
		// measure how often we let an activation/update through despite a
		// suspicious signal.
		if ( $this->is_anomalous_allow( $front_result ) || $this->is_anomalous_allow( $admin_result ) ) {
			$this->log_probe_anomaly( $mode, $plugin_mains, $front_result, $admin_result );
		}

		return $front_result;
	}

	/**
	 * Fire a confirmation probe for a single surface with `pcg_confirm=1`.
	 * Returns null on transport failure — the caller keeps the original
	 * verdict on uncertainty.
	 *
	 * @param string[] $plugin_mains Absolute paths to plugin main PHP files.
	 * @param string   $surface      Which surface to re-probe: `front` or `admin`.
	 * @return array|null Parsed verdict, or null on transport failure.
	 */
	protected function confirm_via_normal_load( array $plugin_mains, $surface = 'front' ) {
		$is_admin = 'admin' === $surface;
		$base_url = $is_admin ? admin_url( 'index.php' ) : home_url( '/' );
		$probe    = $this->prepare_probe( $plugin_mains, $base_url, $is_admin, self::MODE_ACTIVATION, true );

		try {
			$responses = \WpOrg\Requests\Requests::request_multiple(
				array( $surface => $probe['request'] ),
				array(
					'timeout'   => self::PROBE_TIMEOUT,
					'redirects' => 5,
				)
			);
		} catch ( \Throwable $t ) {
			return null;
		} finally {
			delete_transient( self::transient_key( $probe['token'] ) );
		}

		return $this->parse_response( $responses[ $surface ] );
	}

	/**
	 * Whether a confirmation-probe verdict is an explicit clean load. Only
	 * status=`ok` qualifies — the probe endpoint emits it from
	 * wp_loaded/admin_init once the candidate loaded via the real
	 * active_plugins path and the whole bootstrap completed without a
	 * captured fatal. This is the sole result that downgrades a captured
	 * fatal: a fatal during the active_plugins-driven load dies in
	 * wp-settings.php before the endpoint registers its shutdown handler,
	 * so it can never return as status=`fatal` — it comes back as a 500 /
	 * `ok-inconclusive` / transport error (null), none of which we trust
	 * to override a genuine captured fatal.
	 *
	 * @param array|null $confirmation Confirmation verdict, or null on transport failure.
	 * @return bool
	 */
	protected function is_clean_confirmation( $confirmation ) {
		return is_array( $confirmation ) && 'ok' === (string) ( $confirmation['status'] ?? '' );
	}

	/**
	 * Downgraded verdict after a clean confirmation. Preserves the
	 * original captured-fatal context for log attribution.
	 *
	 * @param array $verdict      Original captured-fatal verdict.
	 * @param array $confirmation Clean confirmation-probe verdict.
	 * @return array
	 */
	protected function downgrade_after_confirmation( array $verdict, array $confirmation ) {
		pcg_log_event(
			'Probe fatal downgraded after confirmation',
			array(
				'plugin'  => isset( $verdict['plugin'] ) ? $this->relative_basenames( array( (string) $verdict['plugin'] ) )[0] : '',
				'status'  => (string) ( $verdict['status'] ?? '' ),
				'reason'  => (string) ( $verdict['message'] ?? $verdict['reason'] ?? '' ),
				'file'    => isset( $verdict['file'] ) ? basename( (string) $verdict['file'] ) : '',
				'confirm' => (string) ( $confirmation['status'] ?? '' ),
			)
		);
		$out = array(
			'status'  => 'ok-inconclusive',
			'reason'  => 'Captured fatal did not reproduce when the candidate was loaded via WP\'s normal active-plugin bootstrap; downgrading to allow.',
			'message' => (string) ( $verdict['message'] ?? '' ),
			'file'    => (string) ( $verdict['file'] ?? '' ),
		);
		if ( '' !== (string) ( $verdict['plugin'] ?? '' ) ) {
			$out['plugin'] = (string) $verdict['plugin'];
		}
		return $out;
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
	 * Whether a verdict is one we chose to allow despite a suspicious
	 * signal — either a transport `error` or a synthesized
	 * `ok-inconclusive` from `parse_response` (HTTP 500, marker+non-JSON,
	 * redirect-budget exhaustion, dropped probe query on redirect). We log
	 * these so the dashboard can show the rate at which we're letting
	 * activations through without a captured verdict — the cost of the
	 * "only block on captured fatal" policy.
	 *
	 * @param array $result Probe verdict.
	 * @return bool
	 */
	protected function is_anomalous_allow( $result ) {
		if ( $this->is_error( $result ) ) {
			return true;
		}
		$status = is_array( $result ) ? (string) ( $result['status'] ?? '' ) : '';
		// `ok-shutdown` means the probe reached PHP shutdown without a
		// wp_loaded/admin_init verdict — bootstrap died silently or a
		// plugin called `exit` during init. Not a captured fatal, so we
		// allow under the policy, but the rate is worth logging because
		// it's the new replacement for the old "marker present, no
		// JSON body" class.
		return 'ok-inconclusive' === $status || 'ok-shutdown' === $status;
	}

	/**
	 * Log a probe anomaly (transport error or synthesized
	 * ok-inconclusive) to logstash whenever either probe came back as
	 * such. Lets us measure how often we silently allow despite a
	 * suspicious signal — the observability backstop for the
	 * "only block on captured fatal" policy.
	 *
	 * @param string   $mode         Probe mode constant.
	 * @param string[] $plugin_mains Absolute paths to plugin main PHP files.
	 * @param array    $front_result Front-end probe verdict.
	 * @param array    $admin_result Admin probe verdict.
	 * @return void
	 */
	protected function log_probe_anomaly( $mode, array $plugin_mains, array $front_result, array $admin_result ) {
		pcg_log_event(
			'Probe anomaly allowed',
			array(
				'mode'    => $mode,
				'plugins' => $this->relative_basenames( $plugin_mains ),
				'front'   => $this->probe_anomaly_label( $front_result ),
				'admin'   => $this->probe_anomaly_label( $admin_result ),
			)
		);
	}

	/**
	 * One-line label for an anomalous-allow verdict — `<status>: <reason>`.
	 * Lets a single log entry name both the class of allow (error vs
	 * ok-inconclusive) and the underlying cause (HTTP 500, redirect
	 * cycle, intercepted loopback, etc.). Reasons are author-written
	 * sentences from `parse_response` and `pcg_log_event` already caps
	 * payload size, so we don't truncate here.
	 *
	 * @param array $result Probe verdict.
	 * @return string
	 */
	protected function probe_anomaly_label( array $result ) {
		if ( ! $this->is_anomalous_allow( $result ) ) {
			return '';
		}
		$status = (string) ( $result['status'] ?? '' );
		$reason = (string) ( $result['reason'] ?? $result['message'] ?? '' );
		return '' !== $reason ? $status . ': ' . $reason : $status;
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
	 * Build the transient payload that the probe endpoint will consume.
	 *
	 * Exposed for unit tests so they can assert the stash shape without
	 * needing a live HTTP loopback. Not part of the public API.
	 *
	 * @internal
	 * @param string[] $plugin_mains Absolute paths to plugin main PHP files.
	 * @param string   $mode         Probe mode constant.
	 * @param bool     $is_confirm   Whether this payload is for a confirmation probe.
	 * @return array{plugins:string[],mode:string,confirm:bool}
	 */
	public static function build_probe_payload( array $plugin_mains, $mode = self::MODE_ACTIVATION, $is_confirm = false ) {
		return array(
			'plugins' => array_values( array_map( static fn( $p ) => (string) $p, $plugin_mains ) ),
			'mode'    => self::MODE_UPDATE === $mode ? self::MODE_UPDATE : self::MODE_ACTIVATION,
			'confirm' => (bool) $is_confirm,
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
	 * @param bool     $is_confirm   Adds `pcg_confirm=1` so the early bootstrap injects candidates into active_plugins.
	 * @return array{token:string,request:array}
	 */
	protected function prepare_probe( array $plugin_mains, $base_url, $is_admin, $mode = self::MODE_ACTIVATION, $is_confirm = false ) {
		$token = wp_generate_password( 32, false );
		set_transient( self::transient_key( $token ), self::build_probe_payload( $plugin_mains, $mode, $is_confirm ), self::TOKEN_LIFETIME );

		$query   = array(
			'pcg_probe' => '1',
			'token'     => $token,
		);
		$headers = array();
		$options = array();
		if ( $is_confirm ) {
			$query['pcg_confirm'] = '1';
		}
		if ( $is_admin ) {
			$query['pcg_admin'] = '1';
			$cookie_header      = $this->collect_auth_cookie_header();
			if ( '' !== $cookie_header ) {
				$headers['Cookie'] = $cookie_header;
				$options['hooks']  = $this->build_same_host_cookie_hook( $base_url );
			}
		}

		return array(
			'token'   => $token,
			'request' => array(
				'url'     => add_query_arg( $query, $base_url ),
				'type'    => 'GET',
				'headers' => $headers,
				'options' => $options,
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
			// Bootstrap was healthy enough to issue several redirects in
			// a row, so treat redirect-budget exhaustion as inconclusive
			// rather than an error.
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

		// 3xx that Requests refused to follow (cross-scheme downgrade,
		// malformed Location). Treat as ok — bootstrap completed enough
		// to emit one.
		if ( $code >= 300 && $code < 400 ) {
			return array(
				'status' => 'ok-inconclusive',
				'reason' => sprintf( 'Probe redirected (HTTP %d); treating as inconclusive ok.', $code ),
			);
		}

		// Policy: only block on a captured fatal (status=fatal from the
		// shutdown handler's classify_shutdown, or status=throwable from
		// the require-time catch). HTTP 500 and "marker present, no JSON
		// verdict" are guesses at a fatal from outside the request — on
		// real traffic, each is dominated by upstream LBs, edge proxies,
		// intercepting plugins, engine death (segfault/OOM/FastCGI
		// termination), or a mid-stream connection drop. Treat as
		// `ok-inconclusive` (allow + log) so the user can proceed and
		// `log_probe_anomaly` records the rate.
		if ( 500 === $code ) {
			return array(
				'status' => 'ok-inconclusive',
				'reason' => 'Probe loopback returned HTTP 500 without a JSON verdict; no captured fatal, so treating as inconclusive ok. Could be an upstream LB, edge proxy, intercepting plugin, or a real engine death we can\'t verify.',
			);
		}

		if ( $code >= 200 && $code < 300 ) {
			// Marker present + non-JSON 200: the probe endpoint ran but no
			// verdict was written. With the shutdown handler always emitting
			// a verdict, this branch is reachable mainly when the engine
			// itself died (segfault, OOM kill, FastCGI process terminated)
			// or a mid-stream connection drop / re-entry-guarded partial
			// body. None is a captured fatal we can confidently attribute
			// to a plugin, so allow + log per the policy above.
			if ( $this->probe_endpoint_was_reached( $response ) ) {
				return array(
					'status' => 'ok-inconclusive',
					'reason' => sprintf(
						'Probe endpoint ran but no JSON verdict was emitted (HTTP %d). No captured PHP fatal, so treating as inconclusive ok. Most likely engine death (segfault / OOM kill / process terminated) or a connection drop mid-response.',
						$code
					),
				);
			}
			// No marker, but a redirect was followed: the destination dropped
			// the probe query and landed on a clean page. Bootstrap rendered
			// fine, so don't block.
			if ( $redirect_count > 0 ) {
				return array(
					'status' => 'ok-inconclusive',
					'reason' => sprintf( 'Probe followed %d redirect(s) but destination dropped the probe query; treating as inconclusive ok.', $redirect_count ),
				);
			}
			// No marker and no redirect: the loopback never reached our
			// endpoint — a full-page/edge cache, a security plugin, or a
			// maintenance page answered with a 200. We learned nothing about
			// the plugin, so this is an inconclusive transport `error` (logged,
			// non-blocking) — NOT a fatal. Blocking here would reject a
			// perfectly healthy plugin.
			return array(
				'status' => 'error',
				'reason' => sprintf( 'Probe loopback returned HTTP %d without reaching the PCG endpoint (cache or intercepting plugin).', $code ),
			);
		}

		return array(
			'status' => 'error',
			'reason' => sprintf( 'Probe returned HTTP %d without a verdict payload.', $code ),
		);
	}

	/**
	 * Whether the probe endpoint actually executed for this response.
	 *
	 * `probe-endpoint.php` sends `X-PCG-Probe: 1` the instant it recognises a
	 * probe request. Its absence means the loopback was answered by something
	 * else (cache layer, security plugin, maintenance page) before our code
	 * ran. Header lookup is case-insensitive via `Requests`' Headers object.
	 *
	 * @param \WpOrg\Requests\Response $response Probe response.
	 * @return bool
	 */
	protected function probe_endpoint_was_reached( $response ) {
		return isset( $response->headers ) && isset( $response->headers['x-pcg-probe'] );
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
	 * Build a Hooks instance that strips the forwarded `Cookie:` header on
	 * any redirect that leaves the original origin: off-host, or an
	 * https→http scheme downgrade on the same host. Defends against
	 * leaking admin auth cookies (we forward `Cookie:` manually, so
	 * Requests won't enforce browser `Secure` semantics for us).
	 * Relative redirects inherit the original origin and pass through.
	 *
	 * @param string $original_url Initial probe URL whose origin is the trust boundary.
	 * @return \WpOrg\Requests\Hooks
	 */
	protected function build_same_host_cookie_hook( $original_url ) {
		$original        = wp_parse_url( $original_url );
		$original_host   = isset( $original['host'] ) ? strtolower( (string) $original['host'] ) : '';
		$original_scheme = isset( $original['scheme'] ) ? strtolower( (string) $original['scheme'] ) : '';

		$hooks = new \WpOrg\Requests\Hooks();
		$hooks->register(
			'requests.before_redirect',
			static function ( &$location, &$req_headers, &$req_data, &$options, $return_value ) use ( $original_host, $original_scheme ) {
				unset( $req_data, $options, $return_value );
				if ( ! is_array( $req_headers ) ) {
					return;
				}
				$next             = wp_parse_url( (string) $location );
				$next_host        = isset( $next['host'] ) ? strtolower( (string) $next['host'] ) : $original_host;
				$next_scheme      = isset( $next['scheme'] ) ? strtolower( (string) $next['scheme'] ) : $original_scheme;
				$same_host        = '' !== $next_host && $next_host === $original_host;
				$scheme_downgrade = 'https' === $original_scheme && 'https' !== $next_scheme;
				if ( ! $same_host || $scheme_downgrade ) {
					foreach ( array_keys( $req_headers ) as $key ) {
						if ( 0 === strcasecmp( (string) $key, 'Cookie' ) ) {
							unset( $req_headers[ $key ] );
						}
					}
				}
			}
		);
		return $hooks;
	}

	/**
	 * Classify a PHP shutdown into a probe verdict. Returns `fatal` only
	 * for the engine-fatal error mask; anything else becomes
	 * `ok-shutdown`, signalling that the bootstrap reached PHP shutdown
	 * without a captured fatal but didn't reach the wp_loaded/admin_init
	 * verdict point (typical of a plugin calling `exit` during init).
	 *
	 * Pure helper so the probe endpoint's shutdown handler can be
	 * exercised without firing PHP shutdown in tests.
	 *
	 * @param array|null $error Result of `error_get_last()`.
	 * @return array Probe verdict.
	 */
	public static function classify_shutdown( $error ) {
		if ( is_array( $error ) && 0 !== ( ( (int) ( $error['type'] ?? 0 ) ) & self::SHUTDOWN_FATAL_MASK ) ) {
			return array(
				'status'  => 'fatal',
				'errno'   => (int) $error['type'],
				'message' => (string) ( $error['message'] ?? '' ),
				'file'    => (string) ( $error['file'] ?? '' ),
				'line'    => (int) ( $error['line'] ?? 0 ),
			);
		}
		return array(
			'status' => 'ok-shutdown',
			'reason' => 'Probe reached shutdown without a captured fatal; bootstrap exited before wp_loaded/admin_init (likely a plugin-initiated exit/redirect during init).',
		);
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
