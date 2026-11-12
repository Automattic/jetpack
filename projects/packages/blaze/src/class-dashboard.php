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

/**
 * Responsible for adding a Blaze dashboard menu to wp-admin.
 * The screen content itself is rendered remotely.
 */
class Dashboard {
	/**
	 * Package version.
	 *
	 * @var string
	 */
	const PACKAGE_VERSION = '0.29.15';

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
		<?php
	}

	/**
	 * Print the container the app mounts into when the admin shell loads it, which shows its own loading state.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function render_admin_shell_markup() {
		printf( '<div id="wpcom" class="%s-dashboard"></div>', esc_attr( $this->css_prefix ) );
	}

	/**
	 * Script that loads the icon sprite and turns the app's links into hashbang links.
	 *
	 * Attached to the dashboard script rather than printed by render(), so it also runs when the admin shell loads the page.
	 *
	 * @return string
	 */
	private function get_inline_script() {
		$prefix = wp_json_encode( '/' . $this->menu_slug, JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP );
		return <<<JS
( function () {
	fetch( 'https://widgets.wp.com/blaze-dashboard/common/gridicons-506499ddac13811fee8e.svg' )
		.then( function ( response ) { return response.text(); } )
		.then( function ( svg ) {
			var div = document.createElement( 'div' );
			div.innerHTML = svg;
			div.style.display = 'none';
			document.body.insertBefore( div, document.body.firstChild );
		} );
	var dashboard = document.getElementById( 'wpcom' );
	dashboard && dashboard.addEventListener( 'click', function ( event ) {
		var anchor = event.target.closest( 'a[href]' );
		var link = anchor && anchor.getAttribute( 'href' );
		if ( link && link.startsWith( {$prefix} ) ) {
			location.hash = '#!' + link;
			event.preventDefault();
		}
	} );
} )();
JS;
	}

	/**
	 * Ready the dashboard's scripts while another Jetpack page is open in the admin shell.
	 *
	 * @since $$next-version$$
	 *
	 * @return void
	 */
	public function load_as_admin_shell_guest() {
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );
	}

	/**
	 * Initialize the admin resources.
	 */
	public function admin_init() {
		add_action( 'admin_enqueue_scripts', array( $this, 'load_admin_scripts' ) );
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
		wp_add_inline_script( $asset_handle, $this->get_inline_script() );
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
