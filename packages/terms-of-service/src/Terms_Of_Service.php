<?php
/**
 * A Terms of Service class for Jetpack.
 *
 * @package automattic/jetpack-terms-of-service
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Status;

/**
 * Class Terms_Of_Service
 *
 * Helper class that is responsible for the state of agreement of the terms of service.
 *
 */
class Terms_Of_Service {
	/**
	 * Option name where the terms of service gets stored.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'tos_agreed';

	/**
	 * Allow the site to agree to the terms of service.
	 */
	public function agree() {
		$this->set_agree();
		/**
		 * Acton gets fire when the master user has aggreed to the terms of service.
		 *
		 * @since 7.9.0
		 */
		do_action( 'jetpack_agreed_to_terms_of_service' );
	}

	/**
	 * Allow the site to revoke to the terms of service.
	 */
	public function revoke() {
		$this->set_revoke();
		/**
		 * Acton gets fire when the master user has aggreed to the terms of service.
		 *
		 * @since 7.9.0
		 */
		do_action( 'jetpack_revoke_to_terms_of_service' );
	}

	/**
	 * Returns whether the master user has agreed to the terms of service.
	 *
	 * The following conditions have to be met in order to agree to the terms of service.
	 * 1. The master user has gone though the connect flow.
	 * 2. The site is not in dev mode.
	 * 3. The master user of the site is still connected.
	 *
	 * @return bool
	 */
	public function has_agreed() {
		if ( ! $this->get_raw_has_agreed() ) {
			return false;
		}

		if ( $this->is_development_mode() ) {
			return false;
		}

		return $this->is_active();
	}

	/**
	 * Abstracted for testing purposes.
	 * Tells us if the site is in dev mode.
	 *
	 * @return bool
	 */
	protected function is_development_mode() {
		$status = new Status();
		return $status->is_development_mode();
	}

	/**
	 * Abstracted for testing purposes.
	 *
	 * @return bool
	 */
	protected function get_raw_has_agreed() {
		return \Jetpack_Options::get_option( self::OPTION_NAME );
	}

	/**
	 * Abstracted for testing purposes.
	 * Tells us if the site is connected.
	 *
	 * @return bool
	 */
	protected function is_active() {
		$manager = new Manager();
		return $manager->is_active();
	}

	/**
	 * Abstracted for testing purposes.
	 */
	protected function set_agree() {
		\Jetpack_Options::update_option( self::OPTION_NAME, true );
	}

	/**
	 * Abstracted for testing purposes.
	 */
	protected function set_revoke() {
		\Jetpack_Options::update_option( self::OPTION_NAME, false );
	}

}
