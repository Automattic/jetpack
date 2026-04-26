<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

use Automattic\Jetpack\Assets;
use Automattic\Jetpack\Tracking;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

require_once __DIR__ . '/class.jetpack-admin-page.php';
require_once JETPACK__PLUGIN_DIR . 'class.jetpack-modules-list-table.php';

/**
 * Builds the settings page and its menu
 */
class Jetpack_Settings_Page extends Jetpack_Admin_Page {

	/**
	 * Show the settings page only when Jetpack is connected or in dev mode.
	 *
	 * @var boolean
	 */
	protected $dont_show_if_not_active = true;

	/**
	 * Add page action.
	 *
	 * @param string $hook Hook of current page.
	 * @return void
	 */
	public function add_page_actions( $hook ) {} //phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

	/**
	 * Adds the Settings sub menu.
	 */
	public function get_page_hook() {
		return add_submenu_page(
			'',
			__( 'Jetpack Settings', 'jetpack' ),
			__( 'Settings', 'jetpack' ),
			'jetpack_manage_modules',
			'jetpack_modules',
			array( $this, 'render' )
		);
	}

	/**
	 * Render the page body.
	 *
	 * Emits a single mount point (`<div id="jp-modules-admin-root">`) for the
	 * React `modules-admin` bundle, plus the noscript and REST-disabled
	 * fallback notices. `Jetpack_Modules_List_Table`'s constructor enqueues
	 * the bundle and localizes the `jetpackModulesData` blob the React app
	 * reads on mount.
	 *
	 * @since $$next-version$$
	 */
	public function page_render() {
		// `Jetpack_Modules_List_Table::__construct` enqueues the React bundle
		// and localizes `jetpackModulesData`, so instantiate it for the side
		// effect.
		// @phan-suppress-next-line PhanNoopNew -- Constructor enqueues scripts.
		new Jetpack_Modules_List_Table();

		// We have static.html so let's continue trying to fetch the others.
		$noscript_notice = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static-noscript-notice.html' ); //phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, Not fetching a remote file.
		$rest_api_notice = @file_get_contents( JETPACK__PLUGIN_DIR . '_inc/build/static-version-notice.html' ); //phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents, Not fetching a remote file.

		$noscript_notice = str_replace(
			'#HEADER_TEXT#',
			esc_html__( 'You have JavaScript disabled', 'jetpack' ),
			$noscript_notice
		);
		$noscript_notice = str_replace(
			'#TEXT#',
			esc_html__( "Turn on JavaScript to unlock Jetpack's full potential!", 'jetpack' ),
			$noscript_notice
		);

		$rest_api_notice = str_replace(
			'#HEADER_TEXT#',
			esc_html( __( 'WordPress REST API is disabled', 'jetpack' ) ),
			$rest_api_notice
		);
		$rest_api_notice = str_replace(
			'#TEXT#',
			esc_html( __( "Enable WordPress REST API to unlock Jetpack's full potential!", 'jetpack' ) ),
			$rest_api_notice
		);

		if ( ! $this->is_rest_api_enabled() ) {
			echo $rest_api_notice; //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		}
		echo $noscript_notice; //phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		?>
		<div id="jp-modules-admin-root" class="jp-modules-admin-root"></div>
		<?php

		$tracking = new Tracking();
		$tracking->record_user_event( 'wpa_page_view', array( 'path' => 'old_settings' ) );
	}

	/**
	 * Load styles for static page.
	 *
	 * @since 4.3.0
	 */
	public function additional_styles() {
		Jetpack_Admin_Page::load_wrapper_styles();
	}

	/**
	 * Javascript logic specific to the list table
	 */
	public function page_admin_scripts() {
		wp_enqueue_script(
			'jetpack-admin-js',
			Assets::get_file_url_for_environment( '_inc/build/jetpack-admin.min.js', '_inc/jetpack-admin.js' ),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);
	}
}
