<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Main class file for Jetpack Admin pages.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Automattic\Jetpack\Identity_Crisis;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;

/**
 * Shared logic between Jetpack admin pages.
 */
abstract class Jetpack_Admin_Page {
	/**
	 * Jetpack Object.
	 *
	 * @var Jetpack
	 */
	public $jetpack;

	/**
	 * Add page specific actions given the page hook.
	 *
	 * @param string $hook Hook of current page.
	 */
	abstract public function add_page_actions( $hook );

	/**
	 * Create a menu item for the page and returns the hook.
	 *
	 * @return string|false Return value from WordPress's `add_menu_page()` or `add_submenu_page()`.
	 */
	abstract public function get_page_hook();

	/**
	 * Enqueue and localize page specific scripts.
	 */
	abstract public function page_admin_scripts();

	/**
	 * Render page specific HTML
	 */
	abstract public function page_render();

	/**
	 * Should we block the page rendering because the site is in IDC?
	 *
	 * @var bool
	 */
	public static $block_page_rendering_for_idc;

	/**
	 * Function called after admin_styles to load any additional needed styles.
	 *
	 * @since 4.3.0
	 */
	public function additional_styles() {}

	/**
	 * The constructor.
	 */
	public function __construct() {
		add_action( 'jetpack_loaded', array( $this, 'on_jetpack_loaded' ) );
	}

	/**
	 * Runs on Jetpack being ready to load its packages.
	 *
	 * @param Jetpack $jetpack object.
	 */
	public function on_jetpack_loaded( $jetpack ) {
		$this->jetpack = $jetpack;

		self::$block_page_rendering_for_idc = (
			Jetpack::is_connection_ready() && Identity_Crisis::validate_sync_error_idc_option() && ! Jetpack_Options::get_option( 'safe_mode_confirmed' )
		);
	}

	/**
	 * Add common page actions and attach page-specific actions.
	 */
	public function add_actions() {
		$is_offline_mode = ( new Status() )->is_offline_mode();

		// If user is not an admin and site is in Offline Mode or not connected yet then don't do anything.
		if ( ! current_user_can( 'manage_options' ) && ( $is_offline_mode || ! Jetpack::is_connection_ready() ) ) {
			return;
		}

		// Is Jetpack not connected and not offline?
		// True means that Jetpack is NOT connected and NOT in offline mode.
		// If Jetpack is connected OR in offline mode, this will be false.
		$connectable = ! Jetpack::is_connection_ready() && ! $is_offline_mode;

		// Don't add in the modules page unless modules are available!
		if ( $this->dont_show_if_not_active && $connectable ) {
			return;
		}

		// Initialize menu item for the page in the admin.
		$hook = $this->get_page_hook();

		// Attach hooks common to all Jetpack admin pages based on the created hook.
		add_action( "load-$hook", array( $this, 'admin_help' ) );
		add_action( "load-$hook", array( $this, 'admin_page_load' ) );
		add_action( "admin_print_styles-$hook", array( $this, 'admin_styles' ) );
		add_action( "admin_print_scripts-$hook", array( $this, 'admin_scripts' ) );

		if ( ! self::$block_page_rendering_for_idc ) {
			add_action( "admin_print_styles-$hook", array( $this, 'additional_styles' ) );
		}

		// Check if the site plan changed and deactivate modules accordingly.
		add_action( 'current_screen', array( $this, 'check_plan_deactivate_modules' ) );

		// Attach page specific actions in addition to the above.
		$this->add_page_actions( $hook );

		// If the current user can connect Jetpack, Jetpack isn't connected, and is not in offline mode, let's prompt!
		if ( current_user_can( 'jetpack_connect' ) && $connectable ) {
			$this->add_connection_banner_actions();
		}
	}

	/**
	 * Hooks to add when Jetpack is not active or in offline mode for an user capable of connecting.
	 */
	private function add_connection_banner_actions() {
		global $pagenow;
		// If someone just activated Jetpack, let's show them a fullscreen connection banner.
		if ( ( 'admin.php' === $pagenow && isset( $_GET['page'] ) && 'jetpack' === $_GET['page'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			add_action( 'admin_enqueue_scripts', array( 'Jetpack_Connection_Banner', 'enqueue_banner_scripts' ) );
			add_action( 'admin_enqueue_scripts', array( 'Jetpack_Connection_Banner', 'enqueue_connect_button_scripts' ) );
			delete_transient( 'activated_jetpack' );
		}

		// If Jetpack not yet connected, but user is viewing one of the pages with a Jetpack connection banner.
		if ( ( 'index.php' === $pagenow || 'plugins.php' === $pagenow ) ) {
			add_action( 'admin_enqueue_scripts', array( 'Jetpack_Connection_Banner', 'enqueue_connect_button_scripts' ) );
		}
	}

	/**
	 * Render the page with a common top and bottom part, and page specific content.
	 */
	public function render() {
		// We're in an IDC: we need a decision made before we show the UI again.
		if ( self::$block_page_rendering_for_idc ) {
			return;
		}

		// Check if we are looking at the main dashboard.
		if ( isset( $_GET['page'] ) && 'jetpack' === $_GET['page'] ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- View logic.
			$this->page_render();
			return;
		}

		$args = array();

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['page'] ) && 'jetpack_modules' === $_GET['page'] ) {
			$args['is-wide'] = true;
		}

		self::wrap_ui( array( $this, 'page_render' ), $args );
	}

	/**
	 * Load Help tab.
	 *
	 * @todo This may no longer be used.
	 */
	public function admin_help() {
		$this->jetpack->admin_help();
	}

	/**
	 * Call the existing admin page events.
	 */
	public function admin_page_load() {
		$this->jetpack->admin_page_load();
	}

	/**
	 * Add page specific scripts and jetpack stats for all menu pages.
	 */
	public function admin_scripts() {
		$this->page_admin_scripts(); // Delegate to inheriting class.
		add_action( 'admin_footer', array( $this->jetpack, 'do_stats' ) );
	}

	/**
	 * Enqueue the Jetpack admin stylesheet.
	 */
	public function admin_styles() {
		$min = ( defined( 'SCRIPT_DEBUG' ) && SCRIPT_DEBUG ) ? '' : '.min';

		wp_enqueue_style( 'jetpack-admin', plugins_url( "css/jetpack-admin{$min}.css", JETPACK__PLUGIN_FILE ), array( 'genericons' ), JETPACK__VERSION . '-20121016' );
		wp_style_add_data( 'jetpack-admin', 'rtl', 'replace' );
		wp_style_add_data( 'jetpack-admin', 'suffix', $min );
	}

	/**
	 * Checks if REST API is enabled.
	 *
	 * @since 4.4.2
	 *
	 * @return bool
	 */
	public function is_rest_api_enabled() {
		return /** This filter is documented in wp-includes/rest-api/class-wp-rest-server.php */
			apply_filters( 'rest_enabled', true ) &&
			/** This filter is documented in wp-includes/rest-api/class-wp-rest-server.php */
			apply_filters( 'rest_authentication_errors', true );
	}

	/**
	 * Checks the site plan and deactivates modules that were active but are no longer included in the plan.
	 *
	 * @since 4.4.0
	 *
	 * @param WP_Screen $page Current WP_Screen object.
	 *
	 * @return array
	 */
	public function check_plan_deactivate_modules( $page ) {
		if (
			( new Status() )->is_offline_mode()
			|| ! in_array(
				$page->base,
				array(
					'toplevel_page_jetpack',
					'admin_page_jetpack_modules',
					'jetpack_page_vaultpress',
					'jetpack_page_stats',
					'jetpack_page_akismet-key-config',
				),
				true
			)
		) {
			return false;
		}

		$current = Jetpack_Plan::get();

		$to_deactivate = array();
		if ( isset( $current['product_slug'] ) ) {
			$active = Jetpack::get_active_modules();
			switch ( $current['product_slug'] ) {
				case 'jetpack_free':
				case 'jetpack_personal':
				case 'jetpack_personal_monthly':
					$to_deactivate = array( 'google-analytics', 'wordads', 'search' );
					break;
				case 'jetpack_premium':
				case 'jetpack_premium_monthly':
					$to_deactivate = array( 'google-analytics', 'search' );
					break;
			}
			$to_deactivate = array_intersect( $active, $to_deactivate );

			$to_leave_enabled = array();
			foreach ( $to_deactivate as $feature ) {
				if ( Jetpack_Plan::supports( $feature ) ) {
					$to_leave_enabled [] = $feature;
				}
			}
			$to_deactivate = array_diff( $to_deactivate, $to_leave_enabled );

			if ( ! empty( $to_deactivate ) ) {
				Jetpack::update_active_modules( array_filter( array_diff( $active, $to_deactivate ) ) );
			}
		}
		return array(
			'current'    => $current,
			'deactivate' => $to_deactivate,
		);
	}

	/**
	 * Enqueue inline wrapper styles for the main container.
	 */
	public static function load_wrapper_styles() {
		$rtl = is_rtl() ? '.rtl' : '';
		wp_enqueue_style( 'dops-css', plugins_url( "_inc/build/admin{$rtl}.css", JETPACK__PLUGIN_FILE ), array(), JETPACK__VERSION );
		wp_enqueue_style( 'components-css', plugins_url( "_inc/build/style.min{$rtl}.css", JETPACK__PLUGIN_FILE ), array( 'wp-components' ), JETPACK__VERSION );
	}

	/**
	 * Build header, content, and footer for admin page.
	 *
	 * @param string $callback Callback to produce the content of the page. The callback is responsible for any needed escaping.
	 * @param array  $args Options for the wrapping. Also passed to the `jetpack_admin_pages_wrap_ui_after_callback` action.
	 *   - is-wide: (bool) Set the "is-wide" class on the wrapper div, which increases the max width. Default false.
	 *   - show-nav: (bool) Whether to show the navigation bar at the top of the page. Default true.
	 */
	public static function wrap_ui( $callback, $args = array() ) {
		$defaults = array(
			'is-wide'  => false,
			'show-nav' => true,
		);
		$args     = wp_parse_args( $args, $defaults );

		// Is Jetpack not connected and not offline?
		// True means that Jetpack is NOT connected and NOT in offline mode.
		// If Jetpack is connected OR in offline mode, this will be false.
		$connectable = ! Jetpack::is_connection_ready() && ! ( new Status() )->is_offline_mode();

		$jetpack_admin_url = admin_url( 'admin.php?page=jetpack' );
		$jetpack_about_url = ! $connectable
			? admin_url( 'admin.php?page=jetpack_about' )
			: Redirect::get_url( 'jetpack' );

		$jetpack_privacy_url = ! $connectable
			? $jetpack_admin_url . '#/privacy'
			: Redirect::get_url( 'a8c-privacy' );

		$external_link_icon = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" class="jp-footer__menu-item__icon" aria-hidden="true" focusable="false"><path d="M18.2 17c0 .7-.6 1.2-1.2 1.2H7c-.7 0-1.2-.6-1.2-1.2V7c0-.7.6-1.2 1.2-1.2h3.2V4.2H7C5.5 4.2 4.2 5.5 4.2 7v10c0 1.5 1.2 2.8 2.8 2.8h10c1.5 0 2.8-1.2 2.8-2.8v-3.6h-1.5V17zM14.9 3v1.5h3.7l-6.4 6.4 1.1 1.1 6.4-6.4v3.7h1.5V3h-6.3z"></path></svg>';

		?>
		<div id="jp-plugin-container" class="
		<?php
		if ( $args['is-wide'] ) {
			echo 'is-wide'; }
		?>
		">

			<div class="jp-masthead jp-masthead-middle">
				<div class="jp-masthead__inside-container">
					<div class="jp-masthead__logo-container">
						<a class="jp-masthead__logo-link" href="<?php echo esc_url( $jetpack_admin_url ); ?>">
							<svg class="jetpack-logo__masthead" xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" height="40" viewBox="0 0 118 32"><path fill="#069e08" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"></path><path d="M41.3,26.6c-0.5-0.7-0.9-1.4-1.3-2.1c2.3-1.4,3-2.5,3-4.6V8h-3V6h6v13.4C46,22.8,45,24.8,41.3,26.6z"></path><path d="M65,18.4c0,1.1,0.8,1.3,1.4,1.3c0.5,0,2-0.2,2.6-0.4v2.1c-0.9,0.3-2.5,0.5-3.7,0.5c-1.5,0-3.2-0.5-3.2-3.1V12H60v-2h2.1V7.1 H65V10h4v2h-4V18.4z"></path><path d="M71,10h3v1.3c1.1-0.8,1.9-1.3,3.3-1.3c2.5,0,4.5,1.8,4.5,5.6s-2.2,6.3-5.8,6.3c-0.9,0-1.3-0.1-2-0.3V28h-3V10z M76.5,12.3 c-0.8,0-1.6,0.4-2.5,1.2v5.9c0.6,0.1,0.9,0.2,1.8,0.2c2,0,3.2-1.3,3.2-3.9C79,13.4,78.1,12.3,76.5,12.3z"></path><path d="M93,22h-3v-1.5c-0.9,0.7-1.9,1.5-3.5,1.5c-1.5,0-3.1-1.1-3.1-3.2c0-2.9,2.5-3.4,4.2-3.7l2.4-0.3v-0.3c0-1.5-0.5-2.3-2-2.3 c-0.7,0-2.3,0.5-3.7,1.1L84,11c1.2-0.4,3-1,4.4-1c2.7,0,4.6,1.4,4.6,4.7L93,22z M90,16.4l-2.2,0.4c-0.7,0.1-1.4,0.5-1.4,1.6 c0,0.9,0.5,1.4,1.3,1.4s1.5-0.5,2.3-1V16.4z"></path><path d="M104.5,21.3c-1.1,0.4-2.2,0.6-3.5,0.6c-4.2,0-5.9-2.4-5.9-5.9c0-3.7,2.3-6,6.1-6c1.4,0,2.3,0.2,3.2,0.5V13 c-0.8-0.3-2-0.6-3.2-0.6c-1.7,0-3.2,0.9-3.2,3.6c0,2.9,1.5,3.8,3.3,3.8c0.9,0,1.9-0.2,3.2-0.7V21.3z"></path><path d="M110,15.2c0.2-0.3,0.2-0.8,3.8-5.2h3.7l-4.6,5.7l5,6.3h-3.7l-4.2-5.8V22h-3V6h3V15.2z"></path><path d="M58.5,21.3c-1.5,0.5-2.7,0.6-4.2,0.6c-3.6,0-5.8-1.8-5.8-6c0-3.1,1.9-5.9,5.5-5.9s4.9,2.5,4.9,4.9c0,0.8,0,1.5-0.1,2h-7.3 c0.1,2.5,1.5,2.8,3.6,2.8c1.1,0,2.2-0.3,3.4-0.7C58.5,19,58.5,21.3,58.5,21.3z M56,15c0-1.4-0.5-2.9-2-2.9c-1.4,0-2.3,1.3-2.4,2.9 C51.6,15,56,15,56,15z"></path></svg>
						</a>
					</div>
					<?php
					if ( $args['show-nav'] ) :
						?>
						<div class="jp-masthead__nav">
							<?php
							if ( is_network_admin() ) {
								$current_screen = get_current_screen();

								$highlight_current_sites    = ( 'toplevel_page_jetpack-network' === $current_screen->id ? 'is-primary' : '' );
								$highlight_current_settings = ( 'jetpack_page_jetpack-settings-network' === $current_screen->id ? 'is-primary' : '' );
								?>
								<span class="dops-button-group">
									<?php
									if ( current_user_can( 'jetpack_network_sites_page' ) ) {
										?>
										<a href="<?php echo esc_url( network_admin_url( 'admin.php?page=jetpack' ) ); ?>" type="button" class="<?php echo esc_attr( $highlight_current_sites ); ?> dops-button is-compact" title="<?php esc_html_e( "Manage your network's Jetpack Sites.", 'jetpack' ); ?>"><?php echo esc_html_x( 'Sites', 'Navigation item', 'jetpack' ); ?></a>
										<?php
									} if ( current_user_can( 'jetpack_network_settings_page' ) ) {
										?>
										<a href="<?php echo esc_url( network_admin_url( 'admin.php?page=jetpack-settings' ) ); ?>" type="button" class="<?php echo esc_attr( $highlight_current_settings ); ?> dops-button is-compact" title="<?php esc_html_e( "Manage your network's Jetpack Sites.", 'jetpack' ); ?>"><?php echo esc_html_x( 'Network Settings', 'Navigation item', 'jetpack' ); ?></a>
										<?php
									}
									?>
								</span>
							<?php } else { ?>
								<span class="dops-button-group">
									<a href="<?php echo esc_url( $jetpack_admin_url ); ?>" type="button" class="dops-button is-compact"><?php esc_html_e( 'Dashboard', 'jetpack' ); ?></a>
														<?php
														if ( current_user_can( 'jetpack_manage_modules' ) ) {
															?>
										<a href="<?php echo esc_url( $jetpack_admin_url . '#/settings' ); ?>" type="button" class="dops-button is-compact"><?php esc_html_e( 'Settings', 'jetpack' ); ?></a>
															<?php
														}
														?>
								</span>
							<?php } ?>
						</div>
					<?php endif; ?>
				</div>
			</div>
			<div class="wrap"><div id="jp-admin-notices" aria-live="polite"></div></div>
			<!-- START OF CALLBACK -->
			<?php
			ob_start();
			call_user_func( $callback );
			$callback_ui = ob_get_contents();
			ob_end_clean();
			echo $callback_ui;// phpcs:ignore WordPress.Security.EscapeOutput -- Callback is responsible for any needed escaping.
			?>
			<!-- END OF CALLBACK -->

			<div id="jp-stats-report-bottom">
				<div class="wrap">
					<?php
					/**
					 * Fires at the bottom of the Jetpack admin page template, after the dynamic content section.
					 *
					 * @since 10.0.0
					 *
					 * @param string $callback The callback sent to the Jetpack_Admin_Page::wrap_ui method.
					 * @param array  $args The arguments sent to the Jetpack_Admin_Page::wrap_ui method.
					 */
					do_action( 'jetpack_admin_pages_wrap_ui_after_callback', $callback, $args );
					?>
				</div>
			</div>

			<div class="jp-footer jp-footer--static">
				<div class="jp-footer__container">
					<div class="jp-footer__logo">
						<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" class="jetpack-logo jp-footer__jetpack-symbol" aria-labelledby="jetpack-logo-title" height="16" aria-label="<?php esc_html_e( 'Jetpack logo', 'jetpack' ); ?>">
							<desc id="jetpack-logo-title">
								<?php esc_html_e( 'Jetpack Logo', 'jetpack' ); ?>
							</desc>
							<path fill="#000" d="M16,0C7.2,0,0,7.2,0,16s7.2,16,16,16s16-7.2,16-16S24.8,0,16,0z M15,19H7l8-16V19z M17,29V13h8L17,29z"></path>
						</svg>
						<span class="jp-footer__module-name">
							<a href="<?php echo esc_url( Redirect::get_url( 'jetpack' ) ); ?>" target="_blank" rel="noopener noreferrer" aria-label="Jetpack 12.2-a.0">
								<?php esc_html_e( 'Jetpack', 'jetpack' ); ?>
							</a>
						</span>
					</div>
					<div class="jp-footer__menu">
						<a href="<?php echo esc_url( $jetpack_about_url ); ?>" title="<?php esc_attr__( 'About Jetpack', 'jetpack' ); ?>" class="jp-footer__menu-item">
							<?php echo esc_html__( 'About', 'jetpack' ); ?>
						</a>
						<a href="<?php echo esc_url( $jetpack_privacy_url ); ?>" rel="noopener noreferrer" title="<?php esc_html_e( "Automattic's Privacy Policy", 'jetpack' ); ?>" class="jp-footer__menu-item <?php echo ! $connectable ? 'is-external' : ''; ?> ?>" target="<?php echo ! $connectable ? '_blank' : '_self'; ?>">
							<?php echo esc_html_x( 'Privacy', 'Navigation item', 'jetpack' ); ?>
							<?php echo ! $connectable ? $external_link_icon : ''; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						</a>
						<a href="<?php echo esc_url( Redirect::get_url( 'wpcom-tos' ) ); ?>" target="_blank" rel="noopener noreferrer" title="<?php esc_html__( 'WordPress.com Terms of Service', 'jetpack' ); ?>" class="jp-footer__menu-item is-external">
							<?php echo esc_html_x( 'Terms', 'Navigation item', 'jetpack' ); ?>
							<?php echo $external_link_icon; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						</a>
						<a href="<?php echo esc_url( Redirect::get_url( 'jetpack' ) ); ?>" target="_blank" rel="noopener noreferrer" aria-label="Jetpack 12.2-a.0" class="jp-footer__menu-item is-external">
							Version <?php echo esc_html( JETPACK__VERSION ); ?>
							<?php echo $external_link_icon; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped ?>
						</a>
						<?php if ( is_multisite() && current_user_can( 'jetpack_network_sites_page' ) ) { ?>
							<a href="<?php echo esc_url( network_admin_url( 'admin.php?page=jetpack' ) ); ?>" title="<?php esc_html_e( "Manage your network's Jetpack Sites.", 'jetpack' ); ?>" class="jp-footer__menu-item"><?php echo esc_html_x( 'Network Sites', 'Navigation item', 'jetpack' ); ?></a>
						<?php } ?>
						<?php if ( is_multisite() && current_user_can( 'jetpack_network_settings_page' ) ) { ?>
							<a href="<?php echo esc_url( network_admin_url( 'admin.php?page=jetpack-settings' ) ); ?>" title="<?php esc_html_e( "Manage your network's Jetpack Sites.", 'jetpack' ); ?>" class="jp-footer__menu-item"><?php echo esc_html_x( 'Network Settings', 'Navigation item', 'jetpack' ); ?></a>
						<?php } ?>
						<?php if ( current_user_can( 'manage_options' ) ) { ?>
							<a href="<?php echo esc_url( admin_url( 'admin.php?page=jetpack_modules' ) ); ?>" title="<?php esc_html_e( 'Access the full list of Jetpack modules available on your site.', 'jetpack' ); ?>" class="jp-footer__menu-item"><?php echo esc_html_x( 'Modules', 'Navigation item', 'jetpack' ); ?></a>
							<a href="<?php echo esc_url( admin_url( 'admin.php?page=jetpack-debugger' ) ); ?>" title="<?php esc_html_e( "Test your site's compatibility with Jetpack.", 'jetpack' ); ?>" class="jp-footer__menu-item"><?php echo esc_html_x( 'Debug', 'Navigation item', 'jetpack' ); ?></a>
						<?php } ?>
					</div>
					<a class="jp-footer__a8c-logo" href="<?php echo esc_url( $jetpack_about_url ); ?>" aria-label="<?php echo esc_attr__( 'An Automattic Airline', 'jetpack' ); ?>">
						<svg role="img" x="0" y="0" viewBox="0 0 935 38.2" enable-background="new 0 0 935 38.2" aria-labelledby="jp-automattic-byline-logo-title" height="7" class="jp-automattic-byline-logo">
							<desc id="jp-automattic-byline-logo-title">
								<?php echo esc_attr__( 'An Automattic Airline', 'jetpack' ); ?>
							</desc>
							<path d="M317.1 38.2c-12.6 0-20.7-9.1-20.7-18.5v-1.2c0-9.6 8.2-18.5 20.7-18.5 12.6 0 20.8 8.9 20.8 18.5v1.2C337.9 29.1 329.7 38.2 317.1 38.2zM331.2 18.6c0-6.9-5-13-14.1-13s-14 6.1-14 13v0.9c0 6.9 5 13.1 14 13.1s14.1-6.2 14.1-13.1V18.6zM175 36.8l-4.7-8.8h-20.9l-4.5 8.8h-7L157 1.3h5.5L182 36.8H175zM159.7 8.2L152 23.1h15.7L159.7 8.2zM212.4 38.2c-12.7 0-18.7-6.9-18.7-16.2V1.3h6.6v20.9c0 6.6 4.3 10.5 12.5 10.5 8.4 0 11.9-3.9 11.9-10.5V1.3h6.7V22C231.4 30.8 225.8 38.2 212.4 38.2zM268.6 6.8v30h-6.7v-30h-15.5V1.3h37.7v5.5H268.6zM397.3 36.8V8.7l-1.8 3.1 -14.9 25h-3.3l-14.7-25 -1.8-3.1v28.1h-6.5V1.3h9.2l14 24.4 1.7 3 1.7-3 13.9-24.4h9.1v35.5H397.3zM454.4 36.8l-4.7-8.8h-20.9l-4.5 8.8h-7l19.2-35.5h5.5l19.5 35.5H454.4zM439.1 8.2l-7.7 14.9h15.7L439.1 8.2zM488.4 6.8v30h-6.7v-30h-15.5V1.3h37.7v5.5H488.4zM537.3 6.8v30h-6.7v-30h-15.5V1.3h37.7v5.5H537.3zM569.3 36.8V4.6c2.7 0 3.7-1.4 3.7-3.4h2.8v35.5L569.3 36.8 569.3 36.8zM628 11.3c-3.2-2.9-7.9-5.7-14.2-5.7 -9.5 0-14.8 6.5-14.8 13.3v0.7c0 6.7 5.4 13 15.3 13 5.9 0 10.8-2.8 13.9-5.7l4 4.2c-3.9 3.8-10.5 7.1-18.3 7.1 -13.4 0-21.6-8.7-21.6-18.3v-1.2c0-9.6 8.9-18.7 21.9-18.7 7.5 0 14.3 3.1 18 7.1L628 11.3zM321.5 12.4c1.2 0.8 1.5 2.4 0.8 3.6l-6.1 9.4c-0.8 1.2-2.4 1.6-3.6 0.8l0 0c-1.2-0.8-1.5-2.4-0.8-3.6l6.1-9.4C318.7 11.9 320.3 11.6 321.5 12.4L321.5 12.4z"></path><path d="M37.5 36.7l-4.7-8.9H11.7l-4.6 8.9H0L19.4 0.8H25l19.7 35.9H37.5zM22 7.8l-7.8 15.1h15.9L22 7.8zM82.8 36.7l-23.3-24 -2.3-2.5v26.6h-6.7v-36H57l22.6 24 2.3 2.6V0.8h6.7v35.9H82.8z"></path><path d="M719.9 37l-4.8-8.9H694l-4.6 8.9h-7.1l19.5-36h5.6l19.8 36H719.9zM704.4 8l-7.8 15.1h15.9L704.4 8zM733 37V1h6.8v36H733zM781 37c-1.8 0-2.6-2.5-2.9-5.8l-0.2-3.7c-0.2-3.6-1.7-5.1-8.4-5.1h-12.8V37H750V1h19.6c10.8 0 15.7 4.3 15.7 9.9 0 3.9-2 7.7-9 9 7 0.5 8.5 3.7 8.6 7.9l0.1 3c0.1 2.5 0.5 4.3 2.2 6.1V37H781zM778.5 11.8c0-2.6-2.1-5.1-7.9-5.1h-13.8v10.8h14.4c5 0 7.3-2.4 7.3-5.2V11.8zM794.8 37V1h6.8v30.4h28.2V37H794.8zM836.7 37V1h6.8v36H836.7zM886.2 37l-23.4-24.1 -2.3-2.5V37h-6.8V1h6.5l22.7 24.1 2.3 2.6V1h6.8v36H886.2zM902.3 37V1H935v5.6h-26v9.2h20v5.5h-20v10.1h26V37H902.3z"></path>
						</svg>
					</a>
				</div>
			</div>
		</div>
		<?php
	}
}
