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

		add_action( 'admin_notices', array( $this, 'prepare_idc_notice' ) );
	}

	function prepare_idc_notice() {
		if ( ! current_user_can( 'jetpack_disconnect' ) || ! Jetpack::is_active() || Jetpack::is_development_mode() ) {
			return;
		}

		$this->enqueue_idc_notice_files();
		$this->idc_notice_step_one();
	}

	/**
	 * First "step" of the IDC mitigation. Will provide some messaging and two options/buttons.
	 * "Confirm Staging" - Dismiss the notice and continue on with our lives in staging mode.
	 * "Fix Jetpack Connection" - Will disconnect the site and start the mitigation...
	 */
	function idc_notice_step_one() {
		$safe_mode_doc_link = 'https://jetpack.com/support/safe-mode';
		$old_url = esc_url( self::$wpcom_home_url );
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
					_e(
						sprintf(
							'Jetpack has been placed into %1$sSafe Mode%2$s because we noticed this is an exact copy of %3$s.
							Please confirm Safe Mode or fix the Jetpack connection. Select one of the options below or %1$slearn more about Safe Mode%2$s.',
							'<a href="' . esc_url( $safe_mode_doc_link ) . '">',
							'</a>',
							'<a href="' . $old_url . '">' . $old_url . '</a>'
						), 'jetpack'
					)
				?>
			</div>
			<div style="width: 49%; display: inline-block;">
				<?php
					_e(
						sprintf(
							'Is this website a temporaray duplicate of %s for the purposes of testing, staging or development?
							If so, we recommend keeping it in Safe Mode.',
							'<a href="' . $old_url . '">' . $old_url . '</a>'
						), 'jetpack'
					);
				?>
				<button><?php _e( 'Confirm Safe Mode' ); ?></button>
			</div>
			<div style="width: 49%; display: inline-block;">
				<?php
				_e(
					sprintf(
						'If this is a separate and new website, or the new home of %s, we recommend turning Safe Mode off,
						and re-establishing your connection to WordPress.com.',
						'<a href="' . $old_url . '">' . $old_url . '</a>'
					), 'jetpack'
				);
				?>
				<button><?php _e( "Fix Jetpack's Connection" ); ?></button>
			</div>
		</div>
		<style>
			.jp-emblem {
				width: 25px;
				height: 25px;
				margin: .40em 1em 0 auto;
				float: left;
			}
		</style>
	<?php }

	/**
	 * Enqueue scripts for the notice
	 */
	function enqueue_idc_notice_files() {
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
	}
}

Jetpack_IDC::init();
