/**
 * External dependencies
 */
import { dateI18n } from '@wordpress/date';
import { map } from 'lodash';

export const isFetchingResponses = state => state.loading;

export const getResponses = state =>
	map( state.responses, response => {
		response.date = dateI18n( 'F j, Y', response.date );
		response.source = response.entry_title;
		response.name =
			response.author_name || response.author_email || response.author_url || response.ip;
		return response;
	} );

export const getTotalResponses = state => state.total;
