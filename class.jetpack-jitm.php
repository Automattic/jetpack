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
		$jetpack_hide_jitm = Jetpack_Options::get_option( 'hide_jitm' );

		if ( ! Jetpack::is_module_active( 'photon' ) && 'hide' != $jetpack_hide_jitm['photon'] ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
			add_action( 'post-upload-ui', array( $this, 'photon_msg' ) );
		}
	}

	/*
	 * Present Photon just in time activation msg
	 *
	 */
	function photon_msg() {
		if ( current_user_can( 'activate_plugins' ) ) { ?>
			<div class="jp-jitm"><a href="#"  data-module="photon" class="dismiss"><span class="genericon genericon-close"></span></a>
				<p><span class="icon"></span>
					<?php _e( 'Mirror your images to our free Jetpack CDN to deliver them to your visitors optimized and faster than ever.', 'jetpack' ); ?>
					<a href="#" data-module="photon" class="activate button button-jetpack">
						<?php esc_html_e( 'Activate Photon', 'jetpack' ); ?>
					</a>
				</p>
			</div>
		<?php }
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
			array( 'jquery' ), JETPACK__VERSION . '-20121111', true );
		wp_localize_script(
			'jetpack-jitm-js',
			'jitmL10n',
			array(
				'ajaxurl'       => admin_url( 'admin-ajax.php' ),
				'jitm_nonce'    => wp_create_nonce( 'jetpack-jitm-nonce' ),
				'photon_msgs'   => array(
					'success' => __( 'Success! Photon is now actively optimizing and serving your images for free.' ),
					'fail' => __( 'We are sorry but unfortunately Photon did not activate.' )
				)
			)
		);
	}
}

if ( apply_filters( 'Jetpack_JITM_msgs', false ) ) {
	Jetpack_JITM::init();
}