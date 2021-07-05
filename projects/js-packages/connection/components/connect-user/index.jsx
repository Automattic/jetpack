/**
 * External dependencies
 */
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import restApi from '../../tools/jetpack-rest-api-client';

/**
 * The user connection component.
 *
 * @param {object} props -- The properties.
 * @param {Function} props.redirectFunc -- The redirect function (`window.location.assign()` by default).
 * @param {string} props.connectUrl -- The authorization URL (no-iframe).
 * @param {string} props.redirectUri -- The redirect admin URI.
 * @param {string} props.from -- Where the connection request is coming from.
 *
 * @returns {null} -- Nothing to return.
 */
const ConnectUser = props => {
	const { redirectFunc, connectUrl, redirectUri, from } = props;

	const [ authorizationUrl, setAuthorizationUrl ] = useState( null );

	if ( connectUrl && connectUrl !== authorizationUrl ) {
		setAuthorizationUrl( connectUrl );
	}

	/**
	 * Fetch the authorization URL on the first render.
	 * To be only run once.
	 */
	useEffect( () => {
		if ( ! authorizationUrl ) {
			restApi
				.fetchAuthorizationUrl( redirectUri )
				.then( response => setAuthorizationUrl( response.authorizeUrl ) )
				.catch( error => {
					throw error;
				} );
		}
	}, [] ); // eslint-disable-line react-hooks/exhaustive-deps

	if ( ! authorizationUrl ) {
		return null;
	}

	redirectFunc(
		authorizationUrl +
			( from
				? ( authorizationUrl.includes( '?' ) ? '&' : '?' ) + 'from=' + encodeURIComponent( from )
				: '' )
	);
	return null;
};

ConnectUser.propTypes = {
	connectUrl: PropTypes.string,
	redirectUri: PropTypes.string.isRequired,
	from: PropTypes.string,
	redirectFunc: PropTypes.func,
};

ConnectUser.defaultProps = {
	redirectFunc: url => window.location.assign( url ),
};

export default ConnectUser;
