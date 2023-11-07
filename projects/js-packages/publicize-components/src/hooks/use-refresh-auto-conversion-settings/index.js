import { useDispatch } from '@wordpress/data';
import { useRef } from '@wordpress/element';
import { usePageVisibility } from 'react-page-visibility';
import { SOCIAL_STORE_ID } from '../../social-store';

/**
 * Hook that provides a function to refresh the auto conversion settings, when the page regains focus.
 *
 * @returns { object } The refreshAutoConversionSettings function.
 */
export default function useRefreshAutoConversionSettings() {
	const pageHasFocus = usePageVisibility();
	const shouldAutoRefresh = useRef( false );
	const refreshOptions = useDispatch( SOCIAL_STORE_ID ).refreshAutoConversionSettings;

	const refreshAutoConversionSettings = () => {
		if ( ! pageHasFocus ) {
			shouldAutoRefresh.current = true;
		}

		if ( pageHasFocus && shouldAutoRefresh.current ) {
			refreshOptions();
			shouldAutoRefresh.current = false;
		}
	};

	return { refreshAutoConversionSettings };
}
