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
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_css_header' ) );
		add_action( 'post-upload-ui', array( $this, 'photon_msg' ) );
	}

	/*
	 * Present Photon JITM activation msg
	 *
	 */
	function photon_msg() {
		echo '<div class="jp-jitm"><a href="#" class="dismiss"><span class="genericon genericon-close"></span></a><p><span class="icon"></span>';
		_e( 'Activate Photon and Jetpack will mirror your images to our free CDN servers, delivering them to your visitors optimized and faster than ever, learn more ', 'jetpack' );
		echo '</div>';

	}

	/*
	* Function to enqueue jitm css specifically in the header
	*/
	function enqueue_css_header( $hook ) {
	
		$wp_styles = new WP_Styles();

		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

		wp_enqueue_style( 'jetpack-jitm-css', plugins_url( "css/jetpack-admin-jitm{$min}.css", JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION . '-20121016' );
		$wp_styles->add_data( 'jetpack-jitm-css', 'rtl', true );
	}
}

if ( apply_filters( 'Jetpack_JITM_msgs', false ) ) {
	Jetpack_JITM::init();
}