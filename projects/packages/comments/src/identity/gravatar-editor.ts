import { GravatarQuickEditorCore } from '@gravatar-com/quick-editor';

const LOCALES: Record< string, string > = {
	en: '',
	zh_TW: 'zh-TW',
	fr_ca: 'fr-CA',
};

let editor: GravatarQuickEditorCore | null = null;
let onUpdated: () => void = () => {};

/**
 * Open the Gravatar quick editor.
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
