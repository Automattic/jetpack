<?php
if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 ); // Exit if accessed directly
}
?>
<main class="jp-plugin-deactivation__dialog__content">
	<h1><?php esc_html_e( 'Are you sure you want to deactivate?', 'jetpack-boost' ); ?></h1>
	<p class="big"><?php esc_html_e( 'Before you go...', 'jetpack-boost' ); ?></p>
	<p><?php esc_html_e( "Thank you for trying Jetpack Boost. Before you go, we'd really love your feedback on our plugin.", 'jetpack-boost' ); ?></p>
	<p><?php esc_html_e( "Just temporarily deactivating or don't fancy giving feedback? No problem.", 'jetpack-boost' ); ?></p>
</main>
<footer class="jp-plugin-deactivation__dialog__actions">
	<button
		type="button"
		class="jp-plugin-deactivation__button"
		data-jp-plugin-deactivation-action="close"
	><?php esc_html_e( 'Cancel', 'jetpack-boost' ); ?></button>
	<button
		type="button"
		class="jp-plugin-deactivation__button jp-plugin-deactivation__button--outline jp-plugin-deactivation__button--destructive"
		data-jp-plugin-deactivation-action="deactivate"
	><?php esc_html_e( 'Just Deactivate', 'jetpack-boost' ); ?></button>
	<!-- Using an anchor instead of a button for the Deactivate & Give Feedback may trigger browser's popup blocker as it is navigating to two URLs at once. -->
	<button
		type="button"
		class="jp-plugin-deactivation__button jp-plugin-deactivation__button--destructive"
		data-jp-plugin-deactivation-action="deactivate"
		onclick="window.open( 'https://jetpack.com/redirect/?source=jetpack-boost-deactivation-feedback', '_blank' )"
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
