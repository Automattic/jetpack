/*
 * NL-840 proof of concept, option D: the chrome-free styles panel on its own
 * admin screen. The package is resolved by a webpack alias to a local
 * WooCommerce checkout, so eslint's resolver cannot see it.
 */
/* eslint-disable import/no-unresolved */
import { createStore, storeName, StylesPanel } from '@woocommerce/email-editor';
import '@woocommerce/email-editor/build-style/style.css';
/* eslint-enable import/no-unresolved */
import { dispatch } from '@wordpress/data';
import { createRoot, StrictMode } from '@wordpress/element';
import './newsletter-styles-page.scss';

/**
 * Mount the styles panel into the container rendered by the admin page.
 *
 * Note the contrast with option C: `ExperimentalEmailEditor` takes its whole
 * configuration as a prop and sets up the store internally, while `StylesPanel`
 * requires the consumer to register and populate the store before rendering.
 * Same package, two different contracts — which is what NL-840 has to settle.
 *
 * @return {void}
 */
function mountNewsletterStylesPage() {
	const config = window.JetpackNewsletterStylesPage;

	if ( ! config ) {
		return;
	}

	const container = document.getElementById( config.elementId );

	if ( ! container ) {
		return;
	}

	createStore();
	dispatch( storeName ).setEditorConfig( config );

	createRoot( container ).render(
		<StrictMode>
			<StylesPanel />
		</StrictMode>
	);
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', mountNewsletterStylesPage, {
		once: true,
	} );
} else {
	mountNewsletterStylesPage();
}
