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
	fields: [ 'title', 'modified', 'responses', 'actions' ],
};

export const defaultLayouts = {
	[ LAYOUT_TABLE ]: {},
};

/**
 * Hook to manage view state for the Forms list based on URL parameters.
 *
 * Currently only syncs the `search` parameter with the URL.
 *
 * @return {[typeof defaultView, ( newView: typeof defaultView ) => void]} The [ state, setState ] tuple.
 */
export function useView() {
	const [ searchParams, setSearchParams ] = useSearchParams();
	const urlSearch = searchParams.get( 'search' );
	const [ view, setView ] = useState( () => ( {
		...defaultView,
		search: urlSearch ?? '',
	} ) );

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

	return [ view, setViewWithUrlUpdate ] as const;
}
