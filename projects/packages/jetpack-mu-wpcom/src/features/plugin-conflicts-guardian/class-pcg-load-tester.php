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
	 * Transient key for a probe token. Shared with the endpoint.
	 *
	 * @param string $token Random probe token.
	 * @return string
	 */
	public static function transient_key( $token ) {
		return 'pcg_probe_' . md5( (string) $token );
	}
}
