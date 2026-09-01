/*
 * Proof of concept for NL-839: mount the WooCommerce email editor on its own
 * admin screen, editing the Jetpack newsletter template.
 *
 * `@woocommerce/email-editor` is resolved by a webpack alias to a local
 * WooCommerce checkout rather than installed, so eslint's resolver cannot see
 * it. See `tools/webpack.config.extensions.js`.
 */
/* eslint-disable import/no-unresolved */
import { ExperimentalEmailEditor } from '@woocommerce/email-editor';
import '@woocommerce/email-editor/build-style/style.css';
/* eslint-enable import/no-unresolved */
import { createRoot, StrictMode } from '@wordpress/element';

/**
 * Mount the email editor into the container rendered by the admin page.
 *
 * `ExperimentalEmailEditor` takes its whole configuration as a prop and
 * registers the `email-editor/editor` store itself, so there is no store setup
 * to do here. It has been part of the package's public exports since before
 * this spike started.
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
