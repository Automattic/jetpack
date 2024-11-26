export const getSearchUrl = searchText => {
	return `/wpcom/v2/tumblr-gifs/search/${ encodeURIComponent( searchText ) }`;
};

export const splitStringAndReturnLastItem = ( str = '', delimiter ) => {
	const split = str.split( delimiter );
	return split[ split.length - 1 ];
};

export const getUrl = ( searchText = '' ) => {
	return new Promise( resolve => {
		searchText = searchText.trim();
		resolve( getSearchUrl( searchText ) );
	} );
};

export const getPaddingTop = media => `${ Math.floor( ( media.height / media.width ) * 100 ) }%`;

export const getSelectedGifAttributes = item => {
	const media = item.media.reduce( ( largest, current ) => {
		const currentSize = current.height * current.width;
		const largestSize = largest.height * largest.width;
		return currentSize > largestSize ? current : largest;
	}, item.media[ 0 ] );
	return {
		gifUrl: item.embed_url,
		paddingTop: getPaddingTop( media ),
	};
};
