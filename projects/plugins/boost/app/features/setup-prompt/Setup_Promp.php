<?php
/**
 * Prompt the user to setup Jetpack Boost.
 */

namespace Automattic\Jetpack_Boost\Features\Setup_Prompt;

use Automattic\Jetpack_Boost\Contracts\Has_Setup;

class Setup_Prompt implements Has_Setup {

	const NONCE_ACTION = 'jetpack_boost_setup_banner';
	const OPTION_KEY   = 'jb_setup_banner_dismissed';
	const AJAX_ACTION  = 'jb_dismiss_setup_banner';

	public function __construct() {
		// The ajax endpoint may not trigger the setup_trigger hook, so we need to add it here.
		add_action( 'wp_ajax_' . self::AJAX_ACTION, array( $this, 'dismiss_setup_banner' ) );
	}

	public function setup() {
		add_action( 'admin_notices', array( $this, 'connection_prompt' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
		add_action( 'admin_footer', array( $this, 'add_dismiss_script' ) );
	}

	public function enqueue_scripts() {
		wp_enqueue_style( 'jetpack-boost-admin-banner', plugins_url( '../../assets/dist/admin-banner.css', __FILE__ ), array(), JETPACK_BOOST_VERSION );
	}

	/**
	 * Get the action hoot that defines when to setup the prompt.
	 */
	public function setup_trigger() {
		return 'load-plugins.php';
	}

	public function connection_prompt() {
		if ( $this->is_showing_setup_banner() ) {
			include __DIR__ . '/_inc/banner.php';
		}
	}

	public function add_dismiss_script() {
		if ( $this->is_showing_setup_banner() ) {
			include __DIR__ . '/_inc/dismiss-script.php';
		}
	}

	private function is_showing_setup_banner() {
		return get_option( self::OPTION_KEY, true );
	}

	// hides the boost promo banner on dismiss
	public function dismiss_setup_banner() {
		check_ajax_referer( self::NONCE_ACTION, 'nonce' );
		update_option( self::OPTION_KEY, 0, 'no' );
		exit();
	}
}
