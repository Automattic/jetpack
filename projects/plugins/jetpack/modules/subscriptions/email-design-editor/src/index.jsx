/**
 * Client-side entry point for the newsletter email design screen.
 *
 * The page is the other half, and is added separately: it renders the
 * container and localises `window.JetpackEmailDesignEditor`. Until it exists
 * nothing enqueues this bundle, so the mount below finds no configuration and
 * returns. See NL-848.
 */
import { ExperimentalEmailEditor } from '@woocommerce/email-editor';
import { createRoot, StrictMode } from '@wordpress/element';

/**
 * Translate the page's data into the configuration the editor reads.
 *
 * The editor's `config` prop is not the WordPress.com bootstrap bundle. The
 * bundle arrives in the shape the REST route returns it — `editor_settings`,
 * `editor_theme` — while the package's store reads five camelCased keys off
 * the prop: `editorSettings`, `theme`, `urls`, `userEmail` and
 * `globalStylesPostId`. Passing the bundle through unmapped leaves all five
 * undefined, which is not an error the editor reports — it boots with no
 * settings and no theme.
 *
 * `editorSettings` is assembled from both halves on purpose. WordPress.com
 * removes `__unstableResolvedAssets` and `allowedIframeStyleHandles` from the
 * bundle before returning it, because they describe the installation they were
 * computed on rather than the design; the site supplies its own. The site's
 * half is merged last so it wins.
 *
 * @param {object} data - The value of `window.JetpackEmailDesignEditor`.
 * @throws {Error} If the page left out something the editor cannot start without.
 * @return {object} The editor's `config` prop.
 */
export function buildEditorConfig( data ) {
	const { bundle, editorSettings, urls, userEmail, globalStylesPostId } = data;

	// Mirrors what the package's own `initializeEditor()` validates when it reads
	// these from a global. Nothing checks them on the `config` prop path, so an
	// omission would otherwise surface as an unrelated failure deep in the editor.
	if ( ! bundle?.editor_settings ) {
		throw new Error( 'JetpackEmailDesignEditor.bundle.editor_settings is required.' );
	}

	if ( ! bundle?.editor_theme ) {
		throw new Error( 'JetpackEmailDesignEditor.bundle.editor_theme is required.' );
	}

	if ( typeof urls?.back !== 'string' || typeof urls?.listings !== 'string' ) {
		throw new Error( 'JetpackEmailDesignEditor.urls.back and .listings are required strings.' );
	}

	return {
		editorSettings: { ...bundle.editor_settings, ...editorSettings },
		theme: bundle.editor_theme,
		urls,
		userEmail,
		globalStylesPostId: globalStylesPostId ?? null,
	};
}

/**
 * Mount the editor into the container the page renders.
 *
 * @throws {Error} If the page provided a configuration the editor cannot start from.
 * @return {void}
 */
export function mountEmailDesignEditor() {
	const data = window.JetpackEmailDesignEditor;

	// Not our page. The bundle is only enqueued on the design screen, so this is
	// the "loaded somewhere unexpected" case rather than a misconfiguration.
	if ( ! data || typeof data !== 'object' ) {
		return;
	}

	const container = document.getElementById( data.elementId );

	if ( ! container ) {
		return;
	}

	const { postId, postType } = data;

	if ( ! postId ) {
		throw new Error( 'JetpackEmailDesignEditor.postId is required.' );
	}

	if ( ! postType ) {
		throw new Error( 'JetpackEmailDesignEditor.postType is required.' );
	}

	createRoot( container ).render(
		<StrictMode>
			<ExperimentalEmailEditor
				postId={ postId }
				postType={ postType }
				config={ buildEditorConfig( data ) }
			/>
		</StrictMode>
	);
}

if ( document.readyState === 'loading' ) {
	document.addEventListener( 'DOMContentLoaded', mountEmailDesignEditor, { once: true } );
} else {
	mountEmailDesignEditor();
}
