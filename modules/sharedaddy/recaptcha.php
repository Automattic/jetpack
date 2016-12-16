<?php

/**
 * Class that handles reCAPTCHA.
 */
class Jetpack_ReCaptcha {

	/**
	 * URL to which requests are POSTed.
	 *
	 * @const string
	 */
	const VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

	/**
	 * Site key to use in HTML code.
	 *
	 * @var string
	 */
	private $site_key;

	/**
	 * Shared secret for the site.
	 *
	 * @var string
	 */
	private $secret_key;

	/**
	 * Config for reCAPTCHA instance.
	 *
	 * @var array
	 */
	private $config;

	/**
	 * Error codes returned from reCAPTCHA API.
	 *
	 * @see https://developers.google.com/recaptcha/docs/verify
	 *
	 * @var array
	 */
	private $error_codes;

	/**
	 * Create a configured instance to use the reCAPTCHA service.
	 *
	 * @param string $site_key   Site key to use in HTML code.
	 * @param string $secret_key Shared secret between site and reCAPTCHA server.
	 * @param array  $config     Config array to optionally configure reCAPTCHA instance.
	 */
	public function __construct( $site_key, $secret_key, $config = array() ) {
		$this->site_key   = $site_key;
		$this->secret_key = $secret_key;
		$this->config     = wp_parse_args( $config, $this->get_default_config() );

		$this->error_codes = array(
			'missing-input-secret'   => __( 'The secret parameter is missing', 'jetpack' ),
			'invalid-input-secret'   => __( 'The secret parameter is invalid or malformed', 'jetpack' ),
			'missing-input-response' => __( 'The response parameter is missing', 'jetpack' ),
			'invalid-input-response' => __( 'The response parameter is invalid or malformed', 'jetpack' ),
			'invalid-json'           => __( 'Invalid JSON', 'jetpack' ),
			'unexpected-response'    => __( 'Unexpected response', 'jetpack' ),
		);
	}

	/**
	 * Get default config for this reCAPTCHA instance.
	 *
	 * @return array Default config
	 */
	public function get_default_config() {
		return array(
			'language'       => get_locale(),
			'script_async'   => true,
			'tag_class'      => 'g-recaptcha',
			'tag_attributes' => array(
				'theme'    => 'light',
				'type'     => 'image',
				'tabindex' => 0,
			),
		);
	}

	/**
	 * Calls the reCAPTCHA siteverify API to verify whether the user passes
	 * CAPTCHA test.
	 *
	 * @param string $response  The value of 'g-recaptcha-response' in the submitted
	 *                          form.
	 * @param string $remote_ip The end user's IP address.
	 *
	 * @return bool|WP_Error Returns true if verified. Otherwise WP_Error is returned.
	 */
	public function verify( $response, $remote_ip ) {
		// No need make a request if response is empty.
		if ( empty( $response ) ) {
			return new WP_Error( 'missing-input-response', $this->error_codes['missing-input-response'], 400 );
		}

		$resp = wp_remote_post( self::VERIFY_URL, $this->get_verify_request_params( $response, $remote_ip ) );
		if ( is_wp_error( $resp ) ) {
			return $resp;
		}

		$resp_decoded = json_decode( wp_remote_retrieve_body( $resp ), true );
		if ( ! $resp_decoded ) {
			return new WP_Error( 'invalid-json', $this->error_codes['invalid-json'], 400 );
		}

		// Default error code and message.
		$error_code    = 'unexpected-response';
		$error_message = $this->error_codes['unexpected-response'];

		// Use the first error code if exists.
		if ( isset( $resp_decoded['error-codes'] ) && is_array( $resp_decoded['error-codes'] ) ) {
			if ( isset( $resp_decoded['error-codes'][0] ) && isset( $this->error_codes[ $resp_decoded['error-codes'][0] ] ) ) {
				$error_message = $this->error_codes[ $resp_decoded['error-codes'][0] ];
				$error_code    = $resp_decoded['error-codes'][0];
			}
		}

		if ( ! isset( $resp_decoded['success'] ) ) {
			return new WP_Error( $error_code, $error_message );
		}

		if ( true !== $resp_decoded['success'] ) {
			return new WP_Error( $error_code, $error_message );
		}

		return true;
	}

	/**
	 * Get siteverify request parameters.
	 *
	 * @param string $response  The value of 'g-recaptcha-response' in the submitted
	 *                          form.
	 * @param string $remote_ip The end user's IP address.
	 *
	 * @return array
	 */
	public function get_verify_request_params( $response, $remote_ip ) {
		return array(
			'body' => array(
				'secret'   => $this->secret_key,
				'response' => $response,
				'remoteip' => $remote_ip,
			),
			'sslverify' => true,
		);
	}

	/**
	 * Get reCAPTCHA HTML to render.
	 *
	 * @return string
	 */
	public function get_recaptcha_html() {
		return sprintf(
			'
			<div
				class="%s"
				data-sitekey="%s"
				data-theme="%s"
				data-type="%s"
				data-tabindex="%s"></div>
			<script type="text/javascript" src="https://www.google.com/recaptcha/api.js?hl=%s"%s></script>
			',
			esc_attr( $this->config['tag_class'] ),
			esc_attr( $this->site_key ),
			esc_attr( $this->config['tag_attributes']['theme'] ),
			esc_attr( $this->config['tag_attributes']['type'] ),
			esc_attr( $this->config['tag_attributes']['tabindex'] ),
			rawurlencode( $this->config['language'] ),
			$this->config['script_async'] ? ' async' : ''
		);
	}
}
