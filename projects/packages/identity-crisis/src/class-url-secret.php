<?php
/**
 * IDC URL secret functionality.
 *
 * @package  automattic/jetpack-identity-crisis
 */

namespace Automattic\Jetpack\IdentityCrisis;

use Jetpack_Options;

/**
 * IDC URL secret functionality.
 * A short-lived secret used to verify whether an IDC is coming from the same vs a different Jetpack site.
 */
class URL_Secret {

	/**
	 * The options key used to store the secret.
	 */
	const OPTION_KEY = 'identity_crisis_url_secret';

	/**
	 * Secret lifespan (5 minutes)
	 */
	const LIFESPAN = 300;

	/**
	 * The URL secret string.
	 *
	 * @var string|null
	 */
	private $secret = null;

	/**
	 * The URL secret expiration date in unix timestamp.
	 *
	 * @var string|null
	 */
	private $expires_at = null;

	/**
	 * Initialize the class.
	 */
	public function __construct() {
		$secret_data = $this->fetch();

		if ( $secret_data !== null ) {
			$this->secret     = $secret_data['secret'];
			$this->expires_at = $secret_data['expires_at'];
		}
	}

	/**
	 * Fetch the URL secret from the database.
	 *
	 * @return array|null
	 */
	private function fetch() {
		$data = Jetpack_Options::get_option( static::OPTION_KEY );

		if ( $data === false || empty( $data['secret'] ) || empty( $data['expires_at'] ) ) {
			return null;
		}

		if ( time() > $data['expires_at'] ) {
			Jetpack_Options::delete_option( static::OPTION_KEY );
			return null;
		}

		return $data;
	}

	/**
	 * Create new secret and save it in the options.
	 *
	 * @throws Exception Thrown if unable to save the new secret.
	 *
	 * @return bool
	 */
	public function create() {
		$secret_data = array(
			'secret'     => $this->generate_secret(),
			'expires_at' => time() + static::LIFESPAN,
		);

		$result = Jetpack_Options::update_option( static::OPTION_KEY, $secret_data );

		if ( ! $result ) {
			throw new Exception( esc_html__( 'Unable to save new URL secret', 'jetpack-idc' ) );
		}

		$this->secret     = $secret_data['secret'];
		$this->expires_at = $secret_data['expires_at'];

		return true;
	}

	/**
	 * Get the URL secret.
	 *
	 * @return string|null
	 */
	public function get_secret() {
		return $this->secret;
	}

	/**
	 * Get the URL secret expiration date.
	 *
	 * @return string|null
	 */
	public function get_expires_at() {
		return $this->expires_at;
	}

	/**
	 * Check if the secret exists.
	 *
	 * @return bool
	 */
	public function exists() {
		return $this->secret && $this->expires_at;
	}

	/**
	 * Generate the secret string.
	 *
	 * @return string
	 */
	private function generate_secret() {
		return wp_generate_password( 12, false );
	}

	/**
	 * Generate secret for response.
	 *
	 * @param string $flow used to tell which flow generated the exception.
	 * @return string
	 */
	public static function create_secret( $flow = 'generating_secret_failed' ) {
		$secret = null;
		try {

			$secret = new self();
			$secret->create();

			if ( $secret->exists() ) {
				$secret = $secret->get_secret();
			}
		} catch ( Exception $e ) {
			// Track the error and proceed.
			( new Tracking() )->record_user_event( $flow, array( 'current_url' => Urls::site_url() ) );
		}
		return $secret;
	}
}
