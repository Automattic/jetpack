<?php
/**
 * A class that adds a stats dashboard to wp-admin.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Initial_State as Connection_Initial_State;
use Automattic\Jetpack\Stats\Options as Stats_Options;

/**
 * Responsible for adding a stats dashboard to wp-admin.
 *
 * @package jetpack-stats-admin
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
	 * Init Stats dashboard.
	 */
	public static function init() {
		if ( ! self::$initialized ) {
			self::$initialized = true;
			( new self() )->init_hooks();
		}
	}

	/**
	 * Initialize the hooks.
	 */
	public function init_hooks() {
		self::$initialized = true;
		// Jetpack uses 998 and 'Admin_Menu' uses 1000.
		add_action( 'admin_menu', array( $this, 'add_wp_admin_menu' ), $this->menu_priority );
	}

	/**
	 * Add a "Stats" top-level admin menu.
	 *
	 * @return void
	 */
	public function add_wp_admin_menu() {
		/**
		 * Disable this menu for dashboard.wordpress.com because older versions of Jetpack need to fetch the old Stats UI.
		 *
		 * If this menu is registered, it will conflict with the back-end and break non-odyssey Stats.
		 */
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM && 120742 === get_current_blog_id() ) {
			return;
		}

		$page_suffix = add_menu_page(
			__( 'Stats', 'jetpack-stats-admin' ),
			_x( 'Stats', 'product name shown in menu', 'jetpack-stats-admin' ),
			$this->get_capability(),
			'stats',
			array( $this, 'render' ),
			'dashicons-chart-bar',
			2
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
		}
	}

	/**
	 * Capability a user needs to reach the dashboard.
	 *
	 * Until the site is connected the page exists to pick a plan and connect, which only a user
	 * who can manage the connection can act on. Once connected it is a reporting page, open to
	 * everyone allowed to view stats.
	 *
	 * Pre-connection that is `jetpack_connect`: it maps to `manage_options` on a normal site,
	 * but is `do_not_allow` in offline mode and honours the same multisite/filter rules as the
	 * register endpoint, so the menu is not offered where the connection cannot be completed.
	 *
	 * @return string
	 */
	protected function get_capability() {
		return Main::is_site_connected() ? 'view_stats' : 'jetpack_connect';
	}

	/**
	 * Override render funtion
	 */
	public function render() {
		// Record the number of views of the stats dashboard on the initial several loads for the
		// purpose of showing feedback notice. Views before the site is connected show the plan
		// choice rather than the dashboard, and there is nothing to give feedback on yet.
		$views = intval( Stats_Options::get_option( 'views' ) ) + 1;
		if ( $views <= Notices::VIEWS_TO_SHOW_FEEDBACK && Main::is_site_connected() ) {
			Stats_Options::set_option( 'views', $views );
		}

		?>
		<div id="wpcom" class="jp-stats-dashboard" style="min-height: calc(100vh - 100px);">
			<div class="hide-if-js"><?php esc_html_e( 'Your Jetpack Stats dashboard requires JavaScript to function properly.', 'jetpack-stats-admin' ); ?></div>
			<div class="hide-if-no-js" style="height: 100%">
				<img
					class="jp-stats-dashboard-loading-spinner"
					width="32"
					height="32"
					style="position: absolute; left: 50%; top: 50%;"
					alt=<?php echo esc_attr( __( 'Loading', 'jetpack-stats-admin' ) ); ?>
					src="//en.wordpress.com/i/loading/loading-64.gif"
				/>
			</div>
		</div>
		<?php
	}

	/**
	 * The dashboard bootstrap: load the icon sprite, and keep in-app links inside the dashboard.
	 *
	 * @return string
	 */
	private function get_bootstrap_script() {
		return <<<'JS'
jQuery(document).ready(function($) {
	// Load SVG sprite.
	$.get("https://widgets.wp.com/odyssey-stats/common/gridicons-506499ddac13811fee8e.svg", function(data) {
		var div = document.createElement("div");
		div.innerHTML = new XMLSerializer().serializeToString(data.documentElement);
		div.style = 'display: none';
		document.body.insertBefore(div, document.body.childNodes[0]);
	});
	// we intercept on all anchor tags and change it to hashbang style.
	$("#wpcom").on('click', 'a', function (e) {
		const link = e && e.currentTarget && e.currentTarget.attributes && e.currentTarget.attributes.href && e.currentTarget.attributes.href.value;
		if( link && link.startsWith( '/stats' ) ) {
			location.hash = `#!${link}`;
			return false;
		}
	});
});
JS;
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Load the admin scripts.
	 */
	public function load_admin_scripts() {
		( new Odyssey_Assets() )->load_admin_scripts( 'jp-stats-dashboard', 'build.min', array( 'config_variable_name' => 'jetpackStatsOdysseyAppConfigData' ) );

		// The bootstrap runs on jQuery, which the Odyssey bundle does not depend on. It gets its own
		// handle rather than jQuery being added to that bundle, which the dashboard widget shares
		// and which has no use for it.
		wp_register_script( 'jp-stats-dashboard-bootstrap', false, array( 'jquery' ), Main::VERSION, true );
		wp_enqueue_script( 'jp-stats-dashboard-bootstrap' );
		wp_add_inline_script( 'jp-stats-dashboard-bootstrap', $this->get_bootstrap_script() );

		// The app is served from our CDN and so cannot bundle the connection package. Print the
		// state Search and Protect print on their own pages, so it can read the connection status
		// and register the site through the connection REST API itself. Connected sites fetch
		// `jetpack/v4/connection` over REST instead, and must not receive registrationNonce and
		// the connected-plugin list on a page that `view_stats` users can open.
		if ( ! Main::is_site_connected() ) {
			Connection_Initial_State::render_script( 'jp-stats-dashboard' );
		}
	}
}
