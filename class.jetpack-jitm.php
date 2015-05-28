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
		add_action( 'install_plugins_search', array( $this, 'plugin_search' ), 1 );
	}

	/*
	 * Present JITM on plugin search results page
	 * so we can better educate users on what Jetpack does already
	 *
	 */
	function plugin_search() {

		$tags = array(
			'protect' => array(
				'brute force', 'brute', 'botnet', 'protect'
			),
			'gallery' => array(
				'brute force', 'brute', 'botnet', 'protect'
			),
			'protect' => array(
				'brute force', 'brute', 'botnet', 'protect'
			),
		);

		echo '
		<style>
			.jetpack-jitm { background: #fff; padding-left: 25px; border: 1px solid #333; margin-top: 25px; }
		</style><div class="jetpack-jitm"><p>Jetpack is already here to help you with "' . $_GET['s'] .'" <a href="" class="jetpack-learnmore-module">(learn more)</a></p></div>';

	}

}
Jetpack_JITM::init();
