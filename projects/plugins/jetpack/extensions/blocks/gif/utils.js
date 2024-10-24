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

export const getEmbedUrl = item => item?.embed_url;

export const getSelectedGifAttributes = item => {
	const media = item.media[ 0 ];
	const attribution = item.attribution || {};
	return {
		gifUrl: media.url,
		paddingTop: getPaddingTop( media ),
		attributionUrl: attribution.url,
		attributionName: attribution.blog?.name,
	};
};
