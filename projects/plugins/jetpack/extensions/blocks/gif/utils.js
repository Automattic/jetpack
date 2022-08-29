import { GIPHY_API_KEY } from './constants';

export const getSearchUrl = searchText => {
	return `https://api.giphy.com/v1/gifs/search?q=${ encodeURIComponent(
		searchText
	) }&api_key=${ encodeURIComponent( GIPHY_API_KEY ) }&limit=10`;
};

export const getUrlWithId = giphyId => {
	return `https://api.giphy.com/v1/gifs/${ encodeURIComponent(
		giphyId
	) }?api_key=${ encodeURIComponent( GIPHY_API_KEY ) }`;
};

export const splitStringAndReturnLastItem = ( str = '', delimiter ) => {
	const split = str.split( delimiter );
	return split[ split.length - 1 ];
};

export const getUrl = ( searchText = '' ) => {
	let giphyID = null;
	searchText = searchText.trim();
	// If search is hardcoded Giphy URL following these patterns:
	// https://giphy.com/embed/4ZFekt94LMhNK
	// https://giphy.com/gifs/schittscreek-funny-3og0IIIZVBYV2ZVXFu
	// http://i.giphy.com/4ZFekt94LMhNK.gif
	// https://media.giphy.com/media/gt0hYzKlMpfOg/giphy.gif
	const embedRegex = /^https?:\/\/(media\.|i\.)?giphy\.com\/(embed|gifs|media)?\/?([-\w]*)(\/giphy)?(\.gif)?$/;
	const embedMatch = searchText.match( embedRegex );

	if ( embedMatch && embedMatch[ 3 ] ) {
		// Return the ID portion of schittscreek-funny-3og0IIIZVBYV2ZVXFu otherwise the id if no hyphens are present.
		giphyID = splitStringAndReturnLastItem( embedMatch[ 3 ], '-' );
	}

	if ( giphyID ) {
		return getUrlWithId( giphyID );
	}

	return getSearchUrl( searchText );
};

export const getPaddingTop = item =>
	`${ Math.floor( ( item.images.original.height / item.images.original.width ) * 100 ) }%`;

export const getEmbedUrl = item => item?.embed_url;

export const getSelectedGiphyAttributes = item => ( {
	giphyUrl: getEmbedUrl( item ),
	paddingTop: getPaddingTop( item ),
} );
