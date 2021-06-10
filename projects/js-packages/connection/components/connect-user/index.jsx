/**
 * External dependencies
 */
import React, { useState, useEffect } from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';

/**
 * Internal dependencies
 */
import InPlaceConnection from '../in-place-connection';
import restApi from '../../tools/jetpack-rest-api-client';

/**
 * The user connection component.
 *
 * @param {object} props -- The properties.
 * @param {Function} props.redirectFunc -- The redirect function (`window.location.assign()` by default).
 * @param {string} props.connectUrl -- The authorization URL (no-iframe).
 * @param {string} props.redirectUri -- The redirect admin URI.
 * @param {string} props.inPlaceTitle -- The title for the In-Place Connection component.
 * @param {boolean} props.forceCalypsoFlow -- Whether to go straight to Calypso flow, skipping the In-Place flow.
 * @param {Function} props.onComplete -- The callback to be called when the connection is fully established.
 * @param {string} props.from -- Where the connection request is coming from.
 * @param {boolean} props.displayTOS -- Whether the site has connection owner connected.
 *
 * @returns {React.Component} The RNA connection component.
 */
const ConnectUser = props => {
	const {
		redirectFunc,
		connectUrl,
		redirectUri,
		inPlaceTitle,
		forceCalypsoFlow,
		from,
		onComplete,
		displayTOS,
	} = props;

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

	if ( forceCalypsoFlow ) {
		redirectFunc(
			authorizationUrl +
				( from
					? ( authorizationUrl.includes( '?' ) ? '&' : '?' ) + 'from=' + encodeURIComponent( from )
					: '' )
		);
		return null;
	}

	return (
		<InPlaceConnection
			connectUrl={ authorizationUrl }
			title={ inPlaceTitle }
			onComplete={ onComplete }
			displayTOS={ displayTOS }
		/>
	);
};

ConnectUser.propTypes = {
	connectUrl: PropTypes.string,
	redirectUri: PropTypes.string.isRequired,
	inPlaceTitle: PropTypes.string,
	forceCalypsoFlow: PropTypes.bool,
	onComplete: PropTypes.func,
	from: PropTypes.string,
	displayTOS: PropTypes.bool.isRequired,
	redirectFunc: PropTypes.func,
};

ConnectUser.defaultProps = {
	redirectFunc: url => window.location.assign( url ),
	inPlaceTitle: __( 'Connect your WordPress.com account', 'jetpack' ),
	forceCalypsoFlow: false,
};

export default ConnectUser;
