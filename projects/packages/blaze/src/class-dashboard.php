<?php
/**
 * A class that adds a Blaze dashboard to wp-admin.
 *
 * @since 0.7.0
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Polyfills;
use Automattic\Jetpack\WP_Build_Polyfills\WP_Build_Screen_Id;

/**
 * Responsible for adding a Blaze dashboard menu to wp-admin.
 * The screen is a wp-build page bundled with this package; the remote Calypso build is only a fallback for missing build output.
 */
class Dashboard {
	/**
	 * Package version.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.30.0';

	/**
	 * List of dependencies needed to render the dashboard in wp-admin.
	 *
	 * @var array
	 */
	const JS_DEPENDENCIES = array( 'lodash', 'react', 'react-dom', 'wp-components', 'wp-compose', 'wp-i18n', 'wp-is-shallow-equal', 'wp-primitives', 'wp-url', 'moment' );

	/**
	 * URL where we load the Blaze dashboard remotely.
	 *
	 * @var string
	 */
	const CDN_URL = 'https://widgets.wp.com/blaze-dashboard/%s/%s';

	/**
	 * Script handle for the JS file we enqueue in the dashboard page.
	 *
	 * @var string
	 */
	const SCRIPT_HANDLE = 'jetpack-blaze-dashboard';

	/**
	 * We bump the asset version when the Jetpack back end is not compatible anymore.
	 *
	 * @var string
	 */
	const BLAZEDASH_VERSION = 'v1';

	/**
	 * Cache key for the cache buster.
	 *
	 * @var string
	 */
	const BLAZEDASH_CACHE_BUSTER_CACHE_KEY = 'jetpack_blaze_admin_asset_cache_buster';

	/**
	 * The wp-build page slug. The menu slug stays `advertising`, so the screen ID is aliased to this for wp-build's enqueue check.
	 *
	 * @var string
	 */
	const WP_BUILD_PAGE_SLUG = 'jetpack-blaze-dashboard';

	/**
	 * Prefix of the functions and globals wp-build generates for this package.
	 *
	 * @var string
	 */
	const WP_BUILD_PREFIX = 'jetpack_blaze';

	/**
	 * Empty classic handle that carries the dashboard config, since the dashboard itself is a script module.
	 *
	 * @var string
	 */
	const DATA_SCRIPT_HANDLE = 'jetpack-blaze-dashboard-data';

	/**
	 * The screen ID alias_screen_id_for_wp_build() replaced, until it is restored.
	 *
	 * @var string|null
	 */
	private static $wp_build_original_screen_id = null;

	/**
	 * Blaze dashboard admin page. Default is admin.php.
	 *
	 * @var string
	 */
	private $admin_page;

	/**
	 * Blaze dashboard menu slug. Default is 'advertising'.
	 *
	 * @var string
	 */
	private $menu_slug;

	/**
	 * Blaze dashboard css prefix. Default is 'jp-blaze'.
	 *
	 * @var string
	 */
	private $css_prefix;

	/**
	 * Dashboard constructor.
	 *
	 * @param string $admin_page Dashboard admin page. Default is admin.php.
	 * @param string $menu_slug Dashboard menu slug. Default is 'advertising'.
	 * @param string $css_prefix Dashboard css prefix. Default is 'jp-blaze'.
	 */
	public function __construct( $admin_page = 'admin.php', $menu_slug = 'advertising', $css_prefix = 'jp-blaze' ) {
		$this->admin_page = $admin_page;
		$this->menu_slug  = $menu_slug;
		$this->css_prefix = $css_prefix;
	}

	/**
	 * Override render funtion
	 *
	 * @return void
	 */
	public function render() {
		if ( function_exists( 'jetpack_blaze_jetpack_blaze_dashboard_wp_admin_render_page' ) ) {
			jetpack_blaze_jetpack_blaze_dashboard_wp_admin_render_page(); // @phan-suppress-current-line PhanUndeclaredFunction -- Checked with function_exists(); defined in the generated build/build.php, which Phan excludes.
			return;
		}

		$this->render_remote_dashboard();
	}

	/**
	 * Markup for the remote Calypso dashboard, used when the bundled build is missing.
	 *
	 * @return void
	 */
	private function render_remote_dashboard() {
		?>
		<div id="wpcom" class="<?php echo esc_attr( $this->css_prefix ); ?>-dashboard" style="min-height: calc(100vh - 100px);">
		<div class="hide-if-js"><?php esc_html_e( 'Your Jetpack Blaze dashboard requires JavaScript to function properly.', 'jetpack-blaze' ); ?></div>
			<div class="hide-if-no-js" style="height: 100%">
				<img
					class="<?php echo esc_attr( $this->css_prefix ); ?>-dashboard-loading-spinner"
					width="32"
					height="32"
					style="position: absolute; left: 50%; top: 50%;"
					alt=<?php echo esc_attr( __( 'Loading', 'jetpack-blaze' ) ); ?>
					src="//en.wordpress.com/i/loading/loading-64.gif"
				/>
			</div>
		</div>
		<script>
			jQuery(document).ready(function($) {
				// Load SVG sprite.
				$.get("https://widgets.wp.com/blaze-dashboard/common/gridicons-506499ddac13811fee8e.svg", function(data) {
					var div = document.createElement("div");
					div.innerHTML = new XMLSerializer().serializeToString(data.documentElement);
					div.style = 'display: none';
					document.body.insertBefore(div, document.body.childNodes[0]);
				});
				// we intercept on all anchor tags and change it to hashbang style.
				$("#wpcom").on('click', 'a', function (e) {
					const link = e && e.currentTarget && e.currentTarget.attributes && e.currentTarget.attributes.href && e.currentTarget.attributes.href.value;
					if (link && link.startsWith( '/<?php echo esc_attr( $this->menu_slug ); ?>' ) ) {
						location.hash = `#!${link}`;
						return false;
					}
				});
			});
		</script>
		<?php
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		if ( self::has_wp_build() ) {
			self::load_wp_build_with_screen_alias();
			add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_dashboard_data' ) );
			add_filter( 'admin_body_class', array( __CLASS__, 'add_body_class' ) );
			return;
		}

		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Mark the page's body, so the dashboard's layout styles apply whatever menu the page sits under.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $classes Space-separated body classes.
	 * @return string
	 */
	public static function add_body_class( $classes ) {
		return $classes . ' jetpack-blaze-dashboard';
	}

	/**
	 * Whether the bundled wp-build dashboard was built.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function has_wp_build() {
		return file_exists( dirname( __DIR__ ) . '/build/build.php' );
	}

	/**
	 * Require the generated wp-build entry, register its script modules, and the polyfills its boot bundle needs on older WordPress.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function load_wp_build() {
		if ( ! self::has_wp_build() ) {
			return;
		}

		require_once dirname( __DIR__ ) . '/build/build.php';

		// Loaded after `wp_default_scripts` has fired, so the generated hook there would be too late.
		if ( function_exists( 'jetpack_blaze_register_script_modules' ) ) {
			jetpack_blaze_register_script_modules(); // @phan-suppress-current-line PhanUndeclaredFunction -- Checked with function_exists(); defined in the generated build/modules.php, which Phan excludes.
		}

		WP_Build_Polyfills::register(
			'jetpack-blaze',
			array_merge( WP_Build_Polyfills::SCRIPT_HANDLES, WP_Build_Polyfills::MODULE_IDS ),
			null,
			array(
				array(
					'prefix' => self::WP_BUILD_PREFIX,
					'slug'   => self::WP_BUILD_PAGE_SLUG,
				),
			)
		);
	}

	/**
	 * Load wp-build with the screen ID aliased across its generated enqueue check.
	 *
	 * @see WP_Build_Screen_Id::load_with_alias()
	 * @return void
	 */
	private static function load_wp_build_with_screen_alias() {
		// An older wp-build-polyfills under the jetpack-autoloader may predate load_with_alias().
		if ( method_exists( WP_Build_Screen_Id::class, 'load_with_alias' ) ) {
			WP_Build_Screen_Id::load_with_alias(
				array( __CLASS__, 'alias_screen_id_for_wp_build' ),
				array( __CLASS__, 'restore_screen_id_after_wp_build' ),
				array( __CLASS__, 'load_wp_build' )
			);
			return;
		}

		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'alias_screen_id_for_wp_build' ) );
		self::load_wp_build();
		add_action( 'admin_enqueue_scripts', array( __CLASS__, 'restore_screen_id_after_wp_build' ) );
	}

	/**
	 * Alias the current screen ID to the wp-build page slug, so wp-build's generated enqueue check matches.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function alias_screen_id_for_wp_build() {
		$screen = get_current_screen();
		if ( ! $screen ) {
			return;
		}

		self::$wp_build_original_screen_id = $screen->id;
		$screen->id                        = self::WP_BUILD_PAGE_SLUG;
	}

	/**
	 * Undo alias_screen_id_for_wp_build().
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public static function restore_screen_id_after_wp_build() {
		$screen = get_current_screen();
		if ( ! $screen || null === self::$wp_build_original_screen_id ) {
			return;
		}

		$screen->id                        = self::$wp_build_original_screen_id;
		self::$wp_build_original_screen_id = null;
	}

	/**
	 * Print the dashboard config and load the Tracks transport and Jetpack's i18n loader.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function enqueue_dashboard_data() {
		wp_register_script( self::DATA_SCRIPT_HANDLE, false, array(), self::PACKAGE_VERSION, true );
		wp_enqueue_script( self::DATA_SCRIPT_HANDLE );

		$dashboard_config = new Dashboard_Config_Data( $this->admin_page, $this->menu_slug );
		$config_data      = $dashboard_config->get_data();
		// The bundled app builds its own container, so it needs the class the remote markup used to carry.
		$config_data['css_prefix'] = $this->css_prefix;
		// Tells the app which `?page=` is its own while the admin shell shows other dashboards.
		$config_data['menu_slug'] = $this->menu_slug;
		wp_add_inline_script(
			self::DATA_SCRIPT_HANDLE,
			'window.jetpackBlazeDashboardConfig = ' . wp_json_encode( $config_data, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
			'before'
		);

		// The dashboard's analytics only queue into `window._tkq`; this flushes them.
		wp_enqueue_script( 'jp-tracks', '//stats.wp.com/w.js', array(), gmdate( 'YW' ), true );

		// Lets the `@jetpack-blaze/init` module install the JS translation catalog before the app renders.
		if ( wp_script_is( 'wp-jp-i18n-loader', 'registered' ) ) {
			wp_enqueue_script( 'wp-jp-i18n-loader' );
		}
	}

	/**
	 * Admin shell member for this dashboard, so it can open without a page load from other Jetpack dashboards.
	 *
	 * @since $$next-version$$
	 *
	 * @param string $title Menu title.
	 * @return array|null Member, or null when the bundled build is missing.
	 */
	public function get_admin_shell_member( $title ) {
		if ( ! self::has_wp_build() ) {
			return null;
		}

		return array(
			'build_prefix' => self::WP_BUILD_PREFIX,
			'build_page'   => self::WP_BUILD_PAGE_SLUG,
			'init_modules' => array( '@jetpack-blaze/init' ),
			'title'        => $title,
			// What the shell shows while the page boots; the rendered subtitle adds a link.
			'header'       => array(
				'title'    => $title,
				'subtitle' => __( 'Promote your posts and pages across WordPress.com and Tumblr. Learn more.', 'jetpack-blaze' ),
			),
			'capability'   => 'manage_options',
			'handles'      => array( self::DATA_SCRIPT_HANDLE, 'jp-tracks', 'wp-jp-i18n-loader' ),
			'load'         => function () {
				self::load_wp_build();
				add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_dashboard_data' ) );
			},
		);
	}

	/**
	 * Load the admin scripts.
	 *
	 * @param string $hook The current admin page.
	 */
	public function load_admin_scripts( $hook ) {
		if ( ! str_ends_with( $hook, 'page_' . $this->menu_slug ) ) {
			return;
		}

		$asset_handle = self::SCRIPT_HANDLE;
		$asset_name   = 'build.min';

		$dashboard_config = new Dashboard_Config_Data( $this->admin_page, $this->menu_slug );

		$config_data = $dashboard_config->get_data();

		if ( file_exists( __DIR__ . "/../dist/{$asset_name}.js" ) ) {
			// Load local assets for the convenience of development.
			Assets::register_script(
				$asset_handle,
				"../dist/{$asset_name}.js",
				__FILE__,
				array(
					'enqueue'    => true,
					'in_footer'  => true,
					'textdomain' => 'jetpack-blaze',
				)
			);
		} else {
			$css_url    = $asset_name . ( is_rtl() ? '.rtl' : '' ) . '.css';
			$css_handle = $asset_handle . '-style';

			wp_enqueue_script(
				$asset_handle,
				sprintf( self::CDN_URL, self::BLAZEDASH_VERSION, "{$asset_name}.js" ),
				self::JS_DEPENDENCIES,
				$this->get_cdn_asset_cache_buster(),
				true
			);
			wp_enqueue_style(
				$css_handle,
				sprintf( self::CDN_URL, self::BLAZEDASH_VERSION, $css_url ),
				array(),
				$this->get_cdn_asset_cache_buster()
			);
		}

		wp_add_inline_script(
			$asset_handle,
			$dashboard_config->get_js_config_data( $config_data ),
			'before'
		);
	}

	/**
	 * Returns cache buster string for assets.
	 * Development mode doesn't need this, as it's handled by `Assets` class.
	 */
	protected function get_cdn_asset_cache_buster() {
		// Use cached cache buster in production.
		$remote_asset_version = get_transient( self::BLAZEDASH_CACHE_BUSTER_CACHE_KEY );
		if ( ! empty( $remote_asset_version ) ) {
			return $remote_asset_version;
		}

		// If no cached cache buster, we fetch it from CDN and set to transient.
		$response = wp_remote_get( sprintf( self::CDN_URL, self::BLAZEDASH_VERSION, 'build_meta.json' ), array( 'timeout' => 5 ) );

		if ( is_wp_error( $response ) ) {
			// fallback to the package version.
			return self::PACKAGE_VERSION;
		}

		$build_meta = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! empty( $build_meta['cache_buster'] ) ) {
			// Cache the cache buster for 15 mins.
			set_transient( self::BLAZEDASH_CACHE_BUSTER_CACHE_KEY, $build_meta['cache_buster'], 15 * MINUTE_IN_SECONDS );
			return $build_meta['cache_buster'];
		}

		// fallback to the package version.
		return self::PACKAGE_VERSION;
	}
}
