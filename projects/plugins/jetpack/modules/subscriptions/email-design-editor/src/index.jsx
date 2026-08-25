/**
 * The newsletter email design screen.
 *
 * `ExperimentalEmailEditor` takes its whole configuration as a prop and
 * registers the `email-editor/editor` store itself, so there is nothing to set
 * up here beyond handing it the configuration the page provides.
 *
 * Nothing enqueues this bundle yet — the admin page that mounts it is added
 * separately. See NL-848.
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
