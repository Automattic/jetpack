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
