<?php
/**
 * Module Name: Keyring
 * Module Description: Connections to WPCOM (TODO)
 * Sort Order: 10
 * Recommendation Order: 7
 * First Introduced: 6.5.0
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Recommended
 * Feature: General
 * Additional Search Queries: connections
 */

class Jetpack_Keyring {

	public $in_jetpack = true;

	function __construct() {

		$this->in_jetpack = ( class_exists( 'Jetpack' ) && method_exists( 'Jetpack', 'enable_module_configurable' ) ) ? true : false;

		// investigate what this for
		if ( $this->in_jetpack && method_exists( 'Jetpack', 'module_configuration_load' ) ) {
			Jetpack::enable_module_configurable( __FILE__ );
			Jetpack::module_configuration_load( __FILE__, array( $this, 'jetpack_configuration_load' ) );
		}

		if ( $this->in_jetpack ) {
			require_once dirname( __FILE__ ) . '/keyring/keyring-jetpack.php';
		}

	}
}


new Jetpack_Keyring;
