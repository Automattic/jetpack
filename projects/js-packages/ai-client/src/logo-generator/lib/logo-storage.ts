/**
 * Types
 */
import { Logo } from '../store/types.ts';
import { RemoveFromStorageProps, SaveToStorageProps, UpdateInStorageProps } from '../types.ts';
import { mediaExists } from './media-exists.ts';

const MAX_LOGOS = 10;

/**
 * Add an entry to the site's logo history.
 *
 * @param {SaveToStorageProps}               saveToStorageProps               - The properties to save to storage
 * @param {SaveToStorageProps.siteId}        saveToStorageProps.siteId        - The site ID
 * @param {SaveToStorageProps.url}           saveToStorageProps.url           - The URL of the logo
 * @param {SaveToStorageProps.description}   saveToStorageProps.description   - The description of the logo, based on the prompt used to generate it
 * @param {SaveToStorageProps.mediaId}       saveToStorageProps.mediaId       - The media ID of the logo on the backend
 * @param {SaveToStorageProps.revisedPrompt} saveToStorageProps.revisedPrompt - The revised prompt of the logo
 * @return {Logo} The logo that was saved
 */
export function stashLogo( {
	siteId,
	url,
	description,
	mediaId,
	revisedPrompt,
}: SaveToStorageProps ) {
	const storedContent = getSiteLogoHistory( siteId );

	const logo: Logo = {
		url,
		description,
		mediaId,
		revisedPrompt,
	};

	storedContent.push( logo );

	localStorage.setItem(
		`logo-history-${ siteId }`,
		JSON.stringify( storedContent.slice( -MAX_LOGOS ) )
	);

	return logo;
}

/**
 * Update an entry in the site's logo history.
 *
 * @param {UpdateInStorageProps}         updateInStorageProps         - The properties to update in storage
 * @param {UpdateInStorageProps.siteId}  updateInStorageProps.siteId  - The site ID
 * @param {UpdateInStorageProps.url}     updateInStorageProps.url     - The URL of the logo to update
 * @param {UpdateInStorageProps.newUrl}  updateInStorageProps.newUrl  - The new URL of the logo
 * @param {UpdateInStorageProps.mediaId} updateInStorageProps.mediaId - The new media ID of the logo
 * @param {UpdateInStorageProps.rating}  updateInStorageProps.rating  - The new rating of the logo
 * @return {Logo} The logo that was updated
 */
export function updateLogo( { siteId, url, newUrl, mediaId, rating }: UpdateInStorageProps ) {
	const storedContent = getSiteLogoHistory( siteId );

	const index = storedContent.findIndex( logo => logo.url === url );

	if ( index > -1 ) {
		storedContent[ index ].url = newUrl;
		storedContent[ index ].mediaId = mediaId;
		storedContent[ index ].rating = rating;
	}

	localStorage.setItem(
		`logo-history-${ siteId }`,
		JSON.stringify( storedContent.slice( -MAX_LOGOS ) )
	);

	return storedContent[ index ];
}

/**
 * Get the logo history for a site.
 *
 * @param {string} siteId - The site ID to get the logo history for
 * @return {Logo[]} The logo history for the site
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
			rating: logo.rating,
		} ) );

	return storedContent;
}

/**
 * Check if the logo history for a site is empty.
 *
 * @param {string } siteId - The site ID to check the logo history for
 * @return {boolean} Whether the logo history for the site is empty
 */
export function isLogoHistoryEmpty( siteId: string ) {
	const storedContent = getSiteLogoHistory( siteId );

	return storedContent.length === 0;
}

/**
 * Remove an entry from the site's logo history.
 *
 * @param {RemoveFromStorageProps}         removeFromStorageProps         - The properties to remove from storage
 * @param {RemoveFromStorageProps.siteId}  removeFromStorageProps.siteId  - The site ID
 * @param {RemoveFromStorageProps.mediaId} removeFromStorageProps.mediaId - The media ID of the logo to remove
 * @return {void}
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
 * Clear deleted media from the site's logo history, checking if the media still exists on the backend.
 *
 * @param {string} siteId - The site ID to clear deleted media for
 * @return {Promise<void>}
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
	} catch {
		// Assume that the media exists if there was a network error and do nothing to avoid data loss.
	}
}
