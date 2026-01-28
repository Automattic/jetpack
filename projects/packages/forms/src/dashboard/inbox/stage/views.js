/**
 * WordPress dependencies
 */
import { useEvent } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { useDashboardSearchParams } from '../../router/dashboard-search-params-context.tsx';

const LAYOUT_TABLE = 'table';

export const defaultView = {
	type: LAYOUT_TABLE,
	search: '',
	filters: [],
	page: 1,
	perPage: 20,
	titleField: 'from',
	fields: [ 'date', 'source', 'ip' ],
};

export const defaultLayouts = {
	[ LAYOUT_TABLE ]: {},
};

/**
 * This hook provides a [ state, setState ] tuple based on the URL parameters
 * and handles the syncing between the URL and the state.
 *
 * Currently we do that for the `status` and `search` URL params.
 *
 * @return {Array} The [ state, setState ] tuple.
 */
export function useView() {
	const [ searchParams, setSearchParams ] = useDashboardSearchParams();
	// Normalize missing query param to empty string so we don't treat
	// `null` (missing) and `''` (empty) as different values.
	const urlSearch = searchParams.get( 'search' ) ?? '';
	const [ view, setView ] = useState( () => ( {
		...defaultView,
		search: urlSearch,
	} ) );
	// When view changes, update the URL params if needed.
	const setViewWithUrlUpdate = useEvent( nextView => {
		// Support both "setView(newView)" and "setView(prev => next)" call styles,
		// since callers treat this like a normal React setState setter.
		setView( previousView => {
			const resolvedView = typeof nextView === 'function' ? nextView( previousView ) : nextView;

			if ( resolvedView.search !== urlSearch ) {
				setSearchParams( previousSearchParams => {
					const _searchParams = new URLSearchParams( previousSearchParams );
					if ( resolvedView.search ) {
						_searchParams.set( 'search', resolvedView.search );
					} else {
						_searchParams.delete( 'search' );
					}
					return _searchParams;
				} );
			}

			return resolvedView;
		} );
	} );
	// When search URL param changes, update the view's search filter
	// without affecting any other config.
	const onUrlSearchChange = useEvent( () => {
		setView( previousView => {
			const newValue = urlSearch;
			if ( newValue === previousView.search ) {
				return previousView;
			}
			return {
				...previousView,
				search: newValue,
			};
		} );
	} );
	useEffect( () => {
		onUrlSearchChange();
	}, [ onUrlSearchChange, urlSearch ] );
	return [ view, setViewWithUrlUpdate ];
}
