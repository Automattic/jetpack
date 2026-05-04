<?php
/**
 * Registers the Jetpack Podcast admin page and enqueues the SPA.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Status\Host;

/**
 * Adds the Jetpack > Podcast wp-admin screen.
 */
class Settings {

	const MENU_SLUG = 'jetpack-podcast';

	/**
	 * Whether the class has been initialized.
	 *
	 * @var bool
	 */
	private static $initialized = false;

	/**
	 * Init Podcast Settings if it wasn't already.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}
		self::$initialized = true;
		( new self() )->init_hooks();
	}

	/**
	 * Subscribe to necessary hooks.
	 */
	public function init_hooks() {
		$host = new Host();

		// On wpcom Simple, the Jetpack menu is created at priority 999999 by wpcom-admin-menu.php.
		// Mirror the Newsletter pattern: skip here and let wpcom-admin-menu call add_wp_admin_submenu().
		if ( $host->is_wpcom_simple() ) {
			return;
		}

		// Priority 999 so we register before Admin_Menu::admin_menu_hook_callback runs at 1000.
		add_action( 'admin_menu', array( $this, 'add_wp_admin_menu' ), 999 );
	}

	/**
	 * Register the Podcast submenu under the Jetpack menu (Atomic / standalone Jetpack path).
	 *
	 * Not called on Simple sites — see add_wp_admin_submenu().
	 */
	public function add_wp_admin_menu() {
		$host = new Host();

		// Atomic uses native add_submenu_page so the menu nests under the wpcom-managed Jetpack menu.
		if ( $host->is_woa_site() ) {
			$page_suffix = add_submenu_page(
				'jetpack',
				/** "Podcast" is a product name, do not translate. */
				'Podcast',
				'Podcast',
				'manage_options',
				self::MENU_SLUG,
				array( $this, 'render' )
			);
		} else {
			$page_suffix = Admin_Menu::add_menu(
				/** "Podcast" is a product name, do not translate. */
				'Podcast',
				'Podcast',
				'manage_options',
				self::MENU_SLUG,
				array( $this, 'render' ),
				12
			);
		}

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
		}
	}

	/**
	 * Add the Podcast submenu directly under the Jetpack menu on Simple sites.
	 *
	 * Called from wpcom-admin-menu.php at priority 999999 once the Jetpack menu exists.
	 */
	public function add_wp_admin_submenu() {
		$page_suffix = add_submenu_page(
			'jetpack',
			/** "Podcast" is a product name, do not translate. */
			'Podcast',
			'Podcast',
			'manage_options',
			self::MENU_SLUG,
			array( $this, 'render' )
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
		}
	}

	/**
	 * Admin init actions. Triggered only when the Podcast page is being loaded.
	 */
	public function admin_init() {
		add_filter( 'jetpack_admin_js_script_data', array( $this, 'add_script_data' ) );
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Inject podcast-specific data into the global JetpackScriptData object.
	 *
	 * @param array $data Existing script data.
	 * @return array
	 */
	public function add_script_data( $data ) {
		$current_user = wp_get_current_user();
		$host         = new Host();
		$blog_id      = (int) $host->get_wpcom_site_id();
		$category_id  = Podcast::get_category_id();
		$feed_url     = $category_id ? get_term_feed_link( $category_id, 'category', 'rss2' ) : '';

		$data['site']['wpcom']['blog_id'] = $blog_id;

		$data['podcast'] = array(
			'categoryId'      => $category_id ? (int) $category_id : 0,
			'feedUrl'         => $feed_url ? $feed_url : '',
			'siteUrl'         => get_site_url(),
			'adminUrl'        => admin_url(),
			'editPostUrlBase' => admin_url( 'post.php?action=edit&post=' ),
			'newPostUrl'      => admin_url( 'post-new.php' ),
			'mediaLibraryUrl' => admin_url( 'upload.php' ),
			'userEmail'       => $current_user->user_email,
			'dateFormat'      => (string) get_option( 'date_format', 'F j, Y' ),
		);

		return $data;
	}

	/**
	 * Enqueue the podcast SPA bundle.
	 *
	 * The asset.php manifest emitted by webpack already declares every
	 *
	 * @wordpress/* dependency our bundle pulls in, so the only manual entry
	 * we add here is `jetpack-script-data` (a Jetpack-specific dep webpack
	 * doesn't know to extract).
	 */
	public function load_admin_scripts() {
		Assets::register_script(
			'jetpack-podcast',
			'../build/podcast.js',
			__FILE__,
			array(
				'in_footer'    => true,
				'textdomain'   => 'jetpack-podcast',
				'enqueue'      => true,
				'dependencies' => array( 'jetpack-script-data' ),
			)
		);
	}

	/**
	 * Render the Podcast SPA mount point.
	 */
	public function render() {
		?>
		<div id="jetpack-podcast-root"></div>
		<?php
	}
}
