export const REGEX = /(^|\/\/|www\.)(nextdoor\.[^"']*)/i;

const PATH_REGEX = /([^/]+$)/;

const getEmbedUrlFromPostUrl = postUrl => {
	let urlObject = '';
	if ( postUrl.indexOf( 'https' ) === 0 ) {
		urlObject = new URL( postUrl );
	} else {
		urlObject = new URL( 'https:' + postUrl );
	}

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

export const resizeIframeOnMessage = id => {
	const iframe = document.getElementById( id );
	let firstCall = true;
	window.addEventListener( 'message', event => {
		if ( ! event.origin.startsWith( 'https://nextdoor' ) ) {
			return;
		}
		if ( event.source !== iframe.contentWindow ) {
			return;
		}
		if ( firstCall ) {
			firstCall = false;
			iframe.setAttribute( 'width', '99%' );
		} else {
			setTimeout( () => {
				iframe.setAttribute( 'width', '100%' );
				iframe.setAttribute( 'height', event.data.height + 'px' );
			}, 500 );
		}
	} );
};
