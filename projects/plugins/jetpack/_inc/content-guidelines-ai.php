<?php
/**
 * Content Guidelines AI — "Generate with Jetpack" button injection.
 *
 * Enqueues a standalone JS bundle on the Content Guidelines admin page
 * that injects AI-powered generate buttons next to each "Save guidelines" button.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Redirect;
use Automattic\Jetpack\Status;
use Automattic\Jetpack\Status\Host;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Enqueue content-guidelines-ai script on the Content Guidelines admin page.
 *
 * @param string $hook_suffix The current admin page hook suffix.
 */
function jetpack_content_guidelines_ai_enqueue_scripts( $hook_suffix ) {
	if ( 'settings_page_content-guidelines-wp-admin' !== $hook_suffix ) {
		return;
	}

	$asset_file = JETPACK__PLUGIN_DIR . '_inc/build/content-guidelines-ai.min.asset.php';
	$asset      = file_exists( $asset_file ) ? require $asset_file : array(
		'dependencies' => array( 'wp-api-fetch', 'wp-components', 'wp-data', 'wp-element', 'wp-i18n', 'wp-notices' ),
		'version'      => JETPACK__VERSION,
	);

	wp_enqueue_script(
		'jetpack-content-guidelines-ai',
		plugins_url( '_inc/build/content-guidelines-ai.min.js', JETPACK__PLUGIN_FILE ),
		$asset['dependencies'],
		$asset['version'],
		true
	);

	// Determine AI availability per site type and pass config to JS.
	if ( ! class_exists( 'Jetpack_AI_Helper' ) ) {
		require_once JETPACK__PLUGIN_DIR . '_inc/lib/class-jetpack-ai-helper.php';
	}

	$host         = new Host();
	$is_wpcom     = $host->is_wpcom_simple() || $host->is_woa_site();
	$is_connected = $host->is_wpcom_simple()
		|| ( ( new Connection_Manager( 'jetpack' ) )->has_connected_owner() && ! ( new Status() )->is_offline_mode() );
	$ai_enabled   = \Jetpack_AI_Helper::is_enabled();

	$config = array(
		'available'   => $ai_enabled && $is_connected,
		'isConnected' => $is_connected,
	);

	if ( ! $config['available'] ) {
		if ( ! $is_connected ) {
			// Self-hosted site not connected to WordPress.com.
			$config['upgradeUrl'] = admin_url( 'admin.php?page=jetpack#/dashboard' );
		} elseif ( $is_wpcom ) {
			// wpcom simple or atomic — needs AI plan.
			$config['upgradeUrl'] = Redirect::get_url( 'jetpack-ai-yearly-tier-upgrade-nudge' );
		} else {
			// Self-hosted connected — needs Jetpack AI product.
			$config['upgradeUrl'] = Redirect::get_url( 'jetpack-ai-upgrade-url-for-jetpack-sites' );
		}
	}

	wp_add_inline_script(
		'jetpack-content-guidelines-ai',
		sprintf(
			'window.jetpackContentGuidelinesAiConfig = %s;',
			wp_json_encode( $config, JSON_HEX_TAG | JSON_HEX_AMP )
		),
		'before'
	);
}

add_action( 'admin_enqueue_scripts', 'jetpack_content_guidelines_ai_enqueue_scripts' );
