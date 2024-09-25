import { Hovercards } from '@gravatar-com/hovercards';
import { translate } from '../../i18n';

const convertJsonToUser = ( profile, avatarUrl: string ) => {
	// Bit of a nuisance that we have to convert like this
	const {
		hash,
		display_name: displayName,
		description,
		profile_url: profileUrl,
		company,
		location,
		job_title: jobTitle,
		verified_accounts: verifiedAccounts,
	} = profile;

	return {
		hash,
		displayName,
		description,
		avatarUrl,
		profileUrl,
		company,
		location,
		jobTitle,
		verifiedAccounts: verifiedAccounts.map(
			( { url, service_label, service_icon, service_type, is_hidden } ) => ( {
				url,
				label: service_label,
				icon: service_icon,
				type: service_type,
				isHidden: is_hidden,
			} )
		),
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

const getGravatarProfile = async ( email: string, avatarUrl: string ) => {
	const hash = await generateSHA256Hash( email );

	return fetch( `https://api.gravatar.com/v3/profiles/${ hash }?source=hovercard` )
		.then( res => {
			if ( res.status !== 200 ) {
				throw new Error();
			}

			return res.json();
		} )
		.then( profile => convertJsonToUser( profile, avatarUrl ) );
};

export const getHovercard = async ( email: string ) => {
	const avatarUrl = `https://gravatar.com/avatar/${ email }`;
	let hovercardData = null;

	try {
		hovercardData = await getGravatarProfile( email, avatarUrl );
	} catch ( error ) {
		hovercardData = {
			hash: email,
			displayName: translate( 'Unknown User' ),
			avatarUrl: 'https://gravatar.com/images/gravatars/mysteryman.png',
			profileUrl: 'https://gravatar.com/connect/?email=' + encodeURIComponent( email ),
			description: translate(
				'This site uses Gravatar to manage avatars and profiles, but we can’t find an account for this email address.'
			),
			isUnknown: true,
		};
	}

	return Hovercards.createHovercard( hovercardData, {
		i18n: {
			'View profile': hovercardData.isUnknown
				? translate( 'Is this you? Claim your free profile' )
				: translate( 'View profile' ),
		},
	} );
};
