<?php
/**
 * HTTP-based plugin-load probe.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Runs a plugin's main file in a separate HTTP self-request. The parent
 * (admin) request generates a short-lived single-use token and stashes
 * the plugin path in a transient keyed to that token, then GETs a
 * special URL on this same site. The probe endpoint (registered in
 * `plugin-conflicts-guardian.php`, fires on `init`) validates the
 * token, `require`s the plugin main file with a shutdown handler armed,
 * and emits JSON — either a clean `{status: ok}` or the captured fatal.
 *
 * Why HTTP rather than a CLI subprocess:
 *   - Atomic and some managed hosts sandbox web-PHP so `proc_open`
 *     cannot find/exec a CLI binary (open_basedir + restricted exec).
 *   - A separate HTTP request is isolated from our own admin request:
 *     if the plugin fatals, the probe request 500s but the parent sees
 *     JSON via the shutdown handler, and the admin page keeps rendering.
 *
 * Limitations:
 *   - Only catches issues hit by `require`ing the plugin's main file
 *     (top-level code + immediately-registered class loads). Hooks
 *     registered by the plugin don't fire (we don't run `init` again
 *     after loading), so errors that surface only during hook callbacks
 *     are invisible.
 *   - Runs inside the normal plugins-loaded bootstrap — other active
 *     plugins are live, so conflicts with them CAN surface (the
 *     previous SHORTINIT approach avoided that).
 */
class PCG_Load_Tester {

	const PROBE_TIMEOUT  = 15;
	const TOKEN_LIFETIME = 30;

	/**
	 * Run the probe against a plugin main file.
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

		$token = wp_generate_password( 32, false );
		set_transient(
			$this->transient_key( $token ),
			array(
				'plugin_main' => $plugin_main,
				'user_id'     => get_current_user_id(),
			),
			self::TOKEN_LIFETIME
		);

		$url = add_query_arg(
			array(
				'pcg_probe' => '1',
				'token'     => $token,
			),
			home_url( '/' )
		);

		$response = wp_remote_get(
			$url,
			array(
				'timeout'     => self::PROBE_TIMEOUT,
				'blocking'    => true,
				// Skip redirect chasing so a sneaky 301 doesn't swallow a probe result.
				'redirection' => 0,
			)
		);

		// Clean up the transient whether or not the endpoint consumed
		// it — the endpoint deletes it too, so a double-delete is
		// harmless.
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
	 * Build the transient key for a probe token. Wrapped so the
	 * endpoint can use the same keying scheme.
	 *
	 * @param string $token Random probe token.
	 * @return string
	 */
	public static function transient_key( $token ) {
		return 'pcg_probe_' . md5( (string) $token );
	}
}
