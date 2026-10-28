import { loadEditor } from '../textarea/load-editor';
import type { EditorLoader } from '../shared/types';

// For a host that is not the comment form, such as the WordPress.com Reader. Jetpack sites
// never load this file; it shares the editor chunk the form and the edit-comment screen load.

// A module script or one a host inlined has no current script, so that host passes load() an assetsUrl.
const script = document.currentScript;

if ( script instanceof HTMLScriptElement && script.src ) {
	__webpack_public_path__ = script.src.replace( /[?#].*$/, '' ).replace( /[^/]*$/, '' );
}

const load: EditorLoader[ 'load' ] = ( { locale, assetsUrl } = {} ) => {
	if ( assetsUrl ) {
		__webpack_public_path__ = assetsUrl;
	}

	return loadEditor( locale );
};

window.JetpackCommentsEditor = { load };
