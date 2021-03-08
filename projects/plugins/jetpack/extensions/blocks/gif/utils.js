/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import { GIPHY_API_KEY } from './constants';

export const getSearchUrl = ( searchText ) => {
	return `https://api.giphy.com/v1/gifs/search?q=${ encodeURIComponent(
		searchText
	) }&api_key=${ encodeURIComponent( GIPHY_API_KEY ) }&limit=10`;
};

export const getUrlWithId = ( giphyId ) => {
	return `https://api.giphy.com/v1/gifs/${ encodeURIComponent(
		giphyId
	) }?api_key=${ encodeURIComponent( GIPHY_API_KEY ) }`;
};

export const splitAndLast = ( array, delimiter ) => {
	const split = array.split( delimiter );
	return split[ split.length - 1 ];
};

export const getUrl = ( searchText ) => {
	let giphyID = null;

	// If search is hardcoded Giphy URL following this pattern: https://giphy.com/embed/4ZFekt94LMhNK
	if ( searchText.indexOf( '//giphy.com/gifs' ) !== -1 ) {
		giphyID = splitAndLast( splitAndLast( searchText, '/' ), '-' );
	}

	// If search is hardcoded Giphy URL following this patterh: http://i.giphy.com/4ZFekt94LMhNK.gif
	if ( searchText.indexOf( '//i.giphy.com' ) !== -1 ) {
		giphyID = splitAndLast( searchText, '/' ).replace( '.gif', '' );
	}

	// https://media.giphy.com/media/gt0hYzKlMpfOg/giphy.gif
	const match = searchText.match(
		/http[s]?:\/\/media.giphy.com\/media\/([A-Za-z0-9\-.]+)\/giphy.gif/
	);

	if ( match ) {
		giphyID = match[ 1 ];
	}

	if ( giphyID ) {
		return getUrlWithId( giphyID );
	}

	return getSearchUrl( searchText );
};

export const getPaddingTop = ( item ) =>
	`${ Math.floor(
		( item.images.original.height / item.images.original.width ) * 100
	) }%`;

export const getEmbedUrl = ( item ) => item?.embed_url;
