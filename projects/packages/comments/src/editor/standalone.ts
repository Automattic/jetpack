// First, so the lazy editor chunk and its stylesheet resolve against this script's URL.
import './standalone-public-path';
import type { StandaloneEditor } from '../shared/types';

// For a host that is not the comment form, such as the WordPress.com Reader. Jetpack sites
// never load this file; it shares the editor chunk the form and the edit-comment screen load.
const load: StandaloneEditor[ 'load' ] = ( { locale, assetsUrl } = {} ) => {
	if ( assetsUrl ) {
		// @ts-expect-error: __webpack_public_path__ is set globally by webpack, ignore TS2304
		__webpack_public_path__ = assetsUrl;
	}
	// The chunk reads its translations as it loads.
	if ( locale ) {
		window.jetpackCommentsEditorLocale = locale;
	}

	return import( /* webpackChunkName: "editor" */ '.' );
};

window.JetpackCommentsEditor = { load };
