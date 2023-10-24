export const REGEX = /(^|\/\/)(nextdoor\.[^"']*)/i;

const PATH_REGEX = /([^/]+$)/;

const getEmbedUrlFromPostUrl = postUrl => {
	const urlObject = new URL( postUrl );

	const embedId = urlObject.pathname.match( PATH_REGEX );

	if ( ! embedId ) {
		return;
	}

	return urlObject.origin + '/embed/' + embedId[ 1 ];
};

export const parseUrl = postUrl => {
	if ( ! postUrl || ! postUrl.match( REGEX ) ) {
		return;
	}

	const newUrl = getEmbedUrlFromPostUrl( postUrl );
	if ( ! newUrl ) {
		return;
	}

	return newUrl;
};
