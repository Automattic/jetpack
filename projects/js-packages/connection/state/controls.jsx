/**
 * External dependencies
 */
import restApi from '@automattic/jetpack-api';

const FETCH_CONNECTION_STATUS = () => {
	return new Promise( ( resolve, reject ) => {
		restApi
			.fetchSiteConnectionStatus()
			.then( result => resolve( result ) )
			.catch( error => reject( error ) );
	} );
};

export default {
	FETCH_CONNECTION_STATUS,
};
