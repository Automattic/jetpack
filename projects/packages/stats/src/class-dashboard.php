<?php
/**
 * A class that adds a stats dashboard to wp-admin.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Stats;

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Assets;

/**
 * Responsible for adding a stats dashboard to wp-admin.
 *
 * @package jetpack-stats
 */
class Dashboard {
	/**
	 * Whether the class has been initialized
	 *
	 * @var boolean
	 */
	private static $initialized = false;

	/**
	 * Priority for the dashboard menu
	 * For Jetpack sites: Jetpack uses 998 and 'Admin_Menu' uses 1000, so we need to use 999.
	 * For simple site: the value is overriden in a child class with value 100000 to wait for all menus to be registered.
	 *
	 * @var int
	 */
	protected $menu_priority = 999;

	/**
	 * Initialize the hooks.
	 */
	public function init_hooks() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			// Jetpack uses 998 and 'Admin_Menu' uses 1000.
			add_action( 'admin_menu', array( $this, 'add_wp_admin_submenu' ), $this->menu_priority );
		}
	}

	/**
	 * The page to be added to submenu
	 */
	public function add_wp_admin_submenu() {
		$page_suffix = Admin_Menu::add_menu(
			__( 'Stats App', 'jetpack-stats' ),
			_x( 'Stats App', 'product name shown in menu', 'jetpack-stats' ),
			'manage_options',
			'jetpack-stats-app',
			array( $this, 'render' ),
			100
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
		}
	}

	/**
	 * Override render funtion
	 */
	public function render() {
		?>
		<div id="jp-stats-dashboard" class="jp-stats-dashboard">
			<div class="hide-if-js"><?php esc_html_e( 'Your Jetpack Stats dashboard requires JavaScript to function properly.', 'jetpack-stats' ); ?></div>
		</div>
		<?php
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Enqueue admin scripts.
	 */
	public function load_admin_scripts() {
		Assets::register_script(
			'jp-stats-dashboard',
			'../dist/build.min.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-stats',
			)
		);
		Assets::enqueue_script( 'jp-stats-dashboard' );

		// Add objects to be passed to the initial state of the app.
		// Use wp_add_inline_script instead of wp_localize_script, see https://core.trac.wordpress.org/ticket/25280.
		wp_add_inline_script(
			'jp-stats-dashboard',
			static::initial_state(),
			'before'
		);
	}

	/**
	 * Return the initial state of the app.
	 */
	public static function initial_state() {
		return 'window.configData = ' . wp_json_encode(
			array(
				'site_name'                => 'whatever',
				'env_id'                   => 'jetpack-stats-app',
				'i18n_default_locale_slug' => 'en',
				'google_analytics_key'     => 'UA-10673494-15',
				'client_slug'              => 'browser',
				'twemoji_cdn_url'          => 'https://s0.wp.com/wp-content/mu-plugins/wpcom-smileys/twemoji/2/',
				'site_filter'              => array(),
				'sections'                 => array(),
				'enable_all_sections'      => false,
				'livechat_support_locales' => array( 'en' ),
				'upwork_support_locales'   => array( 'de' ),
				'jetpack_support_blog'     => 'jetpackme.wordpress.com',
				'wpcom_support_blog'       => 'en.support.wordpress.com',
				'mc_analytics_enabled'     => false,
				'gutenboarding_url'        => '/new',
				'hostname'                 => false,
				'restricted_me_access'     => true,
				'signup_url'               => false,
				'features'                 => array(),
				'api_root'                 => esc_url_raw( rest_url() ),
				'nonce'                    => wp_create_nonce( 'wp_rest' ),
				'meta'                     => array(
					'property' => 'og:site_name',
					'content'  => 'WordPress.com',
				),
			)
		);
	}

}
