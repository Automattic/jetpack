/*
 * NL-840 proof of concept, option C: mount the whole WooCommerce email editor
 * on its own admin screen. The package is resolved by a webpack alias to a
 * local WooCommerce checkout, so eslint's resolver cannot see it.
 */
/* eslint-disable import/no-unresolved */
import { ExperimentalEmailEditor } from '@woocommerce/email-editor';
import '@woocommerce/email-editor/build-style/style.css';
/* eslint-enable import/no-unresolved */
import { createRoot, StrictMode } from '@wordpress/element';

/**
 * Mount the email editor into the container rendered by the admin page.
 *
 * Unlike the styles panel, this takes its whole configuration as a prop —
 * `ExperimentalEmailEditor` registers and populates the store itself. That is
 * the contract difference NL-840 is trying to settle.
 *
 * @return {void}
 */
function mountNewsletterEmailEditor() {
	const config = window.JetpackNewsletterEmailEditor;

	if ( ! config ) {
		return;
	}

	const container = document.getElementById( config.elementId );

	if ( ! container ) {
		return;
	}

	const { postId, postType, elementId, ...editorConfig } = config;

	createRoot( container ).render(
		<StrictMode>
			<ExperimentalEmailEditor postId={ postId } postType={ postType } config={ editorConfig } />
		</StrictMode>
	);
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', mountNewsletterEmailEditor, {
		once: true,
	} );
} else {
	mountNewsletterEmailEditor();
}
