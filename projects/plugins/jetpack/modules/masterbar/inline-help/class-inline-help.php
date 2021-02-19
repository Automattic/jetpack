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

		echo '<div class="inline-help"><a href="https://wordpress.com/help" target="_blank" rel="noopener noreferrer" title="Help" class="inline-help__button"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="gridicon gridicons-help" height="48" width="48"><svg viewBox="0 0 24 24" id="gridicons-help"><g><path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 16h-2v-2h2v2zm0-4.14V15h-2v-2c0-.552.448-1 1-1 1.103 0 2-.897 2-2s-.897-2-2-2-2 .897-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 1.862-1.278 3.413-3 3.86z"></path></g></svg></svg></a></div>';
	}


	public function add_fab_styles() {
		wp_enqueue_style( 'a8c-wpcom-inline-help', plugins_url( 'inline-help.css', __FILE__ ), array(), JETPACK__VERSION );
	}
}
