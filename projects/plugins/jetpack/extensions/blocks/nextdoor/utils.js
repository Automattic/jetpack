// Loose detector for the paste transform only; parseUrl() does the real host validation.
export const REGEX = /(^|\/\/|www\.)(nextdoor\.[^"']*)/i;

// Matches hosts where "nextdoor" is the registrable domain (nextdoor.com, nextdoor.co.uk, ...).
export const HOST_REGEX = /(^|\.)nextdoor\.[a-z]{2,3}(\.[a-z]{2})?$/i;

const PATH_REGEX = /([^/]+$)/;

const getEmbedUrlFromPostUrl = postUrl => {
	let urlObject;
	try {
		urlObject = new URL( postUrl.indexOf( 'https' ) === 0 ? postUrl : 'https://' + postUrl );
	} catch {
		return;
	}

	if ( urlObject.protocol !== 'https:' || ! HOST_REGEX.test( urlObject.host ) ) {
		return;
	}

	const embedId = urlObject.pathname.match( PATH_REGEX );

	if ( ! embedId ) {
		return;
	}

	return urlObject.origin + '/embed/' + embedId[ 1 ];
};

export const parseUrl = postUrl => {
	if ( ! postUrl ) {
		return;
	}

	return getEmbedUrlFromPostUrl( postUrl );
};

export const resizeIframeOnMessage = id => {
	const figure = document.getElementById( id );
	const link = figure.querySelector( 'a' );
	const attributes = {
		width: '100%',
		height: '200',
		frameborder: '0',
		title: link.getAttribute( 'title' ),
		src: getEmbedUrlFromPostUrl( link.href ),
	};

	const iframe = document.createElement( 'iframe' );
	window.addEventListener( 'message', event => {
		if ( ! event.origin.startsWith( 'https://nextdoor' ) ) {
			return;
		}
		if ( event.source !== iframe.contentWindow ) {
			return;
		}
		iframe.setAttribute( 'height', event.data.height + 'px' );
	} );
	Object.keys( attributes ).forEach( attribute =>
		iframe.setAttribute( attribute, attributes[ attribute ] )
	);
	figure.replaceChild( iframe, link );
};
