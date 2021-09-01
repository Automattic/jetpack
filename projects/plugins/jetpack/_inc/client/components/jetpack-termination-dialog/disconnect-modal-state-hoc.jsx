/**
 * External Dependencies
 */
import { useMemo } from 'react';
import { connect } from 'react-redux';

/**
 * Internal Dependencies
 */
import { getApiNonce, getApiRootUrl } from 'state/initial-state';
import restApi from '@automattic/jetpack-api';

const useComponentWillMount = func => {
	// eslint-disable-next-line react-hooks/exhaustive-deps
	useMemo( func, [] );
};

// TODO: this may be better refactored as a custom hook to set up the API
/**
 * Wrapper to set up API for disconnection modal
 *
 * @param {object} props - api information
 * @returns {*} - wrapped react contents
 */
function DisconnectModalStateHOC( props ) {
	// NOTE: API root and nonce must be set before any components are mounted!
	const { apiRootUrl, apiNonce } = props;

	useComponentWillMount( () => {
		apiRootUrl && restApi.setApiRoot( apiRootUrl );
		apiNonce && restApi.setApiNonce( apiNonce );
	} );

	return props.children;
}

export default connect( state => {
	return {
		apiRootUrl: getApiRootUrl( state ),
		apiNonce: getApiNonce( state ),
	};
} )( DisconnectModalStateHOC );
