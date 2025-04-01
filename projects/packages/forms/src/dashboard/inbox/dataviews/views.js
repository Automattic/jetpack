/**
 * WordPress dependencies
 */
import { useEvent } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { useSearchParams } from 'react-router-dom';

const LAYOUT_TABLE = 'table';

const defaultView = {
	type: LAYOUT_TABLE,
	search: '',
	filters: [],
	page: 1,
	perPage: 20,
	fields: [ 'from', 'date', 'source' ],
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
	const [ searchParams, setSearchParams ] = useSearchParams();
	const urlSearch = searchParams.get( 'search' );
	const [ view, setView ] = useState( () => ( {
		...defaultView,
		search: urlSearch ?? '',
	} ) );
	// When view changes, update the URL params if needed.
	const setViewWithUrlUpdate = useEvent( newView => {
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
	} );
	// When search URL param changes, update the view's search filter
	// without affecting any other config.
	const onUrlSearchChange = useEvent( () => {
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
	} );
	useEffect( () => {
		onUrlSearchChange();
	}, [ onUrlSearchChange, urlSearch ] );
	return [ view, setViewWithUrlUpdate ];
}
