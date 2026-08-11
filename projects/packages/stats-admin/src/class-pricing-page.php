<?php
/**
 * The Stats pricing screen shown before a site is connected to WordPress.com.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

/**
 * Registers and renders the pre-connection Stats pricing screen.
 *
 * The screen runs the Odyssey `pricing` bundle rather than the dashboard bundle. A site
 * with no connection has no blog ID and no WordPress.com token, so the dashboard cannot
 * boot; the pricing screen asks the visitor to choose a plan, and the connection follows
 * from that choice.
 */
class Pricing_Page {
	/**
	 * Admin page slug.
	 *
	 * Deliberately the same slug `Dashboard` uses, so a site keeps one Stats menu entry and
	 * one bookmarkable URL whichever of the two screens it qualifies for.
	 */
	const PAGE_SLUG = 'stats';

	/**
	 * My Jetpack's admin page slug.
	 *
	 * Landing on this page with no connection makes My Jetpack redirect to its own
	 * onboarding step, which is where the free plan sends the visitor.
	 */
	const MY_JETPACK_PAGE_SLUG = 'my-jetpack';

	/**
	 * Script handle for the Odyssey pricing bundle.
	 */
	const ASSET_HANDLE = 'jp-stats-pricing';

	/**
	 * DOM id the Odyssey pricing app mounts on.
	 */
	const MOUNT_ID = 'jp-stats-pricing';

	/**
	 * Records that a visitor chose a plan on this screen.
	 *
	 * Read once the site connects, to keep the connected dashboard from opening with its own
	 * pricing grid and asking the same question a second time. A site connected by any other
	 * route never sets this, so it still gets that grid.
	 */
	const CHOICE_OPTION = 'jetpack_stats_pricing_choice_recorded';

	/**
	 * Whether the class has been initialized.
	 *
	 * @var boolean
	 */
	private static $initialized = false;

	/**
	 * Init the pricing screen.
	 */
	public static function init() {
		if ( self::$initialized ) {
			return;
		}

		self::$initialized = true;
		( new self() )->init_hooks();
	}

	/**
	 * Initialize the hooks.
	 */
	public function init_hooks() {
		// The Jetpack plugin uses 998 and `Admin_Menu` uses 1000, matching `Dashboard`.
		add_action( 'admin_menu', array( $this, 'add_wp_admin_menu' ), 999 );
		add_action( 'rest_api_init', array( $this, 'register_rest_routes' ) );
	}

	/**
	 * Add a "Stats" top-level admin menu.
	 *
	 * @return void
	 */
	public function add_wp_admin_menu() {
		$page_suffix = add_menu_page(
			__( 'Stats', 'jetpack-stats-admin' ),
			_x( 'Stats', 'product name shown in menu', 'jetpack-stats-admin' ),
			'view_stats',
			self::PAGE_SLUG,
			array( $this, 'render' ),
			'dashicons-chart-bar',
			2
		);

		if ( $page_suffix ) {
			add_action( 'load-' . $page_suffix, array( $this, 'admin_init' ) );
		}
	}

	/**
	 * Render the mount point for the Odyssey pricing app.
	 *
	 * The `jp-stats-pricing` class is required, not decorative: Odyssey scopes every one of its
	 * stylesheets to the set of known mount markers so its generic class names cannot collide
	 * with wp-admin's own chrome. See `apps/odyssey-stats/webpack-css-scope.js` in wp-calypso.
	 */
	public function render() {
		printf( '<div id="%s" class="jp-stats-pricing"></div>', esc_attr( self::MOUNT_ID ) );
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
		( new Odyssey_Assets() )->load_admin_scripts(
			self::ASSET_HANDLE,
			'pricing.min',
			array(
				'config_variable_name' => 'jetpackStatsOdysseyPricingConfigData',
				'config_data'          => $this->get_config_data(),
			)
		);
	}

	/**
	 * Register the route the screen uses to record a plan choice.
	 *
	 * Answered by the site itself rather than proxied to WordPress.com: the choice is made
	 * before the site has a blog ID, so there is nothing to key it against there yet.
	 */
	public function register_rest_routes() {
		register_rest_route(
			'jetpack/v4',
			'/stats-app/pricing-choice',
			array(
				'methods'             => \WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'record_choice' ),
				'permission_callback' => array( $this, 'can_record_choice' ),
			)
		);
	}

	/**
	 * Whether the current user may record a plan choice.
	 *
	 * The same capabilities that let them reach the screen in the first place.
	 *
	 * @return bool
	 */
	public function can_record_choice() {
		return current_user_can( 'manage_options' ) || current_user_can( 'view_stats' );
	}

	/**
	 * Record that a plan choice was made.
	 *
	 * @return \WP_REST_Response
	 */
	public function record_choice() {
		self::mark_choice_recorded();

		return rest_ensure_response( array( 'recorded' => true ) );
	}

	/**
	 * Remember that this site has already been asked to choose a plan.
	 */
	public static function mark_choice_recorded() {
		// Autoloaded: the connected dashboard reads it on every Stats page load.
		update_option( self::CHOICE_OPTION, true, true );
	}

	/**
	 * Whether this site has already been asked to choose a plan.
	 *
	 * @return bool
	 */
	public static function has_recorded_choice() {
		return (bool) get_option( self::CHOICE_OPTION, false );
	}

	/**
	 * Config data for the pricing app.
	 *
	 * @return array
	 */
	protected function get_config_data() {
		return array_merge(
			( new Odyssey_Config_Data() )->get_pricing_data(),
			array(
				'connect_url' => admin_url( 'admin.php?page=' . self::MY_JETPACK_PAGE_SLUG ),
				'stats_url'   => admin_url( 'admin.php?page=' . self::PAGE_SLUG ),
			)
		);
	}
}
