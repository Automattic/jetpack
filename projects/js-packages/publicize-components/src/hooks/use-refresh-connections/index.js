import { useDebounce } from '@wordpress/compose';
import { useRef } from '@wordpress/element';
import { usePageVisibility } from 'react-page-visibility';
import useSelectSocialMediaConnections from '../use-social-media-connections';

/**
 * Hook that provides a function to refresh the connections.
 *
 * @returns { object } The refreshConnections function.
 */
export default function useRefreshConnections() {
	const shouldAutoRefresh = useRef( false );
	const isInitialRefresh = useRef( true );

	const pageHasFocus = usePageVisibility();
	const { refresh: refreshConnections } = useSelectSocialMediaConnections();

	const initialRefresh = useDebounce( refreshConnections, 0 );
	const debouncedRefresh = useDebounce( refreshConnections, 2000 );

	return () => {
		if ( isInitialRefresh.current ) {
			initialRefresh();
			isInitialRefresh.current = false;
		}

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
