<?php
/**
 * This file started from wp-content/mu-plugins/full-site-editing/class-theme-homepage-switcher.php in order to bring
 * theme homepage switch to Atomic.
 *
 * @package wpcomsh
 */

/**
 * This class performs the logic of homepage switch after theme activation.
 */
class Theme_Homepage_Switcher {

	/**
	 * Class instance.
	 *
	 * @var Theme_Homepage_Switcher
	 */
	private static $instance = null;

	/**
	 * Theme_Homepage_Switcher constructor.
	 */
	public function __construct() {
		add_action( 'plugins_loaded', array( $this, 'register_hooks' ) );
	}

	/**
	 * Creates instance.
	 *
	 * @return Theme_Homepage_Switcher
	 */
	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Registers hook.
	 */
	public function register_hooks() {
		if ( wpcom_is_nav_redesign_enabled() ) {
			return;
		}
		add_action( 'switch_theme', array( $this, 'switch_theme_homepage' ), 10, 3 );
	}

	/**
	 * Disables the hook when requested.
	 */
	public function disable_theme_homepage_switch() {
		remove_action( 'switch_theme', array( $this, 'switch_theme_homepage' ) );
	}

	/**
	 * Changes the front page settings after activating a new theme.
	 *
	 * @param string    $new_name  Name of the new theme.
	 * @param \WP_Theme $new_theme WP_Theme instance of the new theme.
	 * @param \WP_Theme $old_theme WP_Theme instance of the old theme.
	 */
	public function switch_theme_homepage( $new_name, $new_theme, $old_theme ) /* phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter */ {
		$tft = Template_First_Themes::get_instance();

		if ( $tft->has_auto_loading_homepage( $new_theme ) ) {
			return $tft->switch_homepage_to_static_page();
		}

		$this->switch_homepage_to_default_template();

		if ( $tft->has_auto_loading_homepage( $old_theme ) ) {
			$tft->clean_up_old_posts_page();
		}
	}

	/**
	 * Resets the front page settings to default.
	 */
	private function switch_homepage_to_default_template() {
		$this->update_static_home_page_to_draft();
		$this->update_static_home_page_menu_items_to_custom_link_to_root();
		$this->update_homepage_to_default_template();
	}

	/**
	 * Updates the old static home page to draft.
	 */
	private function update_static_home_page_to_draft() {
		$home_page_id = (int) get_option( 'page_on_front' );
		if ( $home_page_id ) {
			$home_page                = get_post( $home_page_id, ARRAY_A );
			$home_page['post_status'] = 'draft';
			wp_update_post( $home_page );
		}
	}

	/**
	 * Updates links to the old static home page to "/".
	 */
	private function update_static_home_page_menu_items_to_custom_link_to_root() {
		$home_page_id = (int) get_option( 'page_on_front' );
		foreach ( wp_get_nav_menus() as $menu ) {
			foreach ( wp_get_nav_menu_items( $menu ) as $menu_item ) {
				if ( (int) $menu_item->object_id === $home_page_id ) {
					wp_update_nav_menu_item(
						$menu->term_id,
						$menu_item->ID,
						array(
							'menu-item-title'  => __( 'Home' ), // phpcs:ignore WordPress.WP.I18n.MissingArgDomain
							'menu-item-url'    => '/',
							'menu-item-status' => 'publish',
							'menu-item-type'   => 'custom',
						)
					);
				}
			}
		}
	}

	/**
	 * Updates the "Your homepage displays" setting to Default.
	 */
	private function update_homepage_to_default_template() {
		update_option( 'show_on_front', 'posts' );
		delete_option( 'page_on_front' );
	}
}
