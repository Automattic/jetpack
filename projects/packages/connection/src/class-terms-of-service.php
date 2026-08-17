<?php
/**
 * A Terms of Service class for Jetpack.
 *
 * @package automattic/jetpack-connection
 */

namespace Automattic\Jetpack;

/**
 * Class Terms_Of_Service
 *
 * Helper class that is responsible for the state of agreement of the terms of service.
 */
class Terms_Of_Service {
	/**
	 * Jetpack option name where the terms of service state is stored.
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
		 * Acton fired when the master user has agreed to the terms of service.
		 *
		 * @since 1.0.4
		 * @since-jetpack 7.9.0
		 */
		do_action( 'jetpack_agreed_to_terms_of_service' );
	}

	/**
	 * Allow the site to reject to the terms of service.
	 */
	public function reject() {
		$this->set_reject();
		/**
		 * Acton fired when the master user has revoked their agreement to the terms of service.
		 *
		 * @since 1.0.4
		 * @since-jetpack 7.9.1
		 */
		do_action( 'jetpack_reject_terms_of_service' );
	}

	/**
	 * Returns whether the master user has agreed to the terms of service.
	 *
	 * The following conditions have to be met in order to agree to the terms of service.
	 * 1. The master user has gone though the connect flow.
	 * 2. The site is not in dev mode.
	 * 3. The master user of the site is still connected (deprecated @since 1.4.0).
	 *
	 * @return bool
	 */
	public function has_agreed() {
		if ( $this->is_offline_mode() ) {
			return false;
		}
		/**
		 * Before 1.4.0 we used to also check if the master user of the site is connected
		 * by calling the Connection related `is_active` method.
		 * As of 1.4.0 we have removed this check in order to resolve the
		 * circular dependencies it was introducing to composer packages.
		 *
		 * @since 1.4.0
		 */
		return $this->get_raw_has_agreed();
	}

	/**
	 * Abstracted for testing purposes.
	 * Tells us if the site is in dev mode.
	 *
	 * @return bool
	 */
	protected function is_offline_mode() {
		return ( new Status() )->is_offline_mode();
	}

	/**
	 * Gets just the Jetpack Option that contains the terms of service state.
	 * Abstracted for testing purposes.
	 *
	 * @return bool
	 */
	protected function get_raw_has_agreed() {
		$option_name = 'jetpack_' . self::OPTION_NAME;

		// Probe existence via the raw option so the sentinel default never crosses the public
		// jetpack_options filter, whose callbacks treat the value as an array. Both this and the
		// read below are option-cache hits, not database queries.
		$sentinel = '__jetpack_tos_agreed_absent__';
		if ( $sentinel === get_option( $option_name, $sentinel ) ) {
			// Seed an autoloaded default so it isn't re-queried every request on sites without a
			// persistent object cache. add_option, not update_option (which no-ops when the new
			// value equals the current default).
			add_option( $option_name, false, '', true );
			return false;
		}

		return \Jetpack_Options::get_option( self::OPTION_NAME );
	}

	/**
	 * Sets the correct Jetpack Option to mark the that the site has agreed to the terms of service.
	 * Abstracted for testing purposes.
	 */
	protected function set_agree() {
		\Jetpack_Options::update_option( self::OPTION_NAME, true );
	}

	/**
	 * Sets the correct Jetpack Option to mark that the site has rejected the terms of service.
	 * Abstracted for testing purposes.
	 */
	protected function set_reject() {
		\Jetpack_Options::update_option( self::OPTION_NAME, false );
	}
}
