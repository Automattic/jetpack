/**
 * The Gravatar quick editor, opened from the avatar in the footer.
 */

import { GravatarQuickEditorCore } from '@gravatar-com/quick-editor';

// Gravatar's own codes for the locales it spells differently from WordPress.
const LOCALES: Record< string, string > = {
	en: '',
	zh_TW: 'zh-TW',
	fr_ca: 'fr-CA',
};

let editor: GravatarQuickEditorCore | null = null;
let onUpdated: () => void = () => {};

/**
 * Open the editor for an email. With none, Gravatar edits the account the reader logs in to.
 *
 * @param email   - The address whose avatar to edit.
 * @param updated - Called once Gravatar reports a change.
 */
export const openGravatarEditor = ( email: string, updated: () => void ) => {
	onUpdated = updated;

	if ( ! editor ) {
		const locale = JetpackComments.locale;

		editor = new GravatarQuickEditorCore( {
			scope: [ 'avatars' ],
			email,
			locale: locale in LOCALES ? LOCALES[ locale ] : locale.replace( /_.*$/, '' ),
			utm: 'jetpack-comments',
			onProfileUpdated: () => onUpdated(),
		} );
	}

	editor.open( email );
};
