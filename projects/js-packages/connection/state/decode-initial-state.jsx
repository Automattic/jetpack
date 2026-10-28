import { decodeEntities } from '@wordpress/html-entities';

// PHP encodes a map with sequential keys as a JSON array, so keep whichever shape arrived.
const mapValues = ( collection, callback ) =>
	Array.isArray( collection )
		? collection.map( callback )
		: Object.fromEntries(
				Object.entries( collection ).map( ( [ key, value ] ) => [ key, callback( value ) ] )
			);

const decodeErrorMessage = error =>
	error?.error_message ? { ...error, error_message: decodeEntities( error.error_message ) } : error;

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
		decoded.userConnectionData = { ...userConnectionData };

		const { currentUser } = userConnectionData;

		if ( currentUser ) {
			decoded.userConnectionData.currentUser = { ...currentUser };

			if ( currentUser.displayName ) {
				decoded.userConnectionData.currentUser.displayName = decodeEntities(
					currentUser.displayName
				);
			}

			// WordPress.com stores its display names HTML-encoded too.
			if ( currentUser.wpcomUser?.display_name ) {
				decoded.userConnectionData.currentUser.wpcomUser = {
					...currentUser.wpcomUser,
					display_name: decodeEntities( currentUser.wpcomUser.display_name ),
				};
			}
		}

		if ( userConnectionData.connectionOwner ) {
			decoded.userConnectionData.connectionOwner = decodeEntities(
				userConnectionData.connectionOwner
			);
		}
	}

	if ( connectionOwner?.displayName ) {
		decoded.connectionOwner = {
			...connectionOwner,
			displayName: decodeEntities( connectionOwner.displayName ),
		};
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
