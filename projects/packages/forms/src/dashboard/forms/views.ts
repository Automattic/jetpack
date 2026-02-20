import { useCallback, useEffect, useState } from '@wordpress/element';
import { useDashboardSearchParams } from '../router/dashboard-search-params-context.tsx';
import type { View } from '@wordpress/dataviews/wp';

const LAYOUT_TABLE = 'table';

export const defaultView: View = {
	type: LAYOUT_TABLE,
	search: '',
	filters: [ { field: 'status', operator: 'is', value: 'all' } ],
	page: 1,
	perPage: 20,
	titleField: 'title',
	fields: [ 'entries', 'status', 'modified' ],
};

export const defaultLayouts = {
	[ LAYOUT_TABLE ]: {},
};

/**
 * Manage the DataViews view state for the Forms list and keep `search` in sync with the URL.
 *
 * @return {[typeof defaultView, (newView: typeof defaultView) => void]} The current DataViews view and a setter that updates the URL.
 */
export function useView() {
	const [ searchParams, setSearchParams ] = useDashboardSearchParams();
	const urlSearch = searchParams.get( 'search' );

	const [ view, setView ] = useState( () => ( {
		...defaultView,
		search: urlSearch ?? '',
	} ) );

	const setViewWithUrlUpdate = useCallback(
		newView => {
			setView( newView );
			if ( newView.search !== urlSearch ) {
				setSearchParams( previousSearchParams => {
					const _searchParams = new URLSearchParams( previousSearchParams );
					if ( newView.search ) {
						_searchParams.set( 'search', newView.search );
					} else {
						_searchParams.delete( 'search' );
					}
					return _searchParams;
				} );
			}
		},
		[ setSearchParams, urlSearch ]
	);

	const onUrlSearchChange = useCallback( () => {
		setView( previousView => {
			const newValue = urlSearch ?? '';
			if ( newValue === previousView.search ) {
				return previousView;
			}
			return {
				...previousView,
				search: newValue,
			};
		} );
	}, [ urlSearch ] );

	useEffect( () => {
		onUrlSearchChange();
	}, [ onUrlSearchChange, urlSearch ] );

	return [ view, setViewWithUrlUpdate ] as const;
}
