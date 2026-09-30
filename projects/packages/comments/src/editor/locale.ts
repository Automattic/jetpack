import { setLocaleData } from '@wordpress/i18n';
import type { LocaleData } from '@wordpress/i18n';

declare global {
	interface Window {
		/** Core's translations for the editor, handed over before the chunk loads. */
		jetpackCommentsEditorLocale?: LocaleData;
		/** The toolbar's accessible name on the edit-comment screen, translated in PHP. */
		jetpackCommentsEditorLabels: { blockTools: string };
	}
}

// Imported first, so it runs before any editor module reads a string; some
// translate theirs as they load.
if ( window.jetpackCommentsEditorLocale ) {
	setLocaleData( window.jetpackCommentsEditorLocale );
}
