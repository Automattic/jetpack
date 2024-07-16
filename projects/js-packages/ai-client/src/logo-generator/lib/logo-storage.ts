/**
 * Types
 */
import { Logo } from '../store/types.js';
import { RemoveFromStorageProps, SaveToStorageProps, UpdateInStorageProps } from '../types.js';
import { mediaExists } from './media-exists.js';

const MAX_LOGOS = 10;

/**
 *
 * @param root0
 * @param root0.siteId
 * @param root0.url
 * @param root0.description
 * @param root0.mediaId
 */
export function stashLogo( { siteId, url, description, mediaId }: SaveToStorageProps ) {
	const storedContent = getSiteLogoHistory( siteId );

	const logo: Logo = {
		url,
		description,
		mediaId,
	};

	storedContent.push( logo );

	localStorage.setItem(
		`logo-history-${ siteId }`,
		JSON.stringify( storedContent.slice( -MAX_LOGOS ) )
	);

	return logo;
}

/**
 *
 * @param root0
 * @param root0.siteId
 * @param root0.url
 * @param root0.newUrl
 * @param root0.mediaId
 */
export function updateLogo( { siteId, url, newUrl, mediaId }: UpdateInStorageProps ) {
	const storedContent = getSiteLogoHistory( siteId );

	const index = storedContent.findIndex( logo => logo.url === url );

	if ( index > -1 ) {
		storedContent[ index ].url = newUrl;
		storedContent[ index ].mediaId = mediaId;
	}

	localStorage.setItem(
		`logo-history-${ siteId }`,
		JSON.stringify( storedContent.slice( -MAX_LOGOS ) )
	);

	return storedContent[ index ];
}

/**
 *
 * @param siteId
 */
export function getSiteLogoHistory( siteId: string ) {
	const storedString = localStorage.getItem( `logo-history-${ siteId }` );
	let storedContent: Logo[] = storedString ? JSON.parse( storedString ) : [];

	// Ensure that the stored content is an array
	if ( ! Array.isArray( storedContent ) ) {
		storedContent = [];
	}

	// Ensure a maximum of 10 logos are stored
	storedContent = storedContent.slice( -MAX_LOGOS );

	// Ensure that the stored content is an array of Logo objects
	storedContent = storedContent
		.filter( logo => {
			return (
				typeof logo === 'object' &&
				typeof logo.url === 'string' &&
				typeof logo.description === 'string'
			);
		} )
		.map( logo => ( {
			url: logo.url,
			description: logo.description,
			mediaId: logo.mediaId,
		} ) );

	return storedContent;
}

/**
 *
 * @param siteId
 */
export function isLogoHistoryEmpty( siteId: string ) {
	const storedContent = getSiteLogoHistory( siteId );

	return storedContent.length === 0;
}

/**
 *
 * @param root0
 * @param root0.siteId
 * @param root0.mediaId
 */
export function removeLogo( { siteId, mediaId }: RemoveFromStorageProps ) {
	const storedContent = getSiteLogoHistory( siteId );
	const index = storedContent.findIndex( logo => logo.mediaId === mediaId );

	if ( index === -1 ) {
		return;
	}

	storedContent.splice( index, 1 );
	localStorage.setItem( `logo-history-${ siteId }`, JSON.stringify( storedContent ) );
}

/**
 *
 * @param siteId
 */
export async function clearDeletedMedia( siteId: string ) {
	const storedContent = getSiteLogoHistory( siteId );

	const checks = storedContent
		.filter( ( { mediaId } ) => mediaId !== undefined )
		.map(
			( { mediaId } ) =>
				new Promise( ( resolve, reject ) => {
					mediaExists( { siteId, mediaId } )
						.then( exists => resolve( { mediaId, exists } ) )
						.catch( error => reject( error ) );
				} )
		);

	try {
		const responses = ( await Promise.all( checks ) ) as {
			mediaId: Logo[ 'mediaId' ];
			exists: boolean;
		}[];

		responses
			.filter( ( { exists } ) => ! exists )
			.forEach( ( { mediaId } ) => removeLogo( { siteId, mediaId } ) );
	} catch ( error ) {} // Assume that the media exists if there was a network error and do nothing to avoid data loss.
}
