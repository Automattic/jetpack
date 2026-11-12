<?php
/**
 * A class that adds a Blaze dashboard to wp-admin.
 *
 * @since 0.7.0
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

use Automattic\Jetpack\Admin_UI\Admin_Shell;
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
	 * Inside a rounded stage, the app fills the stage instead of the viewport, which also counts the 8px gap below it.
	 *
	 * @var string
	 */
	const STAGE_CSS = '@media (min-width: 782px) { .wp-admin .jetpack-admin-shell__stage .promote-post-i2__page { min-height: calc(100vh - var(--wp-admin--admin-bar--height, 32px) - 8px); } }';

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
	 * Whether the page draws in the rounded frame, once is_framed() has worked it out.
	 *
	 * @var bool|null
	 */
	private $framed = null;

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
		if ( $this->is_framed() ) {
			$this->render_framed();
			return;
		}
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
	 * Print the app inside the frame the admin shell's other dashboards have: an empty stage while it loads, no spinner.
	 *
	 * @return void
	 */
	private function render_framed() {
		$prefix = $this->css_prefix;
		?>
		<div class="<?php echo esc_attr( $prefix ); ?>-frame">
			<script>
				( function ( frame, menu ) {
					if ( menu ) {
						frame.style.backgroundColor = getComputedStyle( menu ).backgroundColor;
					}
				} )( document.currentScript.parentNode, document.getElementById( 'adminmenuback' ) );
			</script>
			<div class="<?php echo esc_attr( $prefix ); ?>-frame__stage jetpack-admin-shell__stage">
				<div id="wpcom" class="<?php echo esc_attr( $prefix ); ?>-dashboard">
					<div class="hide-if-js"><?php esc_html_e( 'Your Jetpack Blaze dashboard requires JavaScript to function properly.', 'jetpack-blaze' ); ?></div>
				</div>
			</div>
		</div>
		<?php
	}

	/**
	 * Whether the loaded admin-ui can take a page that isn't built with wp-build into the admin shell.
	 *
	 * @since $$next-version$$
	 *
	 * @return bool
	 */
	public static function supports_admin_shell() {
		return defined( Admin_Shell::class . '::KIND_SCRIPT' );
	}

	/**
	 * Whether the page draws in the rounded frame of the Jetpack dashboards: when it is one of the admin shell's pages.
	 *
	 * @return bool
	 */
	private function is_framed() {
		$this->framed ??= ! wp_doing_ajax()
			&& self::supports_admin_shell()
			&& Admin_Shell::is_enabled()
			&& isset( Admin_Shell::get_members()[ $this->menu_slug ] );
		return $this->framed;
	}

	/**
	 * Style the frame, matching the rounded stage of the wp-build dashboards.
	 *
	 * @param string $hook The current admin page.
	 * @return void
	 */
	private function enqueue_frame_style( $hook ) {
		$body  = 'body.' . sanitize_html_class( $hook );
		$frame = '.' . sanitize_html_class( $this->css_prefix ) . '-frame';
		$css   = <<<CSS
@media (min-width: 782px) {
	{$body} #wpcontent { padding-inline-start: 0; }
	{$body} #wpbody-content { padding-bottom: 0; }
	{$body} #wpfooter { display: none; }
	{$frame} {
		background: #1d2327;
		padding-block-end: 8px;
		padding-inline-end: 8px;
	}
	{$frame}__stage {
		background: #fff;
		border-radius: 12px;
		height: calc(100vh - var(--wp-admin--admin-bar--height, 32px) - 8px);
		overflow-y: auto;
	}
}
CSS;
		wp_register_style( self::SCRIPT_HANDLE . '-frame', false, array(), self::PACKAGE_VERSION );
		wp_add_inline_style( self::SCRIPT_HANDLE . '-frame', $css );
		wp_enqueue_style( self::SCRIPT_HANDLE . '-frame' );
	}

	/**
	 * The element the app mounts into when the admin shell loads it.
	 *
	 * @since $$next-version$$
	 *
	 * @return array{id: string, class: string}
	 */
	public function get_admin_shell_container() {
		return array(
			'id'    => 'wpcom',
			'class' => $this->css_prefix . '-dashboard',
		);
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

		if ( $this->is_framed() ) {
			$this->enqueue_frame_style( $hook );
		}

		$dashboard_config = new Dashboard_Config_Data( $this->admin_page, $this->menu_slug );

		$config_data = $dashboard_config->get_data();

		$is_local = file_exists( __DIR__ . "/../dist/{$asset_name}.js" );
		// Assets registers the local build's stylesheet under the script's handle.
		$style_handle = $is_local ? $asset_handle : $asset_handle . '-style';
		if ( $is_local ) {
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
			$css_url      = $asset_name . ( is_rtl() ? '.rtl' : '' ) . '.css';
			$cache_buster = $this->get_cdn_asset_cache_buster();

			wp_enqueue_script(
				$asset_handle,
				sprintf( self::CDN_URL, self::BLAZEDASH_VERSION, "{$asset_name}.js" ),
				self::JS_DEPENDENCIES,
				$cache_buster,
				true
			);
			wp_enqueue_style(
				$style_handle,
				sprintf( self::CDN_URL, self::BLAZEDASH_VERSION, $css_url ),
				array(),
				$cache_buster
			);
		}

		wp_add_inline_script(
			$asset_handle,
			$dashboard_config->get_js_config_data( $config_data ),
			'before'
		);
		wp_add_inline_script( $asset_handle, $this->get_inline_script() );
		// On the dashboard's own stylesheet, so it also loads, and switches off, with Blaze in the admin shell.
		wp_add_inline_style( $style_handle, self::STAGE_CSS );
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
