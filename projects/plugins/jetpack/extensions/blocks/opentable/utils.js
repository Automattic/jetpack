export const embedRegex = /<\s*script[^>]*src\s*=\s*["']?([^"']*)/i;
export const restRefRegex = /restref=([0-9]+)&/;
export const ridRegex = /rid=([0-9]+)&/;

const getAttributesFromUrl = url => {
	if ( ! url ) {
		return;
	}

	let src = '';
	if ( url.indexOf( 'http' ) === 0 ) {
		src = new URL( url );
	} else {
		src = new URL( 'http:' + url );
	}

	if ( ! src.host || src.host.indexOf( 'opentable' ) === -1 || ! src.search ) {
		return;
	}

	const searchParams = new URLSearchParams( src.search );
	let styleSetting = searchParams.get( 'theme' );
	if ( searchParams.get( 'type' ) === 'button' ) {
		styleSetting = searchParams.get( 'type' );
	}

	let restaurantId = searchParams.getAll( 'rid' );
	if ( ! restaurantId || restaurantId.length === 0 ) {
		restaurantId = searchParams.getAll( 'restref' );
	}
	if ( ! restaurantId || restaurantId.length === 0 ) {
		return;
	}

	const newAttributes = {};
	if ( restaurantId ) {
		newAttributes.rid = restaurantId;
	}

	const domain = searchParams.get( 'domain' );
	if ( domain ) {
		newAttributes.domain = domain;
	}

	const iframe = searchParams.get( 'iframe' );
	if ( iframe ) {
		newAttributes.iframe = iframe;
	}

	const lang = searchParams.get( 'lang' );
	if ( lang ) {
		newAttributes.lang = lang;
	}

	const newtab = searchParams.get( 'newtab' );
	if ( newtab ) {
		newAttributes.newtab = newtab;
	}

	if ( styleSetting ) {
		newAttributes.style = styleSetting;
	}

	return newAttributes;
};

const getUrlFromEmbedCode = embedCode => {
	const scriptTagAttributes = embedCode.match( embedRegex );
	if ( scriptTagAttributes && scriptTagAttributes[ 1 ] ) {
		return scriptTagAttributes[ 1 ];
	}

	if ( restRefRegex.test( embedCode ) || ridRegex.test( embedCode ) ) {
		return embedCode;
	}
};

export const getAttributesFromEmbedCode = embedCode => {
	if ( ! embedCode ) {
		return;
	}

	return getAttributesFromUrl( getUrlFromEmbedCode( embedCode ) );
};
