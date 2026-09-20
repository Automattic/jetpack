import { GravatarQuickEditorCore } from '@gravatar-com/quick-editor';

let editor: GravatarQuickEditorCore | null = null;
let onUpdated: () => void = () => {};

export const openGravatarEditor = ( email: string, updated: () => void ) => {
	onUpdated = updated;

	if ( ! editor ) {
		const { locale } = JetpackComments;

		editor = new GravatarQuickEditorCore( {
			scope: [ 'avatars' ],
			email,
			// Gravatar serves the editor from a per-language subdomain; only Chinese has a regional one.
			locale: locale === 'zh_TW' ? 'zh-TW' : locale.replace( /_.*$/, '' ),
			utm: 'jetpack-comments',
			onProfileUpdated: () => onUpdated(),
		} );
	}

	editor.open( email );
};
