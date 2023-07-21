<?php

namespace Automattic\Jetpack\IdentityCrisis;

use Jetpack_Options;

class UrlSecret {

	const OPTION_KEY = 'identity_crisis_url_secret';

	/**
	 * Secret lifespan (5 minutes)
	 */
	const LIFESPAN = 300;

	private $secret;

	private $expires_at;

	public function __construct() {
		$secret_data = $this->fetch();

		if ( $secret_data !== null ) {
			$this->secret     = $secret_data['secret'];
			$this->expires_at = $secret_data['expires_at'];
		}
	}

	public function fetch() {
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
	 * @throws Exception
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
			throw new Exception( esc_html__( 'Unable to save new URL secret', 'jetpack-idc' ), 'unable_to_save_url_secret' );
		}

		$this->secret     = $secret_data['secret'];
		$this->expires_at = $secret_data['expires_at'];

		return true;
	}

	public function get_secret() {
		return $this->secret;
	}

	public function get_expires_at() {
		return $this->expires_at;
	}

	public function exists() {
		return $this->secret && $this->expires_at;
	}

	private function generate_secret() {
		// TODO: replace with proper string generator.
		return sha1( rand( 0, 999 ) );
	}

}
