interface GravatarProfile {
	display_name?: string;
	profile_url?: string;
	avatar_url?: string;
}

export interface CommentUser {
	displayName: string;
	profileUrl: string;
	avatarUrl: string;
	email: string;
	emailHash: string;
}

const convertJsonToUser = (
	profile: GravatarProfile,
	email: string,
	emailHash: string
): CommentUser => {
	return {
		displayName: profile.display_name || '',
		profileUrl: profile?.profile_url || '',
		avatarUrl: profile?.avatar_url || '',
		email,
		emailHash,
	};
};

const generateSHA256Hash = async ( data: string ) => {
	// Encode the data as UTF-8
	const encoder = new TextEncoder();
	const dataBuffer = encoder.encode( data );

	// Compute the hash
	const hashBuffer = await window.crypto.subtle.digest( 'SHA-256', dataBuffer );

	// Convert the hash to a hexadecimal string
	const hashArray = Array.from( new Uint8Array( hashBuffer ) );
	return hashArray.map( byte => byte.toString( 16 ).padStart( 2, '0' ) ).join( '' );
};

export const getProfile = async ( email: string ) => {
	const emailHash = await generateSHA256Hash( email.toLowerCase() );

	try {
		const response = await fetch(
			`https://api.gravatar.com/v3/profiles/${ emailHash }?source=hovercard`
		);
		if ( response.status !== 200 ) {
			return null;
		}

		const profile = await response.json();
		return convertJsonToUser( profile, email, emailHash );
	} catch {
		return null;
	}
};
