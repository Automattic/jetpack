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
		if ( ! Jetpack::is_active() ) {
			return;
		}
		global $pagenow;
		$jetpack_hide_jitm = Jetpack_Options::get_option( 'hide_jitm' );
		$showphoton = empty( $jetpack_hide_jitm['photon'] ) ? 'show' : $jetpack_hide_jitm['photon'];
		$showmanage = empty( $jetpack_hide_jitm['manage'] ) ? 'show' : $jetpack_hide_jitm['manage'];
		if ( 'media-new.php' == $pagenow && ! Jetpack::is_module_active( 'photon' ) && 'hide' != $showphoton ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
			add_action( 'post-plupload-upload-ui', array( $this, 'photon_msg' ) );
		}
		else if ( 'update-core.php' == $pagenow && 'hide' != $showmanage ) {
			add_action( 'admin_enqueue_scripts', array( $this, 'jitm_enqueue_files' ) );
			add_action( 'admin_notices', array( $this, 'manage_msg' ) );
		}
	}


	/*
	 * Present Manage just in time activation msg on update-core.php
	 *
	 */
	function manage_msg() {
		if ( current_user_can( 'jetpack_manage_modules' ) ) {
			$normalized_site_url = Jetpack::build_raw_urls( get_home_url() );
			$manage_active = Jetpack::is_module_active( 'manage' );
			?>
			<div class="jp-jitm">
				<a href="#"  data-module="manage" class="dismiss"><span class="genericon genericon-close"></span></a>
				<div class="jp-emblem">
					<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" id="Layer_1" x="0" y="0" viewBox="0 0 172.9 172.9" enable-background="new 0 0 172.9 172.9" xml:space="preserve">
						<path d="M86.4 0C38.7 0 0 38.7 0 86.4c0 47.7 38.7 86.4 86.4 86.4s86.4-38.7 86.4-86.4C172.9 38.7 134.2 0 86.4 0zM83.1 106.6l-27.1-6.9C49 98 45.7 90.1 49.3 84l33.8-58.5V106.6zM124.9 88.9l-33.8 58.5V66.3l27.1 6.9C125.1 74.9 128.4 82.8 124.9 88.9z"/>
					</svg>
				</div>
				<p class="msg">
					<?php _e( 'Reduce security risks with automated plugin updates.', 'jetpack' ); ?>
				</p>
				<p>
					<img class="j-spinner hide" src="<?php echo esc_url( includes_url( 'images/spinner-2x.gif' ) ); ?>" alt="Loading ..." /><a href="#" data-module="manage" class="activate button <?php if( Jetpack::is_module_active( 'manage' ) ) { echo 'hide'; } ?>"><?php esc_html_e( 'Activate Now', 'jetpack' ); ?></a><a href="<?php echo esc_url( 'https://wordpress.com/plugins/' . $normalized_site_url ); ?>" target="_blank" title="<?php esc_attr_e( 'Go to WordPress.com to try these features', 'jetpack' ); ?>" id="jetpack-wordpressdotcom" class="button button-jetpack <?php if( ! Jetpack::is_module_active( 'manage' ) ) { echo 'hide'; } ?>"><?php esc_html_e( 'Go to WordPress.com', 'jetpack' ); ?></a>
				</p>
			</div>
		<?php
			//jitm is being viewed, track it
			$jetpack = Jetpack::init();
			$jetpack->stat( 'jitm', 'manage-viewed-' . JETPACK__VERSION );
			$jetpack->do_stats( 'server_side' );
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
				<p class="msg">
					<?php _e( 'Speed up your photos and save bandwidth costs by using a free content delivery network.', 'jetpack' ); ?>
				</p>
				<p>
					<img class="j-spinner hide" style="margin-top: 13px;" width="17" height="17" src="<?php echo esc_url( includes_url( 'images/spinner-2x.gif' ) ); ?>" alt="Loading ..." /><a href="#" data-module="photon" class="activate button button-jetpack"><?php esc_html_e( 'Activate Photon', 'jetpack' ); ?></a>
				</p>
			</div>
		<?php
			//jitm is being viewed, track it
			$jetpack = Jetpack::init();
			$jetpack->stat( 'jitm', 'photon-viewed-' . JETPACK__VERSION );
			$jetpack->do_stats( 'server_side' );
		}
	}

	/*
	* Function to enqueue jitm css and js
	*/
	function jitm_enqueue_files( $hook ) {

		$wp_styles = new WP_Styles();
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';
		wp_enqueue_style( 'jetpack-jitm-css', plugins_url( "css/jetpack-admin-jitm{$min}.css", JETPACK__PLUGIN_FILE ), false, JETPACK__VERSION . '-201243242' );
		$wp_styles->add_data( 'jetpack-jitm-css', 'rtl', true );

		//Build stats url for tracking manage button
		$jitm_stats_url = Jetpack::build_stats_url( array( 'x_jetpack-jitm' => 'wordpresstools' ) );

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
				),
				'manage_msgs' => array(
					'success' => __( 'Success! WordPress.com tools are now active.', 'jetpack' ),
					'fail'    => __( 'We are sorry but unfortunately Manage did not activate.', 'jetpack' )
				),
				'jitm_stats_url' => $jitm_stats_url
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