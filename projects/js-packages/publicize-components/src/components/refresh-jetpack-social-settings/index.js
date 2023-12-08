import { useDispatch } from '@wordpress/data';
import { SOCIAL_STORE_ID } from '../../social-store';

/**
 * HOC that refreshes all of the Jetpack Social settings in the store, to be used in class components.
 *
 * @param {object} props - The component props.
 * @param {boolean} props.shouldRefresh - Whether or not to refresh the settings.
 * @param {object} props.children - The children to render.
 * @returns { object } The refreshJetpackSocialSettings function.
 */
export default function RefreshJetpackSocialSettingsWrapper( { shouldRefresh, children } ) {
	const refreshOptions = useDispatch( SOCIAL_STORE_ID ).refreshJetpackSocialSettings;

	if ( shouldRefresh ) {
		refreshOptions();
	}

	return children;
}
