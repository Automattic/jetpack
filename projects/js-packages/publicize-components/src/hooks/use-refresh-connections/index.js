import { useDebounce } from '@wordpress/compose';
import { useRef } from '@wordpress/element';
import { usePageVisibility } from 'react-page-visibility';
import useSelectSocialMediaConnections from '../use-social-media-connections';

/**
 * Hook that provides a function to refresh the connections.
 *
 * @returns { object } The refreshAutoConversionSettings function.
 */
export default function useRefreshConnections() {
	const shouldAutoRefresh = useRef( false );
	const pageHasFocus = usePageVisibility();
	const { refresh: refreshConnections } = useSelectSocialMediaConnections();
	const debouncedRefresh = useDebounce( refreshConnections, 2000 );

	return () => {
		if ( ! pageHasFocus ) {
			shouldAutoRefresh.current = true;
			debouncedRefresh.cancel();
		}

		if ( pageHasFocus && shouldAutoRefresh.current ) {
			debouncedRefresh();
			shouldAutoRefresh.current = false;
		}
	};
}
