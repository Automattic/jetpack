<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit; // Exit if accessed directly
}
?>
<main>
	<h1><?php esc_html_e( 'Are you sure you want to deactivate?', 'jetpack-boost' ); ?></h1>
	<p class="big"><?php esc_html_e( 'Before you go...', 'jetpack-boost' ); ?></p>
	<p><?php esc_html_e( "Thank you for trying Jetpack Boost, before you go, we'd really love your feedback on our plugin.", 'jetpack-boost' ); ?></p>
	<p><?php esc_html_e( "Just temporarily deactivating, or don't fancy giving feedback? No problem.", 'jetpack-boost' ); ?></p>
</main>
<footer>
	<button 
		type="button"
		class="components-button"
		onclick="dispatchEvent(JetpackPluginDeactivation.events.close)"
	><?php esc_html_e( 'Cancel', 'jetpack-boost' ); ?></button>
	<button 
		type="button"
		class="components-button components-button--outline components-button--destructive"
		onclick="dispatchEvent(JetpackPluginDeactivation.events.deactivate)"
	><?php esc_html_e( 'Just Deactivate', 'jetpack-boost' ); ?></button>
	<button 
		type="button"
		class="components-button components-button--destructive"
		onclick="dispatchEvent(JetpackPluginDeactivation.events.deactivateWithFeedback)"
	><?php esc_html_e( 'Deactivate & Give Feedback', 'jetpack-boost' ); ?></button>
</footer>

<style>
	#jp-plugin-deactivation-jetpack-boost p.big {
		font-size: 1.7em;
	}

	#jp-plugin-deactivation-jetpack-boost footer {
		text-align: center;
	}
</style>
