<?php

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Status;

class TermsOfService {

	/**
	 * Allow the site to agree to the terms of service
	 */
	public function agree() {
		\Jetpack_Options::update_option( 'tos_agreed', true );
		/**
		 * Acton gets fire when the user has aggreed to the terms of service.
		 */
		do_action( 'jetpack_aggreed_to_terms_of_service' );
	}

	/**
	 * Returns if we thing that the user has aggreed to the Terms of Service.
	 *
	 * @return bool
	 */
	public function has_agreed() {
		if ( ! Jetpack_Options::get_option( 'tos_agreed' ) ) {
			return false;
		}

		$status = new Status();
		if ( $status->is_development_mode() ) {
			return false;
		}

		$manager = new Manager();
		return $manager->is_active();
	}

}
