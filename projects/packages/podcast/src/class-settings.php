<?php
/**
 * Registers the Jetpack Podcast admin page and enqueues the SPA.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Status\Host;

/**
 * Adds the Jetpack > Podcast wp-admin screen.
 *
 * On Simple and Atomic the canonical entry point is `wpcom-admin-menu.php`
 * (in the `jetpack-mu-wpcom` package), which calls `add_wp_admin_submenu()`
 * at priority 999999 — late enough that the Jetpack parent menu is already
 * registered. We do not register our own `admin_menu` hook here; doing so on
 * Atomic would race with the wpcom-admin-menu callback and duplicate the
 * "Podcasting" item that used to redirect to Calypso.
 */
class Settings {

	const MENU_SLUG = 'jetpack-podcast';

	/**
	 * Whether the admin-init hooks have been wired.
	 *
	 * @var bool
	 */
	private static $admin_init_wired = false;

	/**
	 * Init Podcast Settings.
	 *
	 * Currently a no-op kept for symmetry with the rest of the package — the
	 * actual menu registration happens via `add_wp_admin_submenu()`, called
	 * by `wpcom-admin-menu.php`.
	 */
	public static function init() {
		// Intentionally empty: see class docblock.
	}

	/**
	 * Register the Podcast submenu directly under the Jetpack menu.
	 *
	 * Called from wpcom-admin-menu.php at priority 999999 (Simple + Atomic)
	 * once the Jetpack menu is in place. The host gate happens earlier in
	 * `Podcast::init()` so by the time this runs we know we're on a host we
	 * support.
	 */
	public static function add_wp_admin_submenu() {
		$page_suffix = add_submenu_page(
			'jetpack',
			/** "Podcast" is a product name, do not translate. */
			'Podcast',
			'Podcast',
			'manage_options',
			self::MENU_SLUG,
			array( __CLASS__, 'render' )
		);

		if ( $page_suffix && ! self::$admin_init_wired ) {
			self::$admin_init_wired = true;
			add_action( 'load-' . $page_suffix, array( __CLASS__, 'admin_init' ) );
		}
	}

	/**
	 * Admin init actions. Triggered only when the Podcast page is being loaded.
	 */
	public static function admin_init() {
		add_filter( 'jetpack_admin_js_script_data', array( __CLASS__, 'add_script_data' ) );
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'load_admin_scripts' ) );
	}

	/**
	 * Inject podcast-specific data into the global JetpackScriptData object.
	 *
	 * @param array $data Existing script data.
	 * @return array
	 */
	public static function add_script_data( $data ) {
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
	 * `@wordpress/*` dependency our bundle pulls in, so the only manual entry
	 * we add here is `jetpack-script-data` (a Jetpack-specific dep webpack
	 * doesn't know to extract).
	 */
	public static function load_admin_scripts() {
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
	public static function render() {
		?>
		<div id="jetpack-podcast-root"></div>
		<?php
	}
}
