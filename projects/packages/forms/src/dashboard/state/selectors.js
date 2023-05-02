/**
 * External dependencies
 */
import { map } from 'lodash';
import { getPath } from '../inbox/util';

export const isFetchingResponses = state => state.loading;

export const getResponses = state =>
	map( state.responses, response => {
		return {
			...response,
			source: response.entry_title || getPath( response ),
			name: response.author_name || response.author_email || response.author_url || response.ip,
		};
	} );

export const getTabTotals = state => state.tabTotals || {};

export const getTotalResponses = state => state.total;

export const getCurrentPage = state => state.currentPage;

export const getResponsesQuery = state => state.query;

export const getMonthFilter = state => state.filters.month || [];

export const getSourceFilter = state => state.filters.source || [];

export const getSelectedResponseIds = state => state.currentSelection;
