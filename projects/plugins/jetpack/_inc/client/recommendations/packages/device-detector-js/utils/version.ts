import { trim } from './trim';

export const formatVersion = ( version: string | undefined ): string => {
	if ( version === undefined ) {
		return '';
	}

	const versionString = trim( version, '. ' ).replace( new RegExp( '_', 'g' ), '.' );
	const versionParts = versionString.split( '.' );

	// Return if the string is not only digits once we removed the dots
	if ( ! /^\d+$/.test( versionParts.join( '' ) ) ) {
		return versionString;
	}

	return versionString;
};
