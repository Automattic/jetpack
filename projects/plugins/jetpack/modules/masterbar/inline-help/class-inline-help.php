<?php
/**
 * Inline Help
 *
 * Handles providing a LiveChat icon within WPAdmin until such time
 * as the full live chat experience can be run in a non-Calypso environment.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Dashboard_Customizations;

use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;

/**
 * Class Inline_Help.
 */
class Inline_Help {


	public function __construct() {
		$this->register_actions();
	}

	public function register_actions() {

		$is_gutenframe = 0 === strpos( $_SERVER['REQUEST_URI'], 'frame-nonce' );

		if ( $is_gutenframe ) {
			return;
		}

		add_action( 'admin_footer', array( $this, 'add_fab_icon' ) );

		add_action( 'admin_enqueue_scripts', array( $this, 'add_fab_styles' ) );
	}

	public function add_fab_icon( $data ) {

		if ( wp_doing_ajax() ) {
			return;
		}

		$gridicon_help = file_get_contents( __DIR__ . '/gridicon-help.svg', true );

		echo '<div class="inline-help"><a href="https://wordpress.com/help" target="_blank" rel="noopener noreferrer" title="' . esc_attr__( 'Help', 'jetpack' ) . '" class="inline-help__button">' . $gridicon_help . '</a></div>';
	}


	public function add_fab_styles() {
		wp_enqueue_style( 'a8c-wpcom-inline-help', plugins_url( 'inline-help.css', __FILE__ ), array(), JETPACK__VERSION );
	}
}
