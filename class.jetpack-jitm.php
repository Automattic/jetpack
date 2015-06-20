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
		if ( ! Jetpack::is_module_active( 'photon' ) ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_css_header' ) );
			add_action( 'post-upload-ui', array( $this, 'photon_msg' ) );
		}
	}

	/*
	 * Present Photon just in time activation msg
	 *
	 */
	function photon_msg() {
		if ( current_user_can( 'activate_plugins' ) ) { ?>
			<div class="jp-jitm"><a href="#" class="dismiss"><span class="genericon genericon-close"></span></a>
				<p><span class="icon"></span>
					<?php _e( 'Mirror your images to our free Jetpack CDN to deliver them to your visitors optimized and faster than ever.', 'jetpack' ); ?>
					<a href="<?php echo esc_url( wp_nonce_url( Jetpack::admin_url( array( 'action' => 'activate', 'module' => 'photon' ) ), 'jetpack_activate-photon' ) ); ?>"
					   class="button button-jetpack">
						<?php esc_html_e( 'Activate Photon', 'jetpack' ); ?>
					</a>
				</p>
			</div>
		<?php }
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