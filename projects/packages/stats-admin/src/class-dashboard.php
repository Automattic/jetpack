<?php
/**
 * A class that adds a stats dashboard to wp-admin.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Assets;
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
			'view_stats',
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
	 * Override render funtion
	 */
	public function render() {
		// Check if we should show the pricing grid for new installations without a plan.
		if ( $this->should_show_pricing_grid() ) {
			// Render pricing grid mount point.
			?>
			<div id="jp-stats-pricing-grid" class="jp-stats-pricing-grid">
				<div class="hide-if-js"><?php esc_html_e( 'The Jetpack Stats pricing grid requires JavaScript to function properly.', 'jetpack-stats-admin' ); ?></div>
			</div>
			<?php
		} else {
			// Record the number of views of the stats dashboard on the initial several loads for the purpose of showing feedback notice.
			$views = intval( Stats_Options::get_option( 'views' ) ) + 1;
			if ( $views <= Notices::VIEWS_TO_SHOW_FEEDBACK ) {
				Stats_Options::set_option( 'views', $views );
			}

			// Render Odyssey mount point.
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
			<script>
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
			</script>
			<?php
		}
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
		// Check if we should show the pricing grid for new installations without a plan.
		if ( $this->should_show_pricing_grid() ) {
			$this->load_pricing_grid_scripts();
		} else {
			( new Odyssey_Assets() )->load_admin_scripts( 'jp-stats-dashboard', 'build.min', array( 'config_variable_name' => 'jetpackStatsOdysseyAppConfigData' ) );
		}
	}

	/**
	 * Check if the pricing grid should be shown.
	 *
	 * @return bool True if the pricing grid should be shown.
	 */
	private function should_show_pricing_grid() {
		$eligibility_class = 'Automattic\\Jetpack\\Stats_Admin\\Pricing_Grid\\Eligibility';
		if ( class_exists( $eligibility_class ) ) {
			return call_user_func( array( $eligibility_class, 'should_show_pricing_grid' ) );
		}
		return false;
	}

	/**
	 * Load the pricing grid scripts and initial state.
	 */
	private function load_pricing_grid_scripts() {
		require_once __DIR__ . '/pricing-grid/class-initial-state.php';
		require_once __DIR__ . '/pricing-grid/class-eligibility.php';

		$handle = 'jp-stats-pricing-grid';

		// Register and enqueue the pricing grid bundle.
		$script_path = __DIR__ . '/../build/pricing-grid/jp-stats-pricing-grid.js';
		if ( ! file_exists( $script_path ) ) {
			// Fallback if build artifact doesn't exist.
			return;
		}

		Assets::register_script(
			$handle,
			'../../build/pricing-grid/jp-stats-pricing-grid.js',
			__FILE__,
			array(
				'in_footer'  => true,
				'textdomain' => 'jetpack-stats-admin',
			)
		);
		Assets::enqueue_script( $handle );

		// Inject the initial state before the bundle runs.
		$initial_state = new Pricing_Grid\Initial_State();
		wp_add_inline_script(
			$handle,
			$initial_state->render(),
			'before'
		);

		// Also inject the connection initial state.
		require_once JETPACK__PLUGIN_DIR . 'modules/connection/class-initial-state.php';
		\Jetpack\Initial_State::render_script( $handle );
	}
}
