<?php
/**
 * Module Name: Publicize
 * Module Description: Automated social marketing.
 * Sort Order: 10
 * Recommendation Order: 7
 * First Introduced: 2.0
 * Requires Connection: Yes
 * Auto Activate: Yes
 * Module Tags: Social, Recommended
 * Feature: Engagement
 * Additional Search Queries: facebook, twitter, google+, googleplus, google, tumblr, linkedin, social, tweet, connections, sharing
 */

class Jetpack_Publicize {

	public $in_jetpack = true;

	function __construct() {
		global $publicize_ui;

		$this->in_jetpack = ( class_exists( 'Jetpack' ) && method_exists( 'Jetpack', 'enable_module_configurable' ) ) ? true : false;

		if ( $this->in_jetpack && method_exists( 'Jetpack', 'module_configuration_load' ) ) {
			Jetpack::enable_module_configurable( __FILE__ );
			Jetpack::module_configuration_load( __FILE__, array( $this, 'jetpack_configuration_load' ) );
		}

		require_once dirname( __FILE__ ) . '/publicize/publicize.php';

		if ( $this->in_jetpack )
			require_once dirname( __FILE__ ) . '/publicize/publicize-jetpack.php';
		else {
			require_once dirname( dirname( __FILE__ ) ) . '/mu-plugins/keyring/keyring.php';
			require_once dirname( __FILE__ ) . '/publicize/publicize-wpcom.php';
		}

		require_once dirname( __FILE__ ) . '/publicize/ui.php';
		$publicize_ui = new Publicize_UI();
		$publicize_ui->in_jetpack = $this->in_jetpack;

		// Jetpack specific checks / hooks
		if ( $this->in_jetpack) {
			// if sharedaddy isn't active, the sharing menu hasn't been added yet
			$active = Jetpack::get_active_modules();
			if ( in_array( 'publicize', $active ) && !in_array( 'sharedaddy', $active ) )
				add_action( 'admin_menu', array( &$publicize_ui, 'sharing_menu' ) );
		}
	}

	function jetpack_configuration_load() {
		wp_safe_redirect( menu_page_url( 'sharing', false ) );
		exit;
	}
}

global $publicize_ui;
new Jetpack_Publicize;

if( ! ( defined( 'IS_WPCOM' ) && IS_WPCOM ) && ! function_exists( 'publicize_init' ) ) {
/**
 * Helper for grabbing a Publicize object from the "front-end" (non-admin) of
 * a site. Normally Publicize is only loaded in wp-admin, so there's a little
 * set up that you might need to do if you want to use it on the front end.
 * Just call this function and it returns a Publicize object.
 *
 * @return Publicize Object
 */
function publicize_init() {
	global $publicize;

	if ( ! class_exists( 'Publicize' ) ) {
		require_once dirname( __FILE__ ) . '/publicize/publicize.php';
	}

	return $publicize;
}

}
