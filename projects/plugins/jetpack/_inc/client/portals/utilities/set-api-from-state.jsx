/**
 * External Dependencies
 */
import { useEffect } from 'react';
import { connect } from 'react-redux';

/**
 * Internal Dependencies
 */
import { getApiNonce, getApiRootUrl } from 'state/initial-state';
import restApi from '@automattic/jetpack-api';

/**
 * Component to set API variables from state
 *
 * @param {object} props - api information
 * @returns {*} - wrapped react contents
 */
function SetAPIFromState( props ) {
	const { apiRoot, apiNonce } = props;

	/**
	 * Initialize the REST API.
	 */
	useEffect( () => {
		restApi.setApiRoot( apiRoot );
		restApi.setApiNonce( apiNonce );
	}, [ apiRoot, apiNonce ] );

	return null;
}

export default connect( state => {
	return {
		apiRoot: getApiRootUrl( state ),
		apiNonce: getApiNonce( state ),
	};
} )( SetAPIFromState );
