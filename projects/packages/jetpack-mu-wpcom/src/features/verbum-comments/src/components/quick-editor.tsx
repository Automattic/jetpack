import { GravatarQuickEditorCore } from '@gravatar-com/quick-editor';

const UPDATE_DELAY = 2000; // Some time for the caches to clear

const LOCALE_MAP = {
	en: '',
	zh_TW: 'zh-TW',
	fr_ca: 'fr-CA',
};

const getLocale = ( locale: string ) => {
	// Convert special locales to Gravatar locales
	if ( LOCALE_MAP[ locale ] ) {
		return LOCALE_MAP[ locale ];
	}

	return locale.replace( /_.*$/, '' );
};

/**
 * Creates and returns a GravatarQuickEditorCore instance for managing hovercards.
 *
 * @param {string}                           email          - The email address associated with the hovercard.
 * @param {(value: boolean) => void}         setIsLoading   - Function to update the loading state.
 * @param {(value: number) => void}          setCacheBuster - Function to update the cache buster value.
 * @param {string | number | NodeJS.Timeout} timer          - Timer used for delaying updates.
 * @return {GravatarQuickEditorCore} - A new instance of GravatarQuickEditorCore.
 */
export default function getQuickEditor(
	email: string,
	setIsLoading: ( value: boolean ) => void,
	setCacheBuster: ( value: number ) => void,
	timer: string | number | NodeJS.Timeout
): GravatarQuickEditorCore {
	return new GravatarQuickEditorCore( {
		scope: [ 'avatars' ],
		email: email,
		locale: getLocale( VerbumComments?.currentLocale || '' ),
		utm: 'jetpack-comments',
		onProfileUpdated: () => {
			setIsLoading( true );

			clearTimeout( timer );

			// Reload the new avatar
			timer = setTimeout( () => {
				setIsLoading( false );
				setCacheBuster( new Date().getTime() );
				timer = null;
			}, UPDATE_DELAY );
		},
	} );
}
