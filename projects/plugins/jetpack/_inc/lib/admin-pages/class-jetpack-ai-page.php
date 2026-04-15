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

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/class.jetpack-admin-page.php';

/**
 * Builds the Jetpack AI admin page and its sidebar menu entry.
 */
class Jetpack_AI_Page extends Jetpack_Admin_Page {

	/**
	 * Show the page even when Jetpack is not fully active (offline mode).
	 *
	 * @var bool
	 */
	protected $dont_show_if_not_active = false;

	/**
	 * Register the "AI" submenu under the Jetpack top-level menu.
	 *
	 * @return string|false Hook returned by Admin_Menu::add_menu().
	 */
	public function get_page_hook() {
		return Admin_Menu::add_menu(
			__( 'Jetpack AI', 'jetpack' ),
			__( 'AI', 'jetpack' ),
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
	 * Load shared wrapper styles used by the base admin page renderer.
	 */
	public function additional_styles() {
		Jetpack_Admin_Page::load_wrapper_styles();
	}

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

		$blog_id = Connection_Manager::get_site_id( true );

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
					'blogId'       => $blog_id ? (int) $blog_id : 0,
					'siteAdminUrl' => admin_url(),
					'apiRoot'      => esc_url_raw( rest_url() ),
					'apiNonce'     => wp_create_nonce( 'wp_rest' ),
					'pluginUrl'    => plugins_url( '', JETPACK__PLUGIN_FILE ),
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
	 * Render the page container. The React app mounts into this div.
	 *
	 * AdminPage from @automattic/jetpack-components handles the full-page layout
	 * (header, footer, background) so no wrapper is needed here.
	 */
	public function page_render() {
		?>
		<div id="jetpack-ai-root"></div>
		<?php
	}
}
