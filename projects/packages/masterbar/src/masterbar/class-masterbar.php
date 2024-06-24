<?php
/**
 * Masterbar file.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Device_Detection\User_Agent_Info;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Scan\Admin_Bar_Notice;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;
use GP_Locale;
use GP_Locales;
use Jetpack_AMP_Support;
use WP_Admin_Bar;

/**
 * Provides custom admin bar instead of the default WordPress admin bar.
 */
class Masterbar {
	/**
	 * Use for testing changes made to remotely enqueued scripts and styles on your sandbox.
	 * If not set it will default to loading the ones from WordPress.com.
	 *
	 * @var string $sandbox_url
	 */
	private $sandbox_url = '';

	/**
	 * Current locale.
	 *
	 * @var string
	 */
	private $locale;

	/**
	 * WordPress.com user locale of the connected user.
	 *
	 * @var string
	 */
	private $user_locale;

	/**
	 * Current User ID.
	 *
	 * @var int
	 */
	private $user_id;
	/**
	 * WordPress.com user data of the connected user.
	 *
	 * @var array
	 */
	private $user_data;
	/**
	 * WordPress.com username for the connected user.
	 *
	 * @var string
	 */
	private $user_login;
	/**
	 * WordPress.com email address for the connected user.
	 *
	 * @var string
	 */
	private $user_email;
	/**
	 * WordPress.com display name for the connected user.
	 *
	 * @var string
	 */
	private $display_name;
	/**
	 * Site URL sanitized for usage in WordPress.com slugs.
	 *
	 * @var string
	 */
	private $primary_site_slug;
	/**
	 * Site URL displayed in the UI.
	 *
	 * @var string
	 */
	private $primary_site_url;
	/**
	 * Whether the text direction is RTL (based on connected WordPress.com user's interface settings).
	 *
	 * @var boolean
	 */
	private $is_rtl;
	/**
	 * Number of sites owned by connected WordPress.com user.
	 *
	 * @var int
	 */
	private $user_site_count;
	/**
	 * If the site is hosted on WordPress.com on Atomic
	 *
	 * @var bool
	 */
	private $site_woa;

	/**
	 * Constructor
	 */
	public function __construct() {
		$this->user_id      = get_current_user_id();
		$connection_manager = new Connection_Manager( 'jetpack' );

		if ( ! $connection_manager->is_user_connected( $this->user_id ) ) {
			return;
		}

		$this->user_data       = $connection_manager->get_connected_user_data( $this->user_id );
		$this->user_login      = $this->user_data['login'] ?? '';
		$this->user_email      = $this->user_data['email'] ?? '';
		$this->display_name    = $this->user_data['display_name'] ?? '';
		$this->user_site_count = $this->user_data['site_count'] ?? '';
		$this->is_rtl          = isset( $this->user_data['text_direction'] ) && 'rtl' === $this->user_data['text_direction'];
		$this->user_locale     = $this->user_data['user_locale'] ?? '';
		$this->site_woa        = ( new Host() )->is_woa_site();

		// Store part of the connected user data as user options so it can be used
		// by other files of the masterbar module without making another XMLRPC
		// request. Although `get_connected_user_data` tries to save the data for
		// future uses on a transient, the data is not guaranteed to be cached.
		update_user_option( $this->user_id, 'jetpack_wpcom_is_rtl', $this->is_rtl ? '1' : '0' );
		if ( isset( $this->user_data['use_wp_admin_links'] ) ) {
			update_user_option( $this->user_id, 'jetpack_admin_menu_link_destination', $this->user_data['use_wp_admin_links'] ? '1' : '0' );
		}
		// If Atomic, store and install user locale.
		if ( $this->site_woa && 'wp-admin' !== get_option( 'wpcom_admin_interface' ) ) {
			$this->user_locale = $this->get_jetpack_locale( $this->user_locale );
			$this->install_locale( $this->user_locale );
			$this->unload_non_default_textdomains_on_wpcom_user_locale_switch( $this->user_locale );
			update_user_option( $this->user_id, 'locale', $this->user_locale, true );
		}

		add_action( 'admin_bar_init', array( $this, 'init' ) );

		if ( ! empty( $this->user_data['ID'] ) ) {
			// Post logout on the site, also log the user out of WordPress.com.
			add_filter( 'logout_redirect', array( $this, 'maybe_logout_user_from_wpcom' ) );
		}
	}

	/**
	 * Initialize our masterbar.
	 */
	public function init() {
		$this->locale = $this->get_locale();

		// Don't show the masterbar on WordPress mobile apps.
		if ( User_Agent_Info::is_mobile_app() ) {
			add_filter( 'show_admin_bar', '__return_false' );
			return;
		}

		// Disable the Masterbar on AMP views.
		if (
			class_exists( 'Jetpack_AMP_Support' )
			&& Jetpack_AMP_Support::is_amp_available()
			&& Jetpack_AMP_Support::is_amp_request()
		) {
			return;
		}

		Assets::add_resource_hint(
			array(
				'//s0.wp.com',
				'//0.gravatar.com',
				'//1.gravatar.com',
				'//2.gravatar.com',
			),
			'dns-prefetch'
		);

		// WordPress.com on Atomic only.
		if ( $this->site_woa ) {
			/*
			 * override user setting that hides masterbar from site's front.
			 * https://github.com/Automattic/jetpack/issues/7667
			 */
			add_filter( 'show_admin_bar', '__return_true' );
		}

		// Used to build menu links that point directly to Calypso.
		$this->primary_site_slug = ( new Status() )->get_site_suffix();

		// Used for display purposes and for building WP Admin links.
		$this->primary_site_url = str_replace( '::', '/', $this->primary_site_slug );

		add_filter( 'admin_body_class', array( $this, 'admin_body_class' ) );

		add_action( 'wp_before_admin_bar_render', array( $this, 'replace_core_masterbar' ), 99999 );

		add_action( 'wp_enqueue_scripts', array( $this, 'add_styles_and_scripts' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'add_styles_and_scripts' ) );

		add_action( 'wp_enqueue_scripts', array( $this, 'remove_core_styles' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'remove_core_styles' ) );

		if ( ( new Modules() )->is_active( 'notes' ) && $this->is_rtl ) {
			// Override Notification module to include RTL styles.
			add_action( 'a8c_wpcom_masterbar_enqueue_rtl_notification_styles', '__return_true' );
		}

		// Hides and replaces the language dropdown for the current user, on WoA.
		if ( $this->site_woa &&
			'wp-admin' !== get_option( 'wpcom_admin_interface' ) &&
			defined( 'IS_PROFILE_PAGE' ) && IS_PROFILE_PAGE ) {
			add_action( 'user_edit_form_tag', array( $this, 'hide_language_dropdown' ) );
			add_action( 'personal_options', array( $this, 'replace_language_dropdown' ), 9 );
		}
	}

	/**
	 * Log out from WordPress.com when logging out of the local site.
	 *
	 * @param string $redirect_to The redirect destination URL.
	 */
	public function maybe_logout_user_from_wpcom( $redirect_to ) {
		/**
		 * Whether we should sign out from wpcom too when signing out from the masterbar.
		 *
		 * @since jetpack-5.9.0
		 *
		 * @param bool $masterbar_should_logout_from_wpcom True by default.
		 */
		$masterbar_should_logout_from_wpcom = apply_filters( 'jetpack_masterbar_should_logout_from_wpcom', true );
		if (
			// No need to check for a nonce here, it happens further up.
			isset( $_GET['context'] ) // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			&& 'masterbar' === $_GET['context'] // phpcs:ignore WordPress.Security.NonceVerification.Recommended
			&& $masterbar_should_logout_from_wpcom
		) {
			/**
			 * Hook into the log out event happening from the Masterbar.
			 *
			 * @since jetpack-5.1.0
			 * @since jetpack-7.9.0 Added the $wpcom_user_id parameter to the action.
			 *
			 * @module masterbar
			 *
			 * @param int $wpcom_user_id WordPress.com User ID.
			 */
			do_action( 'wp_masterbar_logout', $this->user_data['ID'] );
		}

		return $redirect_to;
	}

	/**
	 * Adds CSS classes to admin body tag.
	 *
	 * @since jetpack-5.1
	 *
	 * @param string $admin_body_classes CSS classes that will be added.
	 *
	 * @return string
	 */
	public function admin_body_class( $admin_body_classes ) {

		$classes = array( 'jetpack-masterbar', trim( $admin_body_classes ) );

		if ( get_option( 'wpcom_admin_interface' ) === 'wp-admin' ) {
			$classes[] = 'wpcom-admin-interface';
		}

		return implode( ' ', $classes );
	}

	/**
	 * Remove the default Admin Bar CSS.
	 */
	public function remove_core_styles() {
		/*
		 * Notifications need the admin bar styles,
		 * so let's not remove them when the module is active.
		 * Also, don't remove the styles if the user has opted to use wp-admin.
		 */
		if ( ! ( new Modules() )->is_active( 'notes' ) && get_option( 'wpcom_admin_interface' ) !== 'wp-admin' ) {
			wp_dequeue_style( 'admin-bar' );
		}
	}

	/**
	 * Enqueue our own CSS and JS to display our custom admin bar.
	 */
	public function add_styles_and_scripts() {
		$assets_base_path = '../../dist/masterbar/';

		// WoA sites: If wpcom_admin_interface is set to wp-admin, load the wp-admin styles.
		// These include only styles to enable the "My Sites" and "Reader" links that will be added.
		if ( get_option( 'wpcom_admin_interface' ) === 'wp-admin' ) {
			$css_file = $this->is_rtl ? 'masterbar-wp-admin-rtl.css' : 'masterbar-wp-admin.css';
			wp_enqueue_style( 'a8c-wpcom-masterbar-overrides', $this->wpcom_static_url( '/wp-content/mu-plugins/admin-bar/masterbar-overrides/' . $css_file ), array(), Main::PACKAGE_VERSION );
			return;
		}

		if ( $this->is_rtl ) {
			wp_enqueue_style( 'a8c-wpcom-masterbar-rtl', $this->wpcom_static_url( '/wp-content/mu-plugins/admin-bar/rtl/wpcom-admin-bar-rtl.css' ), array(), Main::PACKAGE_VERSION );
			wp_enqueue_style( 'a8c-wpcom-masterbar-overrides-rtl', $this->wpcom_static_url( '/wp-content/mu-plugins/admin-bar/masterbar-overrides/rtl/masterbar-rtl.css' ), array(), Main::PACKAGE_VERSION );
		} else {
			wp_enqueue_style( 'a8c-wpcom-masterbar', $this->wpcom_static_url( '/wp-content/mu-plugins/admin-bar/wpcom-admin-bar.css' ), array(), Main::PACKAGE_VERSION );
			wp_enqueue_style( 'a8c-wpcom-masterbar-overrides', $this->wpcom_static_url( '/wp-content/mu-plugins/admin-bar/masterbar-overrides/masterbar.css' ), array(), Main::PACKAGE_VERSION );
		}

		// Local overrides.
		Assets::register_script(
			'a8c_wpcom_css_override',
			$assets_base_path . 'overrides.js',
			__FILE__,
			array(
				'enqueue'  => true,
				'css_path' => $assets_base_path . 'overrides.css',
			)
		);

		if ( ! ( new Modules() )->is_active( 'notes' ) ) {
			// Masterbar is relying on some icons from noticons.css.
			wp_enqueue_style( 'noticons', $this->wpcom_static_url( '/i/noticons/noticons.css' ), array(), Main::PACKAGE_VERSION . '-' . gmdate( 'oW' ) );
		}

		wp_enqueue_script(
			'jetpack-accessible-focus',
			Assets::get_file_url_for_environment( '_inc/build/accessible-focus.min.js', '_inc/accessible-focus.js' ),
			array(),
			Main::PACKAGE_VERSION,
			false
		);
		Assets::register_script(
			'a8c_wpcom_masterbar_tracks_events',
			$assets_base_path . 'tracks-events.js',
			__FILE__,
			array(
				'enqueue' => true,
			)
		);

		wp_enqueue_script(
			'a8c_wpcom_masterbar_overrides',
			$this->wpcom_static_url( '/wp-content/mu-plugins/admin-bar/masterbar-overrides/masterbar.js' ),
			array( 'jquery' ),
			Main::PACKAGE_VERSION,
			false
		);
	}

	/**
	 * Get base URL where our CSS and JS will come from.
	 *
	 * @param string $file File path for a static resource.
	 */
	private function wpcom_static_url( $file ) {
		if ( ! empty( $this->sandbox_url ) ) {
			// For testing undeployed changes to remotely enqueued scripts and styles.
			return set_url_scheme( $this->sandbox_url . $file, 'https' );
		}

		$url = 'https://s0.wp.com' . $file;

		return set_url_scheme( $url, 'https' );
	}

	/**
	 * Remove the default admin bar items and replace it with our own admin bar.
	 */
	public function replace_core_masterbar() {
		global $wp_admin_bar;

		if ( ! is_object( $wp_admin_bar ) ) {
			return false;
		}

		if ( get_option( 'wpcom_admin_interface' ) === 'wp-admin' ) {
			$this->build_wp_admin_interface_bar( $wp_admin_bar );
			return;
		}

		$this->clear_core_masterbar( $wp_admin_bar );
		$this->build_wpcom_masterbar( $wp_admin_bar );
	}

	/**
	 * This reorganizes the original wp admin bar for when an atomic site
	 * has the wpcom_admin_interface set to wp-admin.
	 *
	 * The wpcom_admin_interface = wp-admin setting indicates that the users wishes
	 * to NOT use the wpcom master bar. We do need to adjust a couple of things
	 * though.
	 *
	 * @param WP_Admin_Bar $bar The admin bar object.
	 *
	 * @return void
	 */
	protected function build_wp_admin_interface_bar( $bar ) {

		$nodes = array();

		// First, lets gather all nodes and remove them.
		foreach ( $bar->get_nodes() as $node ) {
			$nodes[ $node->id ] = $node;
			$bar->remove_node( $node->id );
		}

		// This disables a submenu from being placed under the My Sites button.
		add_filter( 'jetpack_load_admin_menu_class', '__return_true' );

		// Here we add the My sites and Reader buttons
		$this->wpcom_adminbar_add_secondary_groups( $bar );
		$this->add_my_sites_submenu( $bar );
		$this->add_reader_submenu( $bar );

		foreach ( $nodes as $id => $node ) {

			$bar->add_node( $node );
			// Add our custom node and change the title of the edit profile node.
			if ( 'edit-profile' === $id ) {
				$this->add_wpcom_profile_link( $bar );
				$bar->add_node(
					array(
						'id'    => 'edit-profile',
						'title' => __( 'Site Profile', 'jetpack-masterbar' ),
					)
				);
			}
		}

		// Add a menu item to the user menu
		// Add a custom link to the user menu.
		$this->add_wpcom_profile_link( $bar );

		// Remove some things
		$bar->remove_node( 'wp-logo' );
	}

	/**
	 * Add a link to the user` profile on WordPress.com
	 *
	 * @param WP_Admin_Bar $bar The admin bar object.
	 *
	 * @return void
	 */
	protected function add_wpcom_profile_link( $bar ) {
		$custom_node = array(
			'parent' => 'user-actions',
			'id'     => 'wpcom-profile-link',
			'title'  => __( 'WordPress.com Profile', 'jetpack-masterbar' ),
			'href'   => 'https://wordpress.com/me',
			'meta'   => array(
				'title' => __( 'Go to your profile page on WordPress.com', 'jetpack-masterbar' ), // Optional, tooltip text.
			),
		);

		$bar->add_node( $custom_node );
	}

	/**
	 * Remove all existing toolbar entries from core Masterbar
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function clear_core_masterbar( $wp_admin_bar ) {
		foreach ( $wp_admin_bar->get_nodes() as $node ) {
			$wp_admin_bar->remove_node( $node->id );
		}
	}

	/**
	 * Add entries corresponding to WordPress.com Masterbar
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function build_wpcom_masterbar( $wp_admin_bar ) {
		// Menu groups.
		$this->wpcom_adminbar_add_secondary_groups( $wp_admin_bar );

		// Left part.
		$this->add_my_sites_submenu( $wp_admin_bar );
		$this->add_reader_submenu( $wp_admin_bar );

		// Right part.
		if ( ( new Modules() )->is_active( 'notes' ) && ! \Jetpack_Notifications::is_block_editor() ) {
			$this->add_notifications( $wp_admin_bar );
		}

		$this->add_me_submenu( $wp_admin_bar );
		$this->add_write_button( $wp_admin_bar );

		// Recovery mode exit.
		wp_admin_bar_recovery_mode_menu( $wp_admin_bar );

		if ( class_exists( 'Automattic\Jetpack\Scan\Admin_Bar_Notice' ) ) {
			$scan_admin_bar_notice = Admin_Bar_Notice::instance();
			$scan_admin_bar_notice->add_threats_to_toolbar( $wp_admin_bar );
		}
	}

	/**
	 * Get WordPress.com current locale name.
	 */
	public function get_locale() {
		$wpcom_locale = get_locale();

		if ( ! class_exists( 'GP_Locales' ) ) {
			// @phan-suppress-next-line PhanTypeMismatchArgumentNullableInternal -- See https://github.com/Automattic/jetpack/issues/2707#issuecomment-2036701663
			if ( defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) && file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
				require JETPACK__GLOTPRESS_LOCALES_PATH;
			}
		}

		if ( class_exists( 'GP_Locales' ) ) {
			$wpcom_locale_object = GP_Locales::by_field( 'wp_locale', get_locale() );
			if ( $wpcom_locale_object instanceof GP_Locale ) {
				$wpcom_locale = $wpcom_locale_object->slug;
			}
		}

		return $wpcom_locale;
	}

	/**
	 * Get Jetpack locale name.
	 *
	 * @param  string $slug Locale slug.
	 * @return string Jetpack locale.
	 */
	public function get_jetpack_locale( $slug = '' ) {
		if ( ! class_exists( 'GP_Locales' ) ) {
			// @phan-suppress-next-line PhanTypeMismatchArgumentNullableInternal -- See https://github.com/Automattic/jetpack/issues/2707#issuecomment-2036701663
			if ( defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) && file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
				require JETPACK__GLOTPRESS_LOCALES_PATH;
			}
		}

		if ( class_exists( 'GP_Locales' ) ) {
			$jetpack_locale_object = GP_Locales::by_field( 'slug', $slug );
			if ( $jetpack_locale_object instanceof GP_Locale ) {
				$jetpack_locale = $jetpack_locale_object->wp_locale ? $jetpack_locale_object->wp_locale : 'en_US';
			}
		}

		if ( isset( $jetpack_locale ) ) {
			return $jetpack_locale;
		}

		return 'en_US';
	}

	/**
	 * Install locale if not yet available.
	 *
	 * @param string $locale The new locale slug.
	 */
	public function install_locale( $locale = '' ) {
		if ( ! in_array( $locale, get_available_languages(), true )
			&& ! empty( $locale ) && current_user_can( 'install_languages' ) ) {

			if ( ! function_exists( 'wp_download_language_pack' ) ) {
				require_once ABSPATH . 'wp-admin/includes/translation-install.php';
			}

			if ( ! function_exists( 'request_filesystem_credentials' ) ) {
				require_once ABSPATH . 'wp-admin/includes/file.php';
			}

			if ( wp_can_install_language_pack() ) {
				wp_download_language_pack( $locale );
				load_default_textdomain( $locale );
			}
		}
	}

	/**
	 * Trigger reloading of all non-default textdomains if the user just changed
	 * their locale on WordPress.com.
	 *
	 * User locale changes on WordPress.com are detected and acted upon in the
	 * constructor of this class. However, at that point, some plugins and their
	 * translations have already been loaded (including Jetpack's). If we don't
	 * reload the translations, the user will see a mix of the old and new locale's
	 * translations until the next page load.
	 *
	 * The default textdomain is not affected by this because it's always reloaded
	 * after all plugins have been loaded, in wp-settings.php.
	 *
	 * @param string $wpcom_locale The user's detected WordPress.com locale.
	 */
	public function unload_non_default_textdomains_on_wpcom_user_locale_switch( $wpcom_locale ) {
		$user_switched_locale = get_user_locale() !== $wpcom_locale;
		if ( ! $user_switched_locale ) {
			return;
		}

		global $l10n;
		$loaded_textdomains      = array_keys( $l10n );
		$non_default_textdomains = array_diff( $loaded_textdomains, array( 'default' ) );
		foreach ( $non_default_textdomains as $textdomain ) {
			// Using $reloadable = true makes sure the correct locale's
			// translations are loaded just-in-time.
			unload_textdomain( $textdomain, true );
		}
	}

	/**
	 * Hide language dropdown on user edit form.
	 */
	public function hide_language_dropdown() {
		add_filter( 'get_available_languages', '__return_empty_array' );
	}

	/**
	 * Replace language dropdown with link to WordPress.com.
	 */
	public function replace_language_dropdown() {
		$language_row  = printf( '<tr class="user-language-wrap"><th scope="row">' );
		$language_row .= printf(
			'<label for="locale">%1$s<span class="dashicons dashicons-translation" aria-hidden="true"></span></label>',
			esc_html__( 'Language', 'jetpack-masterbar' )
		);
		$language_row .= printf( '</th><td>' );
		$language_row .= printf(
			'<a target="_blank" href="%1$s">%2$s</a>',
			esc_url( 'https://wordpress.com/me/account' ),
			esc_html__( 'Set your profile language on WordPress.com.', 'jetpack-masterbar' )
		);
		$language_row .= printf( '</td></tr>' );
		return $language_row;
	}

	/**
	 * Add the Notifications menu item.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function add_notifications( $wp_admin_bar ) {
		$wp_admin_bar->add_node(
			array(
				'id'     => 'notes',
				'title'  => '<span id="wpnt-notes-unread-count" class="wpnt-loading wpn-read"></span>
						 <span class="screen-reader-text">' . esc_html__( 'Notifications', 'jetpack-masterbar' ) . '</span>
						 <span class="noticon noticon-bell"></span>',
				'meta'   => array(
					'html'  => '<div id="wpnt-notes-panel2" style="display:none" lang="' . esc_attr( $this->locale ) . '" dir="' . ( $this->is_rtl ? 'rtl' : 'ltr' ) . '">' .
								'<div class="wpnt-notes-panel-header">' .
								'<span class="wpnt-notes-header">' .
								esc_html__( 'Notifications', 'jetpack-masterbar' ) .
								'</span>' .
								'<span class="wpnt-notes-panel-link">' .
								'</span>' .
								'</div>' .
								'</div>',
					'class' => 'menupop mb-trackable',
				),
				'parent' => 'top-secondary',
				'href'   => 'https://wordpress.com/notifications',
			)
		);
	}

	/**
	 * Add the "Reader" menu item in the root default group.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function add_reader_submenu( $wp_admin_bar ) {
		$wp_admin_bar->add_menu(
			array(
				'parent' => 'root-default',
				'id'     => 'newdash',
				'title'  => esc_html__( 'Reader', 'jetpack-masterbar' ),
				'href'   => 'https://wordpress.com/read',
				'meta'   => array(
					'class' => 'mb-trackable',
				),
			)
		);
	}

	/**
	 * Merge 2 menu items together into 2 link tags.
	 *
	 * @param array $primary   Array of menu information.
	 * @param array $secondary Array of menu information.
	 */
	public function create_menu_item_pair( $primary, $secondary ) {
		$primary_class   = 'ab-item ab-primary mb-icon';
		$secondary_class = 'ab-secondary';

		$primary_anchor   = $this->create_menu_item_anchor( $primary_class, $primary['url'], $primary['label'], $primary['id'] );
		$secondary_anchor = $this->create_menu_item_anchor( $secondary_class, $secondary['url'], $secondary['label'], $secondary['id'] );

		return $primary_anchor . $secondary_anchor;
	}

	/**
	 * Create a link tag based on information about a menu item.
	 *
	 * @param string $class Menu item CSS class.
	 * @param string $url   URL you go to when clicking on the menu item.
	 * @param string $label Menu item title.
	 * @param string $id    Menu item slug.
	 */
	public function create_menu_item_anchor( $class, $url, $label, $id ) {
		return '<a href="' . $url . '" class="' . $class . '" id="' . $id . '">' . $label . '</a>';
	}

	/**
	 * Add Secondary groups for submenu items.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function wpcom_adminbar_add_secondary_groups( $wp_admin_bar ) {
		$wp_admin_bar->add_group(
			array(
				'id'   => 'root-default',
				'meta' => array(
					'class' => 'ab-top-menu',
				),
			)
		);

		$wp_admin_bar->add_group(
			array(
				'parent' => 'blog',
				'id'     => 'blog-secondary',
				'meta'   => array(
					'class' => 'ab-sub-secondary',
				),
			)
		);

		$wp_admin_bar->add_group(
			array(
				'id'   => 'top-secondary',
				'meta' => array(
					'class' => 'ab-top-secondary',
				),
			)
		);
	}

	/**
	 * Add User info menu item.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function add_me_submenu( $wp_admin_bar ) {
		$user_id = get_current_user_id();
		if ( empty( $user_id ) ) {
			return;
		}

		$avatar = get_avatar( $this->user_email, 32, 'mm', '', array( 'force_display' => true ) );
		$class  = empty( $avatar ) ? 'mb-trackable' : 'with-avatar mb-trackable';

		// Add the 'Me' menu.
		$wp_admin_bar->add_menu(
			array(
				'id'     => 'my-account',
				'parent' => 'top-secondary',
				'title'  => $avatar . '<span class="ab-text">' . esc_html__( 'Me', 'jetpack-masterbar' ) . '</span>',
				'href'   => 'https://wordpress.com/me',
				'meta'   => array(
					'class' => $class,
				),
			)
		);

		/** This filter is documented in modules/masterbar.php */
		if ( apply_filters( 'jetpack_load_admin_menu_class', false ) ) {
			return;
		}

		$id = 'user-actions';
		$wp_admin_bar->add_group(
			array(
				'parent' => 'my-account',
				'id'     => $id,
			)
		);

		$logout_url = wp_logout_url();
		$logout_url = add_query_arg( 'context', 'masterbar', $logout_url );

		$user_info  = get_avatar( $this->user_email, 128, 'mm', '', array( 'force_display' => true ) );
		$user_info .= '<span class="display-name">' . $this->display_name . '</span>';
		$user_info .= '<span class="username">' . $this->user_login . '</span>';

		$blog_id = Connection_Manager::get_site_id( true );

		$args = array();
		if ( $blog_id ) {
			$args['site'] = $blog_id;
		}

		$wp_admin_bar->add_menu(
			array(
				'parent' => $id,
				'id'     => 'user-info',
				'title'  => $user_info,
				'meta'   => array(
					'class'    => 'user-info user-info-item',
					'tabindex' => -1,
				),
			)
		);

		$wp_admin_bar->add_menu(
			array(
				'parent' => $id,
				'id'     => 'profile',
				'title'  => esc_html__( 'Profile', 'jetpack-masterbar' ),
				'href'   => Redirect::get_url( 'calypso-me', $args ),
				'meta'   => array(
					'class' => 'mb-icon',
				),
			)
		);

		$wp_admin_bar->add_menu(
			array(
				'parent' => $id,
				'id'     => 'logout',
				'title'  => esc_html__( 'Log Out', 'jetpack-masterbar' ),
				'href'   => $logout_url,
				'meta'   => array(
					'class' => 'mb-icon',
				),
			)
		);
	}

	/**
	 * Add Write Menu item.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function add_write_button( $wp_admin_bar ) {
		$current_user = wp_get_current_user();

		$posting_blog_id = get_current_blog_id();
		if ( ! is_user_member_of_blog( get_current_user_id(), get_current_blog_id() ) ) {
			$posting_blog_id = $current_user->primary_blog;
		}

		$user_can_post = current_user_can_for_blog( $posting_blog_id, 'publish_posts' );

		if ( ! $posting_blog_id || ! $user_can_post ) {
			return;
		}

		$wp_admin_bar->add_menu(
			array(
				'parent' => 'top-secondary',
				'id'     => 'ab-new-post',
				'href'   => admin_url( 'post-new.php' ),
				'title'  => '<span>' . esc_html__( 'Write', 'jetpack-masterbar' ) . '</span>',
				'meta'   => array(
					'class' => 'mb-trackable',
				),
			)
		);
	}

	/**
	 * Add the "My Site" menu item in the root default group.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 */
	public function add_my_sites_submenu( $wp_admin_bar ) {
		$blog_name = get_bloginfo( 'name' );
		if ( empty( $blog_name ) ) {
			$blog_name = $this->primary_site_slug;
		}

		if ( mb_strlen( $blog_name ) > 20 ) {
			$blog_name = mb_substr( html_entity_decode( $blog_name, ENT_QUOTES ), 0, 20 ) . '&hellip;';
		}

		$my_site_url = 'https://wordpress.com/sites/' . $this->primary_site_url;
		if ( 'wp-admin' === get_option( 'wpcom_admin_interface' ) ) {
			$my_site_url = 'https://wordpress.com/sites';
		}

		$wp_admin_bar->add_menu(
			array(
				'parent' => 'root-default',
				'id'     => 'blog',
				'href'   => $my_site_url,
				'meta'   => array(
					'class' => 'my-sites mb-trackable',
				),
			)
		);

		/** This filter is documented in modules/masterbar.php */
		if ( apply_filters( 'jetpack_load_admin_menu_class', false ) ) {
			return;
		}

		if ( current_user_can( 'manage_options' ) ) {
			// Restore dashboard menu toggle that is needed on mobile views.
			if ( is_admin() ) {
				$wp_admin_bar->add_menu(
					array(
						'id'    => 'menu-toggle',
						'title' => '<span class="ab-icon"></span><span class="screen-reader-text">' . esc_html__( 'Menu', 'jetpack-masterbar' ) . '</span>',
						'href'  => '#',
					)
				);
			}

			/**
			 * Fires when menu items are added to the masterbar "My Sites" menu.
			 *
			 * @since jetpack-5.4.0
			 */
			do_action( 'jetpack_masterbar' );
		}
	}

	/**
	 * Adds "My Home" submenu item to sites that are eligible.
	 *
	 * @param WP_Admin_Bar $wp_admin_bar Admin Bar instance.
	 * @return void
	 */
	private function add_my_home_submenu_item( &$wp_admin_bar ) {
		if ( ! current_user_can( 'manage_options' ) || ! $this->site_woa ) {
			return;
		}

		$wp_admin_bar->add_menu(
			array(
				'parent' => 'blog',
				'id'     => 'my-home',
				'title'  => __( 'My Home', 'jetpack-masterbar' ),
				'href'   => Redirect::get_url( 'calypso-home' ),
				'meta'   => array(
					'class' => 'mb-icon',
				),
			)
		);
	}
}
