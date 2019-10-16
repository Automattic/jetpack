<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Status;

/**
 * Class Terms_Of_Service
 *
 * Helper class that tells is resposible for the agreemend of the terms of service.
 * When a user delete Jetpack the deletion script
 * Remove the option that is responsible for the terms of service option.
 * Resetting it.
 *
 * @package Automattic\Jetpack
 */
class Terms_Of_Service {
	/**
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
