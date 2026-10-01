import { setLocaleData } from '@wordpress/i18n';

// Imported first, so it runs before any editor module reads a string; some
// translate theirs as they load.
if ( window.jetpackCommentsEditorLocale ) {
	setLocaleData( window.jetpackCommentsEditorLocale );
}
