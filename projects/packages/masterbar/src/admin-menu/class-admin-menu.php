<?php
/**
 * Admin Menu file.
 *
 * @package automattic/jetpack-masterbar
 */

namespace Automattic\Jetpack\Masterbar;

use Automattic\Jetpack\Assets;

require_once __DIR__ . '/class-base-admin-menu.php';

/**
 * Class Admin_Menu.
 */
class Admin_Menu extends Base_Admin_Menu {

	/**
	 * Create the desired menu output.
	 */
	public function reregister_menu_items() {
		$this->add_upgrades_menu();
		$this->add_appearance_menu();
		$this->add_plugins_menu();
		$this->add_users_menu();

		// Remove Links Manager menu since its usage is discouraged. https://github.com/Automattic/wp-calypso/issues/51188.
		// @see https://core.trac.wordpress.org/ticket/21307#comment:73.
		if ( $this->should_disable_links_manager() ) {
			remove_menu_page( 'link-manager.php' );
		}

		ksort( $GLOBALS['menu'] );
	}

	/**
	 * Get the preferred view for the given screen.
	 *
	 * @param string $screen Screen identifier.
	 * @param bool   $fallback_global_preference (Optional) Whether the global preference for all screens should be used
	 *                                           as fallback if there is no specific preference for the given screen.
	 *                                           Default: true.
	 * @return string
	 */
	public function get_preferred_view( $screen, $fallback_global_preference = true ) {
		$force_default_view = in_array( $screen, array( 'users.php', 'options-general.php' ), true );
		$use_wp_admin       = $this->use_wp_admin_interface();

		// When no preferred view has been set for "Users > All Users" or "Settings > General", keep the previous
		// behavior that forced the default view regardless of the global preference.
		// This behavior is overriden by the wpcom_admin_interface option when it is set to wp-admin.
		if ( ! $use_wp_admin && $fallback_global_preference && $force_default_view ) {
			$preferred_view = parent::get_preferred_view( $screen, false );
			if ( self::UNKNOWN_VIEW === $preferred_view ) {
				return self::DEFAULT_VIEW;
			}
			return $preferred_view;
		}

		return parent::get_preferred_view( $screen, $fallback_global_preference );
	}

	/**
	 * Check if Links Manager is being used.
	 */
	public function should_disable_links_manager() {
		// The max ID number of the auto-generated links.
		// See /wp-content/mu-plugins/wpcom-wp-install-defaults.php in WP.com.
		$max_default_id = 10;

		// We are only checking the latest entry link_id so are limiting the query to 1.
		$link_manager_links = get_bookmarks(
			array(
				'orderby'        => 'link_id',
				'order'          => 'DESC',
				'limit'          => 1,
				'hide_invisible' => 0,
			)
		);

		// Ordered links by ID descending, check if the first ID is more than $max_default_id.
		if ( is_countable( $link_manager_links ) && count( $link_manager_links ) > 0 && $link_manager_links[0]->link_id > $max_default_id ) {
			return false;
		}

		return true;
	}

	/**
	 * Adds Upgrades menu.
	 *
	 * @param string $plan The current WPCOM plan of the blog.
	 */
	public function add_upgrades_menu( $plan = null ) {
		global $menu;

		$menu_exists = false;
		foreach ( $menu as $item ) {
			if ( 'paid-upgrades.php' === $item[2] ) {
				$menu_exists = true;
				break;
			}
		}

		if ( ! $menu_exists ) {
			if ( $plan ) {
				// Add display:none as a default for cases when CSS is not loaded.
				$site_upgrades = '%1$s<span class="inline-text" style="display:none">%2$s</span>';
				$site_upgrades = sprintf(
					$site_upgrades,
					__( 'Upgrades', 'jetpack-masterbar' ),
					// phpcs:ignore WordPress.WP.I18n.NonSingularStringLiteralText
					__( $plan, 'jetpack-masterbar' )
				);
			} else {
				$site_upgrades = __( 'Upgrades', 'jetpack-masterbar' );
			}
			// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
			add_menu_page( __( 'Upgrades', 'jetpack-masterbar' ), $site_upgrades, 'manage_options', 'paid-upgrades.php', null, 'dashicons-cart', 2.99 );
		}
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_submenu_page( 'paid-upgrades.php', __( 'Plans', 'jetpack-masterbar' ), __( 'Plans', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/plans/' . $this->domain, null, 1 );
		// @phan-suppress-next-line PhanTypeMismatchArgumentProbablyReal -- Core should ideally document null for no-callback arg. https://core.trac.wordpress.org/ticket/52539.
		add_submenu_page( 'paid-upgrades.php', __( 'Purchases', 'jetpack-masterbar' ), __( 'Purchases', 'jetpack-masterbar' ), 'manage_options', 'https://wordpress.com/purchases/subscriptions/' . $this->domain, null, 2 );

		if ( ! $menu_exists ) {
			// Remove the submenu auto-created by Core.
			$this->hide_submenu_page( 'paid-upgrades.php', 'paid-upgrades.php' );
		}
	}

	/**
	 * Adds Appearance menu.
	 *
	 * @return string The Customizer URL.
	 */
	public function add_appearance_menu() {
		$request_uri                     = isset( $_SERVER['REQUEST_URI'] ) ? esc_url_raw( wp_unslash( $_SERVER['REQUEST_URI'] ) ) : '';
		$default_customize_slug          = add_query_arg( 'return', rawurlencode( remove_query_arg( wp_removable_query_args(), $request_uri ) ), 'customize.php' );
		$default_customize_header_slug_1 = add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $default_customize_slug );
		// TODO: Remove WPCom_Theme_Customizer::modify_header_menu_links() and WPcom_Custom_Header::modify_admin_menu_links().
		$default_customize_header_slug_2     = admin_url( 'themes.php?page=custom-header' );
		$default_customize_background_slug_1 = add_query_arg( array( 'autofocus' => array( 'control' => 'background_image' ) ), $default_customize_slug );
		// TODO: Remove Colors_Manager::modify_header_menu_links() and Colors_Manager_Common::modify_header_menu_links().
		$default_customize_background_slug_2 = add_query_arg( array( 'autofocus' => array( 'section' => 'colors_manager_tool' ) ), admin_url( 'customize.php' ) );

		if ( $this->is_api_request ) {
			// In case this is an api request we will have to add the 'return' querystring via JS.
			$customize_url = 'customize.php';
		} else {
			$customize_url = $default_customize_slug;
		}

		$submenus_to_update = array(
			$default_customize_slug              => $customize_url,
			$default_customize_header_slug_1     => add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $customize_url ),
			$default_customize_header_slug_2     => add_query_arg( array( 'autofocus' => array( 'control' => 'header_image' ) ), $customize_url ),
			$default_customize_background_slug_1 => add_query_arg( array( 'autofocus' => array( 'section' => 'colors_manager_tool' ) ), $customize_url ),
			$default_customize_background_slug_2 => add_query_arg( array( 'autofocus' => array( 'section' => 'colors_manager_tool' ) ), $customize_url ),
		);

		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'themes.php' ) ) {
			$submenus_to_update['themes.php'] = 'https://wordpress.com/themes/' . $this->domain;
		}

		$this->update_submenus( 'themes.php', $submenus_to_update );

		$this->hide_submenu_page( 'themes.php', 'custom-header' );
		$this->hide_submenu_page( 'themes.php', 'custom-background' );

		return $customize_url;
	}

	/**
	 * Adds Plugins menu.
	 */
	public function add_plugins_menu() {
		if ( self::CLASSIC_VIEW === $this->get_preferred_view( 'plugins.php' ) ) {
			return;
		}
		$this->hide_submenu_page( 'plugins.php', 'plugin-install.php' );
		$this->hide_submenu_page( 'plugins.php', 'plugin-editor.php' );

		$this->update_menu( 'plugins.php', 'https://wordpress.com/plugins/' . $this->domain );
	}

	/**
	 * Adds Users menu.
	 */
	public function add_users_menu() {
		$submenus_to_update = array(
			'profile.php' => 'https://wordpress.com/me',
		);

		if ( self::DEFAULT_VIEW === $this->get_preferred_view( 'users.php' ) ) {
			$submenus_to_update['users.php']    = 'https://wordpress.com/people/team/' . $this->domain;
			$submenus_to_update['user-new.php'] = 'https://wordpress.com/people/new/' . $this->domain;
		}

		$slug = current_user_can( 'list_users' ) ? 'users.php' : 'profile.php';
		$this->update_submenus( $slug, $submenus_to_update );
	}

	/**
	 * AJAX handler for retrieving the upsell nudge.
	 */
	public function wp_ajax_upsell_nudge_jitm() {
		check_ajax_referer( 'upsell_nudge_jitm' );

		// Filter to turn off all just in time messages
		/** This action is already documented in \Automattic\Jetpack\JITMS\JITM */
		if ( ! apply_filters( 'jetpack_just_in_time_msgs', true ) ) {
			wp_die();
		}

		$nudge = $this->get_upsell_nudge();
		if ( ! $nudge ) {
			wp_die();
		}

		$link = $nudge['link'];
		if ( str_starts_with( $link, '/' ) ) {
			$link = 'https://wordpress.com' . $link;
		}
		?>
		<li class="wp-not-current-submenu menu-top menu-icon-generic toplevel_page_site-notices" id="toplevel_page_site-notices">
			<a href="<?php echo esc_url( $link ); ?>" class="wp-not-current-submenu menu-top menu-icon-generic toplevel_page_site-notices">
				<div class="wp-menu-arrow">
					<div></div>
				</div>
				<div class="wp-menu-image dashicons-before dashicons-admin-generic" aria-hidden="true"><br></div>
				<div class="wp-menu-name">
					<div class="upsell_banner">
						<div class="banner__info">
							<div class="banner__title">
								<?php echo wp_kses( $nudge['content'], array() ); ?>
							</div>
						</div>
						<div class="banner__action">
							<button type="button" class="button">
								<?php echo wp_kses( $nudge['cta'], array() ); ?>
							</button>
						</div>
						<?php if ( $nudge['dismissible'] ) : ?>
							<svg xmlns="http://www.w3.org/2000/svg" data-feature_class="<?php echo esc_attr( $nudge['feature_class'] ); ?>" data-feature_id="<?php echo esc_attr( $nudge['id'] ); ?>" viewBox="0 0 24 24" class="gridicon gridicons-cross dismissible-card__close-icon" height="24" width="24"><g><path d="M18.36 19.78L12 13.41l-6.36 6.37-1.42-1.42L10.59 12 4.22 5.64l1.42-1.42L12 10.59l6.36-6.36 1.41 1.41L13.41 12l6.36 6.36z"></path></g></svg>
						<?php endif; ?>
					</div>
				</div>
			</a>
		</li>
		<?php
		wp_die();
	}

	/**
	 * Fixes scrollbar issue if upsell nudge is loaded.
	 * https://github.com/Automattic/dotcom-forge/issues/7936
	 */
	public function wpcom_upsell_nudge_jitm_fix() {
		$assets_base_path = '../../dist/admin-menu/';
		Assets::register_script(
			'wpcom-upsell-nudge-jitm-fix',
			$assets_base_path . 'wpcom-upsell-nudge-jitm-fix.js',
			__FILE__,
			array(
				'enqueue' => true,
			)
		);
	}

	/**
	 * Returns the first available upsell nudge.
	 * Needs to be implemented separately for each child menu class.
	 * Empty by default.
	 *
	 * @return array
	 */
	public function get_upsell_nudge() {
		return array();
	}
}
