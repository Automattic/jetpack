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
	 * Microseconds to wait between the first probe attempt and a retry
	 * when the verdict looks like an Atomic multi-node propagation flake
	 * (file-not-found or autoload miss against the candidate plugin's own
	 * tree). Chosen as a balance between giving the shared filesystem
	 * time to catch up and not adding noticeable latency to real fatals.
	 */
	const PROPAGATION_RETRY_DELAY_US = 500000;

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

		$verdict = $this->send_probe_pair( $plugin_mains, $mode );

		// Multi-node propagation flake (Atomic): the loopback can land on a
		// container whose shared-filesystem view lags the admin node's, so
		// the candidate plugin's entry file loads but a sibling file under
		// its own directory is not yet visible. CLI activation works,
		// because CLI runs on the originating node. Retry once after a
		// short delay; if the second probe still reports the same flake we
		// can't distinguish lag from a genuine missing file, so downgrade
		// to ok-inconclusive (allow + log) per the customer-impact triage.
		if ( $this->is_propagation_flake( $verdict, $plugin_mains ) ) {
			clearstatcache( true );
			usleep( self::PROPAGATION_RETRY_DELAY_US );
			$retry = $this->send_probe_pair( $plugin_mains, $mode );
			if ( ! $this->is_propagation_flake( $retry, $plugin_mains ) ) {
				return $retry;
			}
			$this->log_propagation_flake_downgrade( $mode, $plugin_mains, $retry );
			$downgraded = array(
				'status'  => 'ok-inconclusive',
				'reason'  => 'Probe reported a file-not-found / autoload miss against the plugin\'s own directory on two attempts; treating as a multi-node propagation lag and allowing activation. CLI activation is unaffected.',
				'message' => (string) ( $retry['message'] ?? '' ),
				'file'    => (string) ( $retry['file'] ?? '' ),
			);
			if ( '' !== (string) ( $retry['plugin'] ?? '' ) ) {
				// Preserve the throwable-catch attribution from the
				// probe endpoint so downstream consumers (and future
				// `ok-inconclusive` readers) can still see which
				// candidate triggered the flake path.
				$downgraded['plugin'] = (string) $retry['plugin'];
			}
			return $downgraded;
		}

		return $verdict;
	}

	/**
	 * Fire one front-end + admin probe pair and reduce to a single verdict.
	 *
	 * Extracted from `test()` so the retry path can re-invoke the same
	 * request shape without duplicating prep/parse logic. Returns the same
	 * verdict shape as `test()`.
	 *
	 * @param string[] $plugin_mains Absolute paths to plugin main PHP files (already validated).
	 * @param string   $mode         Probe mode constant.
	 * @return array Probe verdict.
	 */
	protected function send_probe_pair( array $plugin_mains, $mode ) {
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

		// Log transport-level errors (timeouts at PROBE_TIMEOUT,
		// connection failures, non-PCG-endpoint 200s) and synthesized
		// ok-inconclusive verdicts (HTTP 500, marker+non-JSON without a
		// captured fatal, redirect-budget exhaustion). Both are allow
		// paths under the "only block on captured fatal" policy, so we
		// rely on these logs to measure how often we're silently letting
		// activations/updates through despite a suspicious signal.
		if ( $this->is_anomalous_allow( $front_result ) || $this->is_anomalous_allow( $admin_result ) ) {
			$this->log_probe_anomaly( $mode, $plugin_mains, $front_result, $admin_result );
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
	 * Whether a verdict looks like an Atomic multi-node filesystem
	 * propagation lag rather than a genuine fatal: a fatal/throwable
	 * whose captured `file` is a `Failed opening required` or autoload
	 * miss inside one of the candidate plugins' own directories.
	 *
	 * Exposed for unit tests.
	 *
	 * @internal
	 * @param array    $result       Probe verdict.
	 * @param string[] $plugin_mains Absolute paths to the candidate plugins' main files.
	 * @return bool
	 */
	public function is_propagation_flake( array $result, array $plugin_mains ) {
		$status = (string) ( $result['status'] ?? '' );
		if ( 'fatal' !== $status && 'throwable' !== $status ) {
			return false;
		}
		$message = (string) ( $result['message'] ?? '' );

		// Anchor the class-not-found check to PHP's canonical wording —
		// `Class "Foo\Bar" not found` (PHP 8+) or `Class 'Foo' not found`
		// (legacy). A loose `str_contains` on 'Class ' / ' not found'
		// would over-match decorated error messages or wrapped fatals
		// that mention either substring incidentally, and silently
		// downgrade real bugs to ok-inconclusive after the retry.
		$looks_like_class_not_found    = (bool) preg_match( '/\bClass\s+["\'][^"\']+["\']\s+not found\b/', $message );
		$looks_like_missing_file_open  = str_contains( $message, 'Failed opening required' )
			|| str_contains( $message, 'failed to open stream: No such file or directory' );
		if ( ! $looks_like_missing_file_open && ! $looks_like_class_not_found ) {
			return false;
		}

		$captured_file = (string) ( $result['file'] ?? '' );
		if ( $this->path_inside_candidate( $captured_file, $plugin_mains ) ) {
			return true;
		}

		// Fall back to the message body ONLY for the file-open arm: those
		// messages carry the missing path verbatim, so a substring match
		// against a candidate's dir is a meaningful signal. The
		// class-not-found arm requires `captured_file` to live inside a
		// candidate — its message has no path to match on, and pulling
		// other text in (autoloader stack traces, wrapped errors) is the
		// over-match vector we want to avoid.
		if ( ! $looks_like_missing_file_open ) {
			return false;
		}
		return $this->message_references_candidate_path( $message, $plugin_mains );
	}

	/**
	 * Whether an absolute path lies inside one of the candidate plugins'
	 * own directories (or equals a candidate's main file). Flat-file
	 * plugins are skipped because their dirname is WP_PLUGIN_DIR, which
	 * would prefix-match every other plugin's files.
	 *
	 * @param string   $path         Absolute path to test.
	 * @param string[] $plugin_mains Absolute paths to the candidate plugins' main files.
	 * @return bool
	 */
	protected function path_inside_candidate( $path, array $plugin_mains ) {
		if ( '' === (string) $path ) {
			return false;
		}
		foreach ( $plugin_mains as $main ) {
			$dir = dirname( (string) $main );
			if ( WP_PLUGIN_DIR === $dir ) {
				continue;
			}
			if ( $path === $main || str_starts_with( $path, $dir . '/' ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Whether a `Failed opening required` message body mentions a path
	 * inside one of the candidate plugins' directories. Only safe for
	 * messages that PHP composes with the failing path verbatim — see
	 * `is_propagation_flake` for why we don't use this on autoloader
	 * misses.
	 *
	 * @param string   $message      Verdict message.
	 * @param string[] $plugin_mains Absolute paths to the candidate plugins' main files.
	 * @return bool
	 */
	protected function message_references_candidate_path( $message, array $plugin_mains ) {
		foreach ( $plugin_mains as $main ) {
			$dir = dirname( (string) $main );
			if ( WP_PLUGIN_DIR === $dir ) {
				continue;
			}
			if ( str_contains( $message, $dir . '/' ) ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * Log a propagation-flake downgrade so we can measure how often the
	 * retry path triggers and how often it still allows through. Sampled
	 * on the same `atomic_plugin_conflicts_guardian` feature bucket.
	 *
	 * @param string   $mode         Probe mode constant.
	 * @param string[] $plugin_mains Absolute paths to plugin main PHP files.
	 * @param array    $retry_result Verdict from the second probe attempt.
	 * @return void
	 */
	protected function log_propagation_flake_downgrade( $mode, array $plugin_mains, array $retry_result ) {
		$attributed = (string) ( $retry_result['plugin'] ?? '' );
		pcg_log_event(
			'Propagation flake downgrade',
			array(
				'mode'    => $mode,
				'plugins' => $this->relative_basenames( $plugin_mains ),
				// Specific candidate the throwable-catch in the probe
				// endpoint pinned the failure to, when available. Lets
				// support isolate the offending plugin in a batch
				// downgrade without grep-ing the full plugins list.
				'plugin'  => '' !== $attributed ? $this->relative_basenames( array( $attributed ) )[0] : '',
				'status'  => (string) ( $retry_result['status'] ?? '' ),
				'reason'  => (string) ( $retry_result['message'] ?? $retry_result['reason'] ?? '' ),
				'file'    => isset( $retry_result['file'] ) ? basename( (string) $retry_result['file'] ) : '',
			)
		);
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
	 * failure, intercepted loopback). Distinct from `is_block` — errors
	 * are inconclusive and don't block activation, but are worth logging.
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
	 * `ok-inconclusive` from parse_response (HTTP 500, redirect-budget
	 * exhaustion, marker-present-without-JSON). We log these so the
	 * dashboard can show the rate at which we're letting activations
	 * through without a captured verdict — the cost of the policy in
	 * `parse_response`.
	 *
	 * The flake-retry path's own ok-inconclusive verdict is logged
	 * separately via `log_propagation_flake_downgrade` with full
	 * candidate context; we exclude it here so the same event isn't
	 * counted twice.
	 *
	 * @param array $result Probe verdict.
	 * @return bool
	 */
	protected function is_anomalous_allow( $result ) {
		if ( $this->is_error( $result ) ) {
			return true;
		}
		$status = is_array( $result ) ? (string) ( $result['status'] ?? '' ) : '';
		if ( 'ok-inconclusive' !== $status ) {
			return false;
		}
		// Distinguish parse_response synthesized ok-inconclusive (no
		// `plugin` key, no candidate context) from the flake downgrade
		// (carries `plugin`/`message`/`file` from the retry verdict).
		// Only the former needs logging here; the latter has its own
		// dedicated logger.
		return ! isset( $result['plugin'] ) && ! isset( $result['file'] );
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
	 * One-line label for an anomalous-allow verdict — `<status>: <reason>`
	 * truncated to a sensible length. Lets a single log entry name both
	 * the class of allow (error vs ok-inconclusive) and the underlying
	 * cause (HTTP 500, redirect cycle, intercepted loopback, etc.).
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
		$options = array();
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

		// Policy: only block on a fatal we actually captured (status=fatal
		// from the shutdown handler's classify_shutdown, or status=throwable
		// from the require-time catch). Every other signal — HTTP 500,
		// marker-present-without-JSON, intercepted loopback — is a guess
		// at a fatal from outside the request, and historically each of
		// those guesses was the dominant false-positive class on Atomic.
		// Surface them as ok-inconclusive (allow + log) so the user can
		// always proceed and the dashboard can see the rate.
		if ( 500 === $code ) {
			return array(
				'status' => 'ok-inconclusive',
				'reason' => 'Probe loopback returned HTTP 500 without a JSON verdict; no captured fatal, so treating as inconclusive ok. Could be an upstream LB, edge proxy, intercepting plugin, or a real engine death we can\'t verify.',
			);
		}

		if ( $code >= 200 && $code < 300 ) {
			// Marker present + non-JSON 200: the probe endpoint ran but
			// no verdict was written. After the shutdown handler's
			// always-emit fix, this branch should be unreachable for
			// captured PHP fatals — they now emit status=fatal via
			// classify_shutdown. The only remaining ways here are
			// genuine engine death (segfault, OOM kill, FastCGI
			// process terminated) or a mid-stream connection drop /
			// re-entry-guarded partial body. None of those is a
			// captured fatal we can confidently attribute to a
			// plugin, so allow + log per the policy above.
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
