<?php

/**
 * This class will handle everything involved with fixing an Identity Crisis.
 *
 * @since 4.4.0
 */
class Jetpack_IDC {

	/**
	 * @var Jetpack_IDC
	 **/
	private static $instance = null;

	/**
	 * The wpcom value of the home URL
	 * @var string
	 */
	static $wpcom_home_url;

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_IDC;
		}

		return self::$instance;
	}

	private function __construct() {
		if ( false === $urls_in_crisis = Jetpack::check_identity_crisis() ) {
			return;
		}

		self::$wpcom_home_url = $urls_in_crisis['wpcom_home'];

		add_action( 'admin_notices', array( $this, 'display_idc_notice' ) );
		add_action( 'admin_enqueue_scripts', array( $this,'enqueue_idc_notice_files' ) );
	}

	function should_show_idc_notice() {
		return current_user_can( 'jetpack_disconnect' ) && Jetpack::is_active() && ! Jetpack::is_development_mode();
	}

	/**
	 * First "step" of the IDC mitigation. Will provide some messaging and two options/buttons.
	 * "Confirm Staging" - Dismiss the notice and continue on with our lives in staging mode.
	 * "Fix Jetpack Connection" - Will disconnect the site and start the mitigation...
	 */
	function display_idc_notice() {
		if ( ! $this->should_show_idc_notice() ) {
			return;
		}

		$safe_mode_doc_link = 'https://jetpack.com/support/safe-mode';
		?>
		<div class="jp-idc notice notice-warning">
			<div class="jp-emblem">
				<?php echo Jetpack::get_jp_emblem(); ?>
			</div>
			<p class="msg-top">
				<?php esc_html_e( 'Jetpack Safe Mode.', 'jetpack' ); ?>
			</p>
			<hr />
			<div class="msg-bottom-head">
				<?php
					echo wp_kses(
						sprintf(
							__(
								'Jetpack has been placed into <a href="%1$s">Safe mode</a> because we noticed this is an exact copy of %2$s.
								Please confirm Safe Mode or fix the Jetpack connection. Select one of the options below or <a href="%1$s">learn 
								more about Safe Mode</a>.',
								'jetpack'
							),
							esc_url( $safe_mode_doc_link ),
							Jetpack::normalize_url_protocol_agnostic( esc_url_raw( self::$wpcom_home_url ) )
						),
						array( 'a' => array( 'href' => array() ) )
					);
				?>
			</div>
			<div style="width: 49%; display: inline-block;">
				<?php
					echo wp_kses(
						sprintf(
							__(
								'Is this website a temporary duplicate of <a href="%1$s">%2$s</a> for the purposes of testing, staging or development? If so, we recommend keeping it in Safe Mode.',
								'jetpack'
							),
							esc_url( self::$wpcom_home_url ),
							Jetpack::normalize_url_protocol_agnostic( esc_url_raw( self::$wpcom_home_url ) )
						),
						array( 'a' => array( 'href' => array() ) )
					);
				?>
				<button><?php esc_html_e( 'Confirm Safe Mode' ); ?></button>
			</div>
			<div style="width: 49%; display: inline-block;">
				<?php
					echo wp_kses(
						sprintf(
							__(
								'If this is a separate and new website, or the new home of <a href="%1$s">%2$s</a>, we recommend turning Safe Mode off,
								and re-establishing your connection to WordPress.com.',
								'jetpack'
							),
							esc_url( $safe_mode_doc_link ),
							Jetpack::normalize_url_protocol_agnostic( esc_url_raw( self::$wpcom_home_url ) )
						),
						array( 'a' => array( 'href' => array() ) )
					);
				?>
				<button><?php esc_html_e( "Fix Jetpack's Connection" ); ?></button>
			</div>
		</div>
	<?php }

	/**
	 * Enqueue scripts for the notice
	 */
	function enqueue_idc_notice_files() {
		if ( ! $this->should_show_idc_notice() ) {
			return;
		}

		wp_enqueue_script(
			'jetpack-idc-js',
			plugins_url( '_inc/idc-notice.js', JETPACK__PLUGIN_FILE ),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);

		wp_localize_script(
			'jetpack-idc-js',
			'idc',
			array(
				'ajaxurl'   => admin_url( 'admin-ajax.php' ),
				'idc_nonce' => wp_create_nonce( 'jetpack-idc-nonce' ),
			)
		);

		wp_enqueue_style(
			'jetpack-idc-css',
			plugins_url( 'css/jetpack-idc.css', JETPACK__PLUGIN_FILE ),
			array(),
			JETPACK__VERSION
		);
	}
}

Jetpack_IDC::init();
