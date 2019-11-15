<?php

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Assets\Logo as Jetpack_Logo;

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
	 *
	 * @var string
	 */
	static $wpcom_home_url;

	/**
	 * Has safe mode been confirmed?
	 *
	 * @var bool
	 */
	static $is_safe_mode_confirmed;

	/**
	 * The current screen, which is set if the current user is a non-admin and this is an admin page.
	 *
	 * @var WP_Screen
	 */
	static $current_screen;

	/**
	 * The link to the support document used to explain Safe Mode to users
	 *
	 * @var string
	 */
	const SAFE_MODE_DOC_LINK = 'https://jetpack.com/support/safe-mode';

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_IDC();
		}

		return self::$instance;
	}

	private function __construct() {
		add_action( 'jetpack_sync_processed_actions', array( $this, 'maybe_clear_migrate_option' ) );
		if ( false === $urls_in_crisis = Jetpack::check_identity_crisis() ) {
			return;
		}

		self::$wpcom_home_url = $urls_in_crisis['wpcom_home'];
		add_action( 'init', array( $this, 'wordpress_init' ) );
	}

	/**
	 * This method loops through the array of processed items from sync and checks if one of the items was the
	 * home_url or site_url callable. If so, then we delete the jetpack_migrate_for_idc option.
	 *
	 * @param $processed_items array Array of processed items that were synced to WordPress.com
	 */
	function maybe_clear_migrate_option( $processed_items ) {
		foreach ( (array) $processed_items as $item ) {

			// First, is this item a jetpack_sync_callable action? If so, then proceed.
			$callable_args = ( is_array( $item ) && isset( $item[0], $item[1] ) && 'jetpack_sync_callable' === $item[0] )
				? $item[1]
				: null;

			// Second, if $callable_args is set, check if the callable was home_url or site_url. If so,
			// clear the migrate option.
			if (
				isset( $callable_args, $callable_args[0] )
				&& ( 'home_url' === $callable_args[0] || 'site_url' === $callable_args[1] )
			) {
				Jetpack_Options::delete_option( 'migrate_for_idc' );
				break;
			}
		}
	}

	function wordpress_init() {
		if ( ! current_user_can( 'jetpack_disconnect' ) && is_admin() ) {
			add_action( 'admin_notices', array( $this, 'display_non_admin_idc_notice' ) );
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_idc_notice_files' ) );
			add_action( 'current_screen', array( $this, 'non_admins_current_screen_check' ) );
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
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_idc_notice_files' ) );
		}
	}

	function non_admins_current_screen_check( $current_screen ) {
		self::$current_screen = $current_screen;
		if ( isset( $current_screen->id ) && 'toplevel_page_jetpack' == $current_screen->id ) {
			return null;
		}

		// If the user has dismissed the notice, and we're not currently on a Jetpack page,
		// then do not show the non-admin notice.
		if ( isset( $_COOKIE, $_COOKIE['jetpack_idc_dismiss_notice'] ) ) {
			remove_action( 'admin_notices', array( $this, 'display_non_admin_idc_notice' ) );
			remove_action( 'admin_enqueue_scripts', array( $this, 'enqueue_idc_notice_files' ) );
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
				'class' => 'hide',
			);
		}

		$wp_admin_bar->add_node( $menu );
	}

	static function prepare_url_for_display( $url ) {
		return untrailingslashit( Jetpack::normalize_url_protocol_agnostic( $url ) );
	}

	/**
	 * Clears all IDC specific options. This method is used on disconnect and reconnect.
	 */
	static function clear_all_idc_options() {
		// If the site is currently in IDC, let's also clear the VaultPress connection options.
		// We have to check if the site is in IDC, otherwise we'd be clearing the VaultPress
		// connection any time the Jetpack connection is cycled.
		if ( Jetpack::validate_sync_error_idc_option() ) {
			delete_option( 'vaultpress' );
			delete_option( 'vaultpress_auto_register' );
		}

		Jetpack_Options::delete_option(
			array(
				'sync_error_idc',
				'safe_mode_confirmed',
				'migrate_for_idc',
			)
		);
	}

	/**
	 * Does the current admin page have help tabs?
	 *
	 * @return bool
	 */
	function admin_page_has_help_tabs() {
		if ( ! function_exists( 'get_current_screen' ) ) {
			return false;
		}

		$current_screen = get_current_screen();
		$tabs           = $current_screen->get_help_tabs();

		return ! empty( $tabs );
	}

	function display_non_admin_idc_notice() {
		$classes = 'jp-idc-notice inline is-non-admin notice notice-warning';
		if ( isset( self::$current_screen ) && 'toplevel_page_jetpack' != self::$current_screen->id ) {
			$classes .= ' is-dismissible';
		}

		if ( $this->admin_page_has_help_tabs() ) {
			$classes .= ' has-help-tabs';
		}
		?>

		<div class="<?php echo $classes; ?>">
			<?php $this->render_notice_header(); ?>
			<div class="jp-idc-notice__content-header">
				<h3 class="jp-idc-notice__content-header__lead">
					<?php echo $this->get_non_admin_notice_text(); ?>
				</h3>

				<p class="jp-idc-notice__content-header__explanation">
					<?php echo $this->get_non_admin_contact_admin_text(); ?>
				</p>
			</div>
		</div>
		<?php
	}

	/**
	 * First "step" of the IDC mitigation. Will provide some messaging and two options/buttons.
	 * "Confirm Staging" - Dismiss the notice and continue on with our lives in staging mode.
	 * "Fix Jetpack Connection" - Will disconnect the site and start the mitigation...
	 */
	function display_idc_notice() {
		$classes = 'jp-idc-notice inline notice notice-warning';
		if ( $this->admin_page_has_help_tabs() ) {
			$classes .= ' has-help-tabs';
		}
		?>
		<div class="<?php echo $classes; ?>">
			<?php $this->render_notice_header(); ?>
			<?php $this->render_notice_first_step(); ?>
			<?php $this->render_notice_second_step(); ?>
		</div>
		<?php
	}

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
			Assets::get_file_url_for_environment( '_inc/build/idc-notice.min.js', '_inc/idc-notice.js' ),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);

		wp_localize_script(
			'jetpack-idc-js',
			'idcL10n',
			array(
				'apiRoot'         => esc_url_raw( rest_url() ),
				'nonce'           => wp_create_nonce( 'wp_rest' ),
				'tracksUserData'  => Jetpack_Tracks_Client::get_connected_user_tracks_identity(),
				'currentUrl'      => remove_query_arg( '_wpnonce', remove_query_arg( 'jetpack_idc_clear_confirmation' ) ),
				'tracksEventData' => array(
					'isAdmin'       => current_user_can( 'jetpack_disconnect' ),
					'currentScreen' => self::$current_screen ? self::$current_screen->id : false,
				),
			)
		);

		if ( ! wp_style_is( 'jetpack-dops-style' ) ) {
			wp_register_style(
				'jetpack-dops-style',
				plugins_url( '_inc/build/admin.css', JETPACK__PLUGIN_FILE ),
				array(),
				JETPACK__VERSION
			);
		}

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

	function render_notice_header() {
		?>
		<div class="jp-idc-notice__header">
			<div class="jp-idc-notice__header__emblem">
				<?php
				$jetpack_logo = new Jetpack_Logo();
				echo $jetpack_logo->get_jp_emblem();
				?>
			</div>
			<p class="jp-idc-notice__header__text">
				<?php esc_html_e( 'Jetpack Safe Mode', 'jetpack' ); ?>
			</p>
		</div>

		<div class="jp-idc-notice__separator"></div>
		<?php
	}

	/**
	 * Is a container for the error notices.
	 * Will be shown/controlled by jQuery in idc-notice.js
	 */
	function render_error_notice() {
		?>
		<div class="jp-idc-error__notice dops-notice is-error">
			<svg class="gridicon gridicons-notice dops-notice__icon" height="24" width="24" viewBox="0 0 24 24">
				<g>
					<path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm1 15h-2v-2h2v2zm0-4h-2l-.5-6h3l-.5 6z"></path>
				</g>
			</svg>
			<div class="dops-notice__content">
				<span class="dops-notice__text">
					<?php esc_html_e( 'Something went wrong:', 'jetpack' ); ?>
					<span class="jp-idc-error__desc"></span>
				</span>
				<a class="dops-notice__action" href="javascript:void(0);">
					<span id="jp-idc-error__action">
						<?php esc_html_e( 'Try Again', 'jetpack' ); ?>
					</span>
				</a>
			</div>
		</div>
		<?php
	}

	function render_notice_first_step() {
		?>
		<div class="jp-idc-notice__first-step">
			<div class="jp-idc-notice__content-header">
				<h3 class="jp-idc-notice__content-header__lead">
					<?php echo $this->get_first_step_header_lead(); ?>
				</h3>

				<p class="jp-idc-notice__content-header__explanation">
					<?php echo $this->get_first_step_header_explanation(); ?>
				</p>
			</div>

			<?php $this->render_error_notice(); ?>

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
		<?php
	}

	function render_notice_second_step() {
		?>
		<div class="jp-idc-notice__second-step">
			<div class="jp-idc-notice__content-header">
				<h3 class="jp-idc-notice__content-header__lead">
					<?php echo $this->get_second_step_header_lead(); ?>
				</h3>
			</div>

			<?php $this->render_error_notice(); ?>

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
		<?php
	}

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
		$string = esc_html__( 'Confirm Safe Mode', 'jetpack' );

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
		$string = esc_html__( 'Migrate Stats &amp; Subscribers', 'jetpack' );

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
		$string = esc_html__( 'Start Fresh &amp; Create New Connection', 'jetpack' );

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

	function get_non_admin_notice_text() {
		$html = wp_kses(
			sprintf(
				__(
					'Jetpack has been placed into Safe Mode. Learn more about <a href="%1$s">Safe Mode</a>.',
					'jetpack'
				),
				esc_url( self::SAFE_MODE_DOC_LINK )
			),
			array( 'a' => array( 'href' => array() ) )
		);

		/**
		 * Allows overriding of the default text that is displayed to non-admin on the Jetpack admin page.
		 *
		 * @since 4.4.0
		 *
		 * @param string $html The HTML to be displayed
		 */
		return apply_filters( 'jetpack_idc_non_admin_notice_text', $html );
	}

	function get_non_admin_contact_admin_text() {
		$string = esc_html__( 'An administrator of this site can take Jetpack out of Safe Mode.', 'jetpack' );

		/**
		 * Allows overriding of the default text that is displayed to non-admins prompting them to contact an admin.
		 *
		 * @since 4.4.0
		 *
		 * @param string $string The string to be displayed
		 */
		return apply_filters( 'jetpack_idc_non_admin_contact_admin_text', $string );
	}
}

add_action( 'plugins_loaded', array( 'Jetpack_IDC', 'init' ) );
