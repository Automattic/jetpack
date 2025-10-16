/**
 * External dependencies
 */
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';

const FORMS_VIEW_CONFIG_KEY = 'jetpack-forms-dataviews-forms-view';

export const defaultLayouts = {
	table: {
		layout: {
			primaryField: 'title',
			styles: {
				title: {
					width: '40%',
				},
				responses: {
					width: '15%',
				},
				modified: {
					width: '25%',
				},
				date: {
					width: '20%',
				},
			},
		},
	},
};

/**
 * Get default view configuration.
 *
 * @return {object} Default view configuration.
 */
const getDefaultView = () => {
	return {
		type: 'table',
		perPage: 20,
		page: 1,
		sort: {
			field: 'modified',
			direction: 'desc',
		},
		search: '',
		filters: [],
		hiddenFields: [],
		layout: defaultLayouts.table.layout,
	};
};

/**
 * Custom hook to manage the view state for forms DataViews.
 *
 * @return {Array} View state and setter function.
 */
export function useView() {
	const [ view, setViewState ] = useState( () => {
		const storedView = localStorage.getItem( FORMS_VIEW_CONFIG_KEY );
		if ( storedView ) {
			try {
				return JSON.parse( storedView );
			} catch ( e ) {
				// If parsing fails, return default view
				return getDefaultView();
			}
		}
		return getDefaultView();
	} );

	const setView = useCallback( newView => {
		setViewState( newView );
		localStorage.setItem( FORMS_VIEW_CONFIG_KEY, JSON.stringify( newView ) );
	}, [] );

	return [ view, setView ];
}
