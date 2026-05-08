<?php
/**
 * Jetpack AI admin page.
 *
 * Registers the "AI" submenu item under Jetpack and mounts the React-based
 * MCP settings interface.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Admin_UI\Admin_Menu;
use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/class.jetpack-admin-page.php';

/**
 * Builds the Jetpack AI admin page and its sidebar menu entry.
 */
class Jetpack_AI_Page extends Jetpack_Admin_Page {

	/**
	 * Hide the "AI" sidebar entry when Jetpack is not yet connected.
	 * Other Jetpack products follow the same convention.
	 *
	 * @var bool
	 */
	protected $dont_show_if_not_active = true;

	/**
	 * Register the "AI" submenu under the Jetpack top-level menu.
	 *
	 * @return string|false Hook returned by Admin_Menu::add_menu().
	 */
	public function get_page_hook() {
		return Admin_Menu::add_menu(
			// "Jetpack AI" is a product name and should not be translated.
			'Jetpack AI',
			'AI',
			'manage_options',
			'jetpack-ai',
			array( $this, 'render' ),
			4
		);
	}

	/**
	 * Attach page-specific actions.
	 *
	 * @param string $hook The page hook returned by get_page_hook().
	 */
	public function add_page_actions( $hook ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Nothing extra needed beyond the common hooks in Jetpack_Admin_Page::add_actions().
	}

	/**
	 * No additional styles needed: AdminPage from @automattic/jetpack-components
	 * owns the full layout and does not need the wrap_ui admin.css / style.min.css
	 * bundle (which zeroes out #wpcontent padding and conflicts with AdminPage's
	 * margin-left compensation).
	 */
	public function additional_styles() {}

	/**
	 * Enqueue scripts and styles for the AI admin page.
	 */
	public function page_admin_scripts() {
		$script_path    = JETPACK__PLUGIN_DIR . '_inc/build/jetpack-ai-admin.asset.php';
		$script_deps    = array( 'wp-element', 'wp-components', 'wp-i18n', 'wp-polyfill' );
		$script_version = JETPACK__VERSION;

		if ( file_exists( $script_path ) ) {
			$asset_manifest = include $script_path;
			$script_deps    = $asset_manifest['dependencies'];
			$script_version = $asset_manifest['version'];
		}

		$blog_id     = Connection_Manager::get_site_id( true );
		$site_suffix = ( new Status() )->get_site_suffix();
		// Use the plain hostname for the Atomic activity log URL — get_site_suffix() can
		// include '::' for subdirectory installs, which would break the URL. This matches
		// the approach used by jetpack-mu-wpcom for the sidebar Activity Log link.
		$site_host = wp_parse_url( home_url(), PHP_URL_HOST );
		// On Atomic, jetpack-mu-wpcom replaces the cloud redirect with a direct WPCOM URL.
		// Mirror that behaviour here so the activity log link resolves consistently.
		$activity_log_site = ( is_string( $site_host ) && '' !== $site_host ) ? $site_host : $site_suffix;
		$activity_log_url  = ( new Host() )->is_woa_site()
			? 'https://wordpress.com/activity-log/' . $activity_log_site
			: Redirect::get_url( 'cloud-activity-log-wp-menu', array( 'site' => $blog_id ? $blog_id : $site_suffix ) );

		wp_enqueue_script(
			'jetpack-ai-admin',
			plugins_url( '_inc/build/jetpack-ai-admin.js', JETPACK__PLUGIN_FILE ),
			$script_deps,
			$script_version,
			true
		);

		wp_set_script_translations( 'jetpack-ai-admin', 'jetpack' );

		wp_add_inline_script(
			'jetpack-ai-admin',
			'var jetpackAiSettings = ' . wp_json_encode(
				array(
					'blogId'         => $blog_id ? (int) $blog_id : 0,
					'activityLogUrl' => $activity_log_url,
					'siteAdminUrl'   => admin_url(),
					'apiRoot'        => esc_url_raw( rest_url() ),
					'apiNonce'       => wp_create_nonce( 'wp_rest' ),
					'pluginUrl'      => plugins_url( '', JETPACK__PLUGIN_FILE ),
					'upgradeUrl'     => 'https://wordpress.com/plans/' . rawurlencode( wp_parse_url( home_url(), PHP_URL_HOST ) ?? '' ),
				),
				JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP
			) . ';',
			'before'
		);

		wp_enqueue_style(
			'jetpack-ai-admin',
			plugins_url( '_inc/build/jetpack-ai-admin.css', JETPACK__PLUGIN_FILE ),
			array( 'wp-components' ),
			$script_version
		);
	}

	/**
	 * Override the base render() to skip wrap_ui entirely.
	 *
	 * Wrap_ui renders the Jetpack masthead header and static footer, which
	 * duplicate the header/footer that AdminPage (React) already provides.
	 * Calling page_render() directly lets AdminPage own the full layout.
	 */
	public function render() {
		$this->page_render();
	}

	/**
	 * Render the page container. The React app mounts into this div.
	 *
	 * AdminPage from @automattic/jetpack-components handles the full-page layout.
	 */
	public function page_render() {
		?>
		<div id="jetpack-ai-root"></div>
		<?php
	}
}
