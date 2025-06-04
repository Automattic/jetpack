/**
 * WordPress dependencies
 */
import { useEvent } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { useSearchParams } from 'react-router-dom';

export const LAYOUT_TABLE = 'table';
export const LAYOUT_LIST = 'list';

const defaultView = {
	type: LAYOUT_LIST,
	search: '',
	filters: [],
	page: 1,
	perPage: 20,
	titleField: 'from',
	fields: [ 'date', 'source' ],
};

export const defaultLayouts = {
	[ LAYOUT_LIST ]: {},
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
	const [ view, setView ] = useState( newView => ( {
		...defaultView,
		...newView,
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
