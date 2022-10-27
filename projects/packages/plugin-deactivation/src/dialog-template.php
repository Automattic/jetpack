<?php
/**
 * Reference template file for deactivation handler dialog.
 *
 * This file is not used directly. Copy this file to your plugin and modify it to suit your needs.
 *
 * @package automattic/jetpack-plugin-deactivation
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}
?>
<main>
	<h1><?php esc_html_e( 'Are you sure you want to deactivate?', 'jetpack-plugin-deactivation' ); ?></h1>
	<p class="big"><?php esc_html_e( 'Before you go...', 'jetpack-plugin-deactivation' ); ?></p>
	<p><?php esc_html_e( "We'd really love your feedback on our plugin.", 'jetpack-plugin-deactivation' ); ?></p>
	<p><?php esc_html_e( "Just temporarily deactivating, or don't fancy giving feedback? No problem.", 'jetpack-plugin-deactivation' ); ?></p>
</main>
<footer>
	<button 
		type="button"
		class="jp-plugin-deactivation__button"
		onclick="dispatchEvent(JetpackPluginDeactivation.events.close)"
	><?php esc_html_e( 'Cancel', 'jetpack-plugin-deactivation' ); ?></button>
	<button 
		type="button"
		class="jp-plugin-deactivation__button jp-plugin-deactivation__button--outline jp-plugin-deactivation__button--destructive"
		onclick="dispatchEvent(JetpackPluginDeactivation.events.deactivate)"
	><?php esc_html_e( 'Just Deactivate', 'jetpack-plugin-deactivation' ); ?></button>
	<button 
		type="button"
		class="jp-plugin-deactivation__button jp-plugin-deactivation__button--destructive"
		onclick="dispatchEvent(JetpackPluginDeactivation.events.deactivateWithFeedback)"
	><?php esc_html_e( 'Deactivate & Give Feedback', 'jetpack-plugin-deactivation' ); ?></button>
</footer>

<style>
/* Add your custom style for the dialog if any */
</style>
