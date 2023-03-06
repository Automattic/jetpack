/**
 * External dependencies
 */
import { dateI18n } from '@wordpress/date';
import { map } from 'lodash';

export const isFetchingResponses = state => state.loading;

export const getResponses = state =>
	map( state.responses, response => {
		return {
			...response,
			date: dateI18n( 'F j, Y', response.date ),
			source: response.entry_title,
			name: response.author_name || response.author_email || response.author_url || response.ip,
		};
	} );

export const getTotalResponses = state => state.total;

export const getCurrentPage = state => state.currentPage;

export const getSearch = state => state.search;
