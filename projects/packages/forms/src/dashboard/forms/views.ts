import { useCallback, useEffect, useState } from '@wordpress/element';
import { useSearchParams } from 'react-router';

const LAYOUT_TABLE = 'table';

export const defaultView = {
	type: LAYOUT_TABLE,
	search: '',
	filters: [],
	page: 1,
	perPage: 20,
	fields: [ 'title', 'entries', 'status', 'modified', 'actions' ],
};

export const defaultLayouts = {
	[ LAYOUT_TABLE ]: {},
};

/**
 * Manage the DataViews view state for the Forms list and keep `search` in sync with the URL.
 *
 * @return {[Object, Function]} The current DataViews view and a setter that updates the URL.
 */
export function useView() {
	const [ searchParams, setSearchParams ] = useSearchParams();
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
