/**
 * Client-side entry point for the newsletter email design screen.
 *
 * `ExperimentalEmailEditor` takes its whole configuration as a prop and
 * registers the `email-editor/editor` store itself, so there is nothing to set
 * up here beyond handing it what the page provides.
 *
 * The page is the other half, and is added separately: it renders the
 * container and localises `window.JetpackEmailDesignEditor` with the editor's
 * configuration. Until it exists nothing enqueues this bundle, so the mount
 * below finds no configuration and returns. See NL-848.
 */
import { ExperimentalEmailEditor } from '@woocommerce/email-editor';
import { createRoot, StrictMode } from '@wordpress/element';

/**
 * Mount the editor into the container the admin page renders.
 *
 * @return {void}
 */
function mountEmailDesignEditor() {
	const config = window.JetpackEmailDesignEditor;

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
	document.addEventListener( 'DOMContentLoaded', mountEmailDesignEditor, { once: true } );
} else {
	mountEmailDesignEditor();
}
