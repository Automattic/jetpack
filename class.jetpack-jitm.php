<?php

/**
 * Jetpack just in time messaging through out the admin
 *
 * @since 3.7.0
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
		global $pagenow;
		$jetpack_hide_jitm = Jetpack_Options::get_option( 'hide_jitm' );
		if ( 'media-new.php' == $pagenow && ! Jetpack::is_module_active( 'photon' ) && 'hide' != $jetpack_hide_jitm['photon'] ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
			add_action( 'post-plupload-upload-ui', array( $this, 'photon_msg' ) );
		}
	}

	/*
	 * Present Photon just in time activation msg
	 *
	 */
	function photon_msg() {
		if ( current_user_can( 'jetpack_manage_modules' ) ) { ?>
			<div class="jp-jitm">
				<a href="#"  data-module="photon" class="dismiss"><span class="genericon genericon-close"></span></a>
				<div class="jp-emblem">
					<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0" y="0" viewBox="0 0 172.9 172.9" enable-background="new 0 0 172.9 172.9" xml:space="preserve">
						<path d="M86.4 0C38.7 0 0 38.7 0 86.4c0 47.7 38.7 86.4 86.4 86.4s86.4-38.7 86.4-86.4C172.9 38.7 134.2 0 86.4 0zM83.1 106.6l-27.1-6.9C49 98 45.7 90.1 49.3 84l33.8-58.5V106.6zM124.9 88.9l-33.8 58.5V66.3l27.1 6.9C125.1 74.9 128.4 82.8 124.9 88.9z"/>
					</svg>
				</div>
				<p>
					<?php _e( 'Deliver super-fast images to your visitors that are automatically optimized for any device.', 'jetpack' ); ?>
				</p>
				<p>
					<a href="#" data-module="photon" class="activate button button-jetpack">
						<?php esc_html_e( 'Activate Photon', 'jetpack' ); ?>
					</a>
				</p>
			</div>
		<?php
			//jitm is being viewed, track it
			$jetpack = Jetpack::init();
			$jetpack->stat( 'jitm', 'photon-viewed' );
			$jetpack->do_stats( 'server_side' );
		}
	}
	
	/*
	* Function to enqueue jitm css and js
	*/
	function jitm_enqueue_files( $hook ) {

		$wp_styles = new WP_Styles();
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
		wp_enqueue_style( 'jetpack-jitm-css', plugins_url( "css/jetpack-admin-jitm{$min}.css", JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION . '-20121016' );
		$wp_styles->add_data( 'jetpack-jitm-css', 'rtl', true );

		// Enqueue javascript to handle jitm notice events
		wp_enqueue_script( 'jetpack-jitm-js', plugins_url( '_inc/jetpack-jitm.js', JETPACK__PLUGIN_FILE ),
			array( 'jquery' ), JETPACK__VERSION, true );
		wp_localize_script(
			'jetpack-jitm-js',
			'jitmL10n',
			array(
				'ajaxurl'     => admin_url( 'admin-ajax.php' ),
				'jitm_nonce'  => wp_create_nonce( 'jetpack-jitm-nonce' ),
				'photon_msgs' => array(
					'success' => __( 'Success! Photon is now actively optimizing and serving your images for free.', 'jetpack' ),
					'fail'    => __( 'We are sorry but unfortunately Photon did not activate.', 'jetpack' )
				)
			)
		);
	}
}
/**
 * Filter to turn off all just in time messages
 *
 * @since 3.7.0
 *
 * @param bool true Whether to show just in time messages.
 */
if ( apply_filters( 'jetpack_just_in_time_msgs', false ) ) {
	Jetpack_JITM::init();
}