/**
 * External dependencies
 */
import { dateI18n } from '@wordpress/date';
import { map } from 'lodash';
import { getPath } from '../inbox/util';

export const isFetchingResponses = state => state.loading;

export const getResponses = state =>
	map( state.responses, response => {
		return {
			...response,
			date: dateI18n( 'M j, Y', response.date ),
			source: response.entry_title || getPath( response ),
			name: response.author_name || response.author_email || response.author_url || response.ip,
		};
	} );

export const getTotalResponses = state => state.total;

export const getCurrentPage = state => state.currentPage;

export const getResponsesQuery = state => state.query;

export const getMonthFilter = state => state.filters.month || [];

export const getSourceFilter = state => state.filters.source || [];

export const getSelectedResponseIds = state => state.currentSelection;
