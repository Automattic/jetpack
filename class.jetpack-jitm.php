<?php

/**
 * Jetpack just in time messaging through out the admin
 *
 */
class Jetpack_JITM {

	/**
	 * @var Jetpack_JITM
	 **/
	private static $instance = null;

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_JITM;
		}

		return self::$instance;
	}

	private function __construct() {
		add_action( 'post-upload-ui', array( $this, 'photon_msg' ) );
	}

	/*
	 * Present Photon JITM activation msg
	 *
	 */
	function photon_msg() {
		echo 'YOUR PHOTON';
		_e( 'Activate Photon', 'jetpack' );
	}

}

if ( apply_filters( 'Jetpack_JITM_msgs', false ) ) {
	Jetpack_JITM::init();
}