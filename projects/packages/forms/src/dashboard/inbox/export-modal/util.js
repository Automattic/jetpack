import { config } from '../../';

/**
 * Makes an export request.
 *
 * @param  {string}  action    - Action name.
 * @param  {string}  nonceName - Nonce name.
 * @param  {object}  query     - Query parameters.
 * @param  {Array}   selection - Selected IDs.
 * @returns {Promise}           - Request promise.
 */
export const exportResponses = ( action, nonceName, query, selection ) => {
	const data = new FormData();

	data.append( 'action', action );
	data.append( nonceName, config( 'exportNonce' ) );
	data.append( 'selected', selection );

	data.append( 'date', null );
	data.append( 'post', null );
	data.append( 'search', query.search );
	data.append( 'status', query.status );

	return fetch( window.ajaxurl, { method: 'POST', body: data } );
};
