import { decodeEntities } from '@wordpress/html-entities';

// PHP encodes a map with sequential keys as a JSON array, so keep whichever shape arrived.
const mapValues = ( collection, callback ) =>
	Array.isArray( collection )
		? collection.map( callback )
		: Object.fromEntries(
				Object.entries( collection ).map( ( [ key, value ] ) => [ key, callback( value ) ] )
			);

const decodeKeys = ( object, keys ) => {
	const decoded = { ...object };

	keys.forEach( key => {
		if ( object[ key ] ) {
			decoded[ key ] = decodeEntities( object[ key ] );
		}
	} );

	return decoded;
};

const decodeErrorMessage = error =>
	error && typeof error === 'object' ? decodeKeys( error, [ 'error_message' ] ) : error;

/**
 * Decode the display names in the initial state, which WordPress stores HTML-encoded.
 *
 * @param {object} state - What PHP put on the page.
 * @return {object} The same state with its display names as plain text.
 */
const decodeInitialState = state => {
	const { userConnectionData, connectionOwner, connectionErrors } = state;
	const decoded = { ...state };

	if ( userConnectionData ) {
		decoded.userConnectionData = decodeKeys( userConnectionData, [ 'connectionOwner' ] );

		const { currentUser } = userConnectionData;

		if ( currentUser ) {
			decoded.userConnectionData.currentUser = decodeKeys( currentUser, [ 'displayName' ] );

			// WordPress.com stores its display names HTML-encoded too.
			if ( currentUser.wpcomUser ) {
				decoded.userConnectionData.currentUser.wpcomUser = decodeKeys( currentUser.wpcomUser, [
					'display_name',
				] );
			}
		}
	}

	if ( connectionOwner ) {
		decoded.connectionOwner = decodeKeys( connectionOwner, [ 'displayName' ] );
	}

	// The owner-error message names the owner. Keyed by error code, then by user ID.
	if ( connectionErrors && typeof connectionErrors === 'object' ) {
		decoded.connectionErrors = mapValues( connectionErrors, byUser =>
			byUser && typeof byUser === 'object' ? mapValues( byUser, decodeErrorMessage ) : byUser
		);
	}

	return decoded;
};

export default decodeInitialState;
