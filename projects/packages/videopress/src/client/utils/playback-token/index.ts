/**
 * Extracts the expire time from a JWT token
 *
 * @param {string} jwt - The JWT token to extract the expire time
 * @returns {number} The expire timestamp for the token
 */
const getJWTExpireTime = ( jwt: string ): number => {
	try {
		const encodedPayload = jwt.split( '.' )[ 1 ];
		const jwtPayload = JSON.parse( Buffer.from( encodedPayload, 'base64' ).toString() );

		return jwtPayload.exp;
	} catch ( e ) {
		return null;
	}
};

/**
 * Check if some JWT token has expired
 *
 * @param {string} jwt - The JWT to verify
 * @returns {boolean} If the token had expired or not
 */
export const playbackTokenExpired = ( jwt: string ): boolean => {
	if ( jwt ) {
		const jwtExpireTime = getJWTExpireTime( jwt );
		if ( jwtExpireTime ) {
			return jwtExpireTime <= Date.now();
		}
	}

	return true;
};
