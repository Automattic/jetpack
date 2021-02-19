<?php
/**
 * Admin Menu file.
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
		add_action( 'admin_footer', array( $this, 'add_fab_icon' ) );

		add_action( 'admin_enqueue_scripts', array( $this, 'add_fab_styles' ) );
	}

	public function add_fab_icon( $data ) {

		if ( wp_doing_ajax() ) {
			return $data;
		}

		echo '<div class="inline-help"><a href="https://wordpress.com/help" target="_blank" rel="noopener noreferrer" title="Help" class="button inline-help__button is-borderless"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="gridicon gridicons-help" height="48" width="48"><use xlink:href="/calypso/images/gridicons-84d04a83ed8c3cfc40de995e9bd32649.svg#gridicons-help"></use></svg></a></div>';
	}

	public function add_fab_styles() {
		wp_enqueue_style( 'a8c-wpcom-inline-help', plugins_url( 'inline-help.css', __FILE__ ), array(), JETPACK__VERSION );
	}
}
