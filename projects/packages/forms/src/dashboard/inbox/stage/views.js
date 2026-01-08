/**
 * WordPress dependencies
 */
import { useEvent } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { useSearchParams } from 'react-router';

const LAYOUT_TABLE = 'table';

export const defaultView = {
	type: LAYOUT_TABLE,
	search: '',
	filters: [],
	page: 1,
	perPage: 20,
	titleField: 'from',
	fields: [ 'date', 'form', 'ip' ],
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
	const urlForm = searchParams.get( 'form' );
	const [ view, setView ] = useState( () => ( {
		...defaultView,
		search: urlSearch ?? '',
		filters: urlForm ? [ { field: 'form', operator: 'is', value: urlForm } ] : defaultView.filters,
	} ) );

	const getFormFilterValue = currentView => {
		const filter = currentView.filters?.find( f => f.field === 'form' );
		return filter?.value ?? null;
	};

	// When view changes, update the URL params if needed.
	const setViewWithUrlUpdate = useEvent( newView => {
		setView( newView );
		const formFilterValue = getFormFilterValue( newView );
		const shouldUpdateSearch = newView.search !== urlSearch;
		const shouldUpdateForm = ( urlForm ?? null ) !== ( formFilterValue ?? null );

		if ( shouldUpdateSearch || shouldUpdateForm ) {
			setSearchParams( previousSearchParams => {
				const _searchParams = new URLSearchParams( previousSearchParams );
				if ( shouldUpdateSearch && newView.search ) {
					_searchParams.set( 'search', newView.search );
				} else if ( shouldUpdateSearch ) {
					_searchParams.delete( 'search' );
				}
				if ( shouldUpdateForm && formFilterValue ) {
					_searchParams.set( 'form', formFilterValue );
				} else if ( shouldUpdateForm ) {
					_searchParams.delete( 'form' );
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

	const onUrlFormChange = useEvent( () => {
		setView( previousView => {
			const currentValue = getFormFilterValue( previousView );
			const newValue = urlForm ?? null;

			if ( currentValue === newValue ) {
				return previousView;
			}

			const nextFilters = ( previousView.filters || [] ).filter( f => f.field !== 'form' );
			if ( newValue ) {
				nextFilters.push( { field: 'form', operator: 'is', value: newValue } );
			}

			return {
				...previousView,
				filters: nextFilters,
			};
		} );
	} );

	useEffect( () => {
		onUrlFormChange();
	}, [ onUrlFormChange, urlForm ] );

	return [ view, setViewWithUrlUpdate ];
}
