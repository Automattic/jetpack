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
	 * Has safe mode been confirmed?
	 * @var bool
	 */
	static $is_safe_mode_confirmed;

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
		if ( ! current_user_can( 'jetpack_disconnect' ) ) {
			return;
		}

		if (
			isset( $_GET['jetpack_idc_clear_confirmation'], $_GET['_wpnonce'] ) &&
			wp_verify_nonce( $_GET['_wpnonce'], 'jetpack_idc_clear_confirmation' )
		) {
			Jetpack_Options::delete_option( 'safe_mode_confirmed' );
			self::$is_safe_mode_confirmed = false;
		} else {
			self::$is_safe_mode_confirmed = (bool) Jetpack_Options::get_option( 'safe_mode_confirmed' );
		}

		// 121 Priority so that it's the most inner Jetpack item in the admin bar.
		add_action( 'admin_bar_menu', array( $this, 'display_admin_bar_button' ), 121 );
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_admin_bar_css' ) );

		if ( is_admin() && ! self::$is_safe_mode_confirmed ) {
			add_action( 'admin_notices', array( $this, 'display_idc_notice' ) );
			add_action( 'admin_enqueue_scripts', array( $this,'enqueue_idc_notice_files' ) );
		}
	}

	function display_admin_bar_button() {
		global $wp_admin_bar;

		$href = is_admin()
			? add_query_arg( 'jetpack_idc_clear_confirmation', '1' )
			: add_query_arg( 'jetpack_idc_clear_confirmation', '1', admin_url() );

		$href = wp_nonce_url( $href, 'jetpack_idc_clear_confirmation' );

		$title = sprintf(
			'<span class="jp-idc-admin-bar">%s %s</span>',
			'<span class="dashicons dashicons-warning"></span>',
			esc_html__( 'Jetpack Safe Mode', 'jetpack' )
		);

		$menu = array(
			'id'     => 'jetpack-idc',
			'title'  => $title,
			'href'   => esc_url( $href ),
			'parent' => 'top-secondary',
		);

		if ( ! self::$is_safe_mode_confirmed ) {
			$menu['meta'] = array(
				'class' => 'hide'
			);
		}

		$wp_admin_bar->add_node( $menu );
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

	function enqueue_admin_bar_css() {
		wp_enqueue_style(
			'jetpack-idc-admin-bar-css',
			plugins_url( 'css/jetpack-idc-admin-bar.css', JETPACK__PLUGIN_FILE ),
			array( 'dashicons' ),
			JETPACK__VERSION
		);
	}

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
				'tracksUserData' => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
				'currentUrl' => remove_query_arg( '_wpnonce', remove_query_arg( 'jetpack_idc_clear_confirmation' ) ),
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

		// Required for Tracks
		wp_enqueue_script(
			'jp-tracks',
			'//stats.wp.com/w.js',
			array(),
			gmdate( 'YW' ),
			true
		);

		wp_enqueue_script(
			'jp-tracks-functions',
			plugins_url( '_inc/lib/tracks/tracks-callables.js', JETPACK__PLUGIN_FILE ),
			array(),
			JETPACK__VERSION,
			false
		);
	}

	function render_notice_first_step() { ?>
		<div class="jp-idc-notice__first-step">
			<div class="jp-idc-notice__content-header">
				<h3 class="jp-idc-notice__content-header__lead">
					<?php echo $this->get_first_step_header_lead(); ?>
				</h3>

				<p class="jp-idc-notice__content-header__explanation">
					<?php echo $this->get_first_step_header_explanation(); ?>
				</p>
			</div>

			<div class="jp-idc-notice__actions">
				<div class="jp-idc-notice__action">
					<p class="jp-idc-notice__action__explanation">
						<?php echo $this->get_confirm_safe_mode_action_explanation(); ?>
					</p>
					<button id="jp-idc-confirm-safe-mode-action" class="dops-button">
						<?php echo $this->get_confirm_safe_mode_button_text(); ?>
					</button>
				</div>

				<div class="jp-idc-notice__action">
					<p class="jp-idc-notice__action__explanation">
						<?php echo $this->get_first_step_fix_connection_action_explanation(); ?>
					</p>
					<button id="jp-idc-fix-connection-action" class="dops-button">
						<?php echo $this->get_first_step_fix_connection_button_text(); ?>
					</button>
				</div>
			</div>
		</div>
	<?php }

	function render_notice_second_step() { ?>
		<div class="jp-idc-notice__second-step">
			<div class="jp-idc-notice__content-header">
				<h3 class="jp-idc-notice__content-header__lead">
					<?php echo $this->get_second_step_header_lead(); ?>
				</h3>
			</div>

			<div class="jp-idc-notice__actions">
				<div class="jp-idc-notice__action">
					<p class="jp-idc-notice__action__explanation">
						<?php echo $this->get_migrate_site_action_explanation(); ?>
					</p>
					<button id="jp-idc-migrate-action" class="dops-button">
						<?php echo $this->get_migrate_site_button_text(); ?>
					</button>
				</div>

				<div class="jp-idc-notice__action">
					<p class="jp-idc-notice__action__explanation">
						<?php echo $this->get_start_fresh_action_explanation(); ?>
					</p>
					<button id="jp-idc-reconnect-site-action" class="dops-button">
						<?php echo $this->get_start_fresh_button_text(); ?>
					</button>
				</div>

			</div>

			<p class="jp-idc-notice__unsure-prompt">
				<?php echo $this->get_unsure_prompt(); ?>
			</p>
		</div>
	<?php }

	function get_first_step_header_lead() {
		$html = wp_kses(
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

		/**
		 * Allows overriding of the default header text in the first step of the Safe Mode notice.
		 *
		 * @since 4.4.0
		 *
		 * @param string $html The HTML to be displayed
		 */
		return apply_filters( 'jetpack_idc_first_step_header_lead', $html );
	}

	function get_first_step_header_explanation() {
		$html = wp_kses(
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

		/**
		 * Allows overriding of the default header explanation text in the first step of the Safe Mode notice.
		 *
		 * @since 4.4.0
		 *
		 * @param string $html The HTML to be displayed
		 */
		return apply_filters( 'jetpack_idc_first_step_header_explanation', $html );
	}

	function get_confirm_safe_mode_action_explanation() {
		$html = wp_kses(
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

		/**
		 * Allows overriding of the default text used to explain the confirm safe mode action.
		 *
		 * @since 4.4.0
		 *
		 * @param string $html The HTML to be displayed
		 */
		return apply_filters( 'jetpack_idc_confirm_safe_mode_explanation', $html );
	}

	function get_confirm_safe_mode_button_text() {
		$string =  esc_html__( 'Confirm Safe Mode', 'jetpack' );

		/**
		 * Allows overriding of the default text used for the confirm safe mode action button.
		 *
		 * @since 4.4.0
		 *
		 * @param string $string The string to be displayed
		 */
		return apply_filters( 'jetpack_idc_confirm_safe_mode_button_text', $string );
	}

	function get_first_step_fix_connection_action_explanation() {
		$html = wp_kses(
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

		/**
		 * Allows overriding of the default text used to explain the fix Jetpack connection action.
		 *
		 * @since 4.4.0
		 *
		 * @param string $html The HTML to be displayed
		 */
		return apply_filters( 'jetpack_idc_first_fix_connection_explanation', $html );
	}

	function get_first_step_fix_connection_button_text() {
		$string = esc_html__( "Fix Jetpack's Connection", 'jetpack' );

		/**
		 * Allows overriding of the default text used for the fix Jetpack connection action button.
		 *
		 * @since 4.4.0
		 *
		 * @param string $string The string to be displayed
		 */
		return apply_filters( 'jetpack_idc_first_step_fix_connection_button_text', $string );
	}

	function get_second_step_header_lead() {
		$string = sprintf(
			esc_html__(
				'Is %1$s the new home of %2$s?',
				'jetpack'
			),
			untrailingslashit( Jetpack::normalize_url_protocol_agnostic( get_home_url() ) ),
			untrailingslashit( Jetpack::normalize_url_protocol_agnostic( esc_url_raw( self::$wpcom_home_url ) ) )
		);

		/**
		 * Allows overriding of the default header text in the second step of the Safe Mode notice.
		 *
		 * @since 4.4.0
		 *
		 * @param string $html The HTML to be displayed
		 */
		return apply_filters( 'jetpack_idc_second_step_header_lead', $string );
	}

	function get_migrate_site_action_explanation() {
		$html = wp_kses(
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

		/**
		 * Allows overriding of the default text for explaining the migrate site action.
		 *
		 * @since 4.4.0
		 *
		 * @param string $html The HTML to be displayed
		 */
		return apply_filters( 'jetpack_idc_migrate_site_explanation', $html );
	}

	function get_migrate_site_button_text() {
		$string = esc_html__( 'Migrate stats &amp; and Subscribers', 'jetpack' );

		/**
		 * Allows overriding of the default text used for the migrate site action button.
		 *
		 * @since 4.4.0
		 *
		 * @param string $string The string to be displayed
		 */
		return apply_filters( 'jetpack_idc_migrate_site_button_text', $string );
	}

	function get_start_fresh_action_explanation() {
		$html = wp_kses(
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

		/**
		 * Allows overriding of the default text for explaining the start fresh action.
		 *
		 * @since 4.4.0
		 *
		 * @param string $html The HTML to be displayed
		 */
		return apply_filters( 'jetpack_idc_start_fresh_explanation', $html );
	}

	function get_start_fresh_button_text() {
		$string = esc_html__( 'Start fresh &amp; create new connection', 'jetpack' );

		/**
		 * Allows overriding of the default text used for the start fresh action button.
		 *
		 * @since 4.4.0
		 *
		 * @param string $string The string to be displayed
		 */
		return apply_filters( 'jetpack_idc_start_fresh_button_text', $string );
	}

	function get_unsure_prompt() {
		$html = wp_kses(
			sprintf(
				__(
					'Unsure what to do? <a href="%1$s">Read more about Jetpack Safe Mode</a>',
					'jetpack'
				),
				esc_url( self::SAFE_MODE_DOC_LINK )
			),
			array( 'a' => array( 'href' => array() ) )
		);

		/**
		 * Allows overriding of the default text using in the "Unsure what to do?" prompt.
		 *
		 * @since 4.4.0
		 *
		 * @param string $html The HTML to be displayed
		 */
		return apply_filters( 'jetpack_idc_unsure_prompt', $html );
	}
}

Jetpack_IDC::init();
