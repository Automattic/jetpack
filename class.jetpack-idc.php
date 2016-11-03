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

	/**
	 * The link to the support document used to explain Safe Mode to users
	 * @var string
	 */
	const SAFE_MODE_DOC_LINK = 'https://jetpack.com/support/safe-mode';

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
		add_action( 'init', array( $this, 'wordpress_init' ) );
	}

	function wordpress_init() {
		if ( ! $this->should_show_idc_notice() ) {
			return;
		}
		add_action( 'admin_notices', array( $this, 'display_idc_notice' ) );
		add_action( 'admin_enqueue_scripts', array( $this,'enqueue_idc_notice_files' ) );
	}

	function should_show_idc_notice() {
		return (
			current_user_can( 'jetpack_disconnect' )
			&& Jetpack::is_active()
			&& ! Jetpack::is_development_mode()
			&& ! Jetpack_Options::get_option( 'safe_mode_confirmed', false )
		);
	}

	static function prepare_url_for_display( $url ) {
		return untrailingslashit( Jetpack::normalize_url_protocol_agnostic( $url ) );
	}

	/**
	 * First "step" of the IDC mitigation. Will provide some messaging and two options/buttons.
	 * "Confirm Staging" - Dismiss the notice and continue on with our lives in staging mode.
	 * "Fix Jetpack Connection" - Will disconnect the site and start the mitigation...
	 */
	function display_idc_notice() { ?>
		<div class="jp-idc-notice notice notice-warning">
			<div class="jp-idc-notice__header">
				<div class="jp-idc-notice__header__emblem">
					<?php echo Jetpack::get_jp_emblem(); ?>
				</div>
				<p class="jp-idc-notice__header__text">
					<?php esc_html_e( 'Jetpack Safe Mode', 'jetpack' ); ?>
				</p>
			</div>

			<div class="jp-idc-notice__separator"></div>

			<?php $this->render_notice_first_step(); ?>
			<?php $this->render_notice_second_step(); ?>
		</div>
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
			'idcL10n',
			array(
				'apiRoot' => esc_url_raw( rest_url() ),
				'nonce' => wp_create_nonce( 'wp_rest' ),
			)
		);

		wp_register_style(
			'jetpack-dops-style',
			plugins_url( '_inc/build/admin.dops-style.css', JETPACK__PLUGIN_FILE ),
			array(),
			JETPACK__VERSION
		);

		wp_enqueue_style(
			'jetpack-idc-css',
			plugins_url( 'css/jetpack-idc.css', JETPACK__PLUGIN_FILE ),
			array( 'jetpack-dops-style' ),
			JETPACK__VERSION
		);
	}

	function render_notice_first_step() { ?>
		<div class="jp-idc-notice__first-step">
			<div class="jp-idc-notice__content-header">
				<h3 class="jp-idc-notice__content-header__lead">
					<?php
					echo wp_kses(
						sprintf(
							__(
								'Jetpack has been placed into <a href="%1$s">Safe mode</a> because we noticed this is an exact copy of <a href="%2$s">%3$s</a>.',
								'jetpack'
							),
							esc_url( self::SAFE_MODE_DOC_LINK ),
							esc_url( self::$wpcom_home_url ),
							self::prepare_url_for_display( esc_url_raw( self::$wpcom_home_url ) )
						),
						array( 'a' => array( 'href' => array() ) )
					);
					?>
				</h3>

				<p class="jp-idc-notice__content-header__explanation">
					<?php
					echo wp_kses(
						sprintf(
							__(
								'Please confirm Safe Mode or fix the Jetpack connection. Select one of the options below or <a href="%1$s">learn 
								more about Safe Mode</a>.',
								'jetpack'
							),
							esc_url( self::SAFE_MODE_DOC_LINK )
						),
						array( 'a' => array( 'href' => array() ) )
					);
					?>
				</p>
			</div>

			<div class="jp-idc-notice__actions">
				<div class="jp-idc-notice__separator"></div>
				<div class="jp-idc-notice__action">
					<p class="jp-idc-notice__action__explanation">
						<?php
						echo wp_kses(
							sprintf(
								__(
									'Is this website a temporary duplicate of <a href="%1$s">%2$s</a> for the purposes 
									of testing, staging or development? If so, we recommend keeping it in Safe Mode.',
									'jetpack'
								),
								esc_url( untrailingslashit( self::$wpcom_home_url ) ),
								self::prepare_url_for_display( esc_url( self::$wpcom_home_url ) )
							),
							array( 'a' => array( 'href' => array() ) )
						);
						?>
					</p>
					<button id="jp-idc-confirm-safe-mode-action" class="dops-button">
						<?php esc_html_e( 'Confirm Safe Mode' ); ?>
					</button>
				</div>

				<div class="jp-idc-notice__separator"></div>

				<div class="jp-idc-notice__action">
					<p class="jp-idc-notice__action__explanation">
						<?php
						echo wp_kses(
							sprintf(
								__(
									'If this is a separate and new website, or the new home of <a href="%1$s">%2$s</a>, 
									we recommend turning Safe Mode off, and re-establishing your connection to WordPress.com.',
									'jetpack'
								),
								esc_url( untrailingslashit( self::$wpcom_home_url ) ),
								self::prepare_url_for_display( esc_url( self::$wpcom_home_url ) )
							),
							array( 'a' => array( 'href' => array() ) )
						);
						?>
					</p>
					<button id="jp-idc-fix-connection-action" class="dops-button">
						<?php esc_html_e( "Fix Jetpack's Connection" ); ?>
					</button>
				</div>
			</div>
		</div>
	<?php }

	function render_notice_second_step() { ?>
		<div class="jp-idc-notice__second-step">
			<div class="jp-idc-notice__content-header">
				<h3 class="jp-idc-notice__content-header__lead">
					<?php
						printf(
							esc_html__(
								'Is %1$s the new home of %2$s?',
								'jetpack'
							),
							untrailingslashit( Jetpack::normalize_url_protocol_agnostic( get_home_url() ) ),
							untrailingslashit( Jetpack::normalize_url_protocol_agnostic( esc_url_raw( self::$wpcom_home_url ) ) )
						)
					?>
				</h3>
			</div>

			<div class="jp-idc-notice__actions">
				<div class="jp-idc-notice__separator"></div>
				<div class="jp-idc-notice__action">
					<p class="jp-idc-notice__action__explanation">
						<?php
							echo wp_kses(
								sprintf(
									__(
										'Yes. <a href="%1$s">%2$s</a> is replacing <a href="%3$s">%4$s</a>. I would like to
										migrate my stats and subscribers from <a href="%3$s">%4$s</a> to <a href="%1$s">%2$s</a>.',
										'jetpack'
									),
									esc_url( get_home_url() ),
									self::prepare_url_for_display( get_home_url() ),
									esc_url( self::$wpcom_home_url ),
									untrailingslashit( Jetpack::normalize_url_protocol_agnostic( esc_url_raw( self::$wpcom_home_url ) ) )
								),
								array( 'a' => array( 'href' => array() ) )
							);
						?>
					</p>
					<button id="jp-idc-migrate-action" class="dops-button">
						<?php esc_html_e( 'Migrate stats &amp; and Subscribers' ); ?>
					</button>
				</div>

				<div class="jp-idc-notice__separator"></div>

				<div class="jp-idc-notice__action">
					<p class="jp-idc-notice__action__explanation">
						<?php
							echo wp_kses(
								sprintf(
									__(
										'No. <a href="%1$s">%2$s</a> is a new and different website that\'s separate from 
										<a href="%3$s">%4$s</a>. It requires  a new connection to WordPress.com for new stats and subscribers.',
										'jetpack'
									),
									esc_url( get_home_url() ),
									self::prepare_url_for_display( get_home_url() ),
									esc_url( self::$wpcom_home_url ),
									untrailingslashit( Jetpack::normalize_url_protocol_agnostic( esc_url_raw( self::$wpcom_home_url ) ) )
								),
								array( 'a' => array( 'href' => array() ) )
							);
						?>
					</p>
					<button id="jp-idc-reconnect-site-action" class="dops-button">
						<?php esc_html_e( 'Start fresh &amp; create new connection' ); ?>
					</button>
				</div>
			</div>
		</div>
	<?php }
}

Jetpack_IDC::init();
