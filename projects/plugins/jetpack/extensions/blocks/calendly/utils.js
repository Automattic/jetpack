export const REGEX = /(^|\/\/)(calendly\.com[^"']*)/i;

/**
 * Restrict a URL to calendly.com over HTTPS, matching the front end's host allowlist.
 *
 * @param {string} input - The URL to check.
 * @return {string|undefined} The HTTPS URL, or undefined if it isn't a calendly.com URL.
 */
export function normalizeCalendlyUrl( input ) {
	try {
		const url = new URL( input );

		if ( 'calendly.com' !== url.hostname || url.username || url.password || url.port ) {
			return undefined;
		}

		url.protocol = 'https:';
		return url.toString();
	} catch {
		return undefined;
	}
}

export const getURLFromEmbedCode = embedCode => {
	const url = embedCode.match( REGEX );
	if ( url ) {
		return normalizeCalendlyUrl( 'https://' + url[ 2 ] );
	}
};

export const getTextFromEmbedCode = embedCode => {
	let text = embedCode.match( /false;">([^<]+)<\// );
	if ( text ) {
		return text[ 1 ];
	}

	text = embedCode.match( /text: '([^']*?)'/ );
	if ( text ) {
		return text[ 1 ];
	}
};

const getTextColorFromEmbedCode = embedCode => {
	const textColor = embedCode.match( /textColor: '([^']*?)'/ );
	if ( textColor ) {
		return textColor[ 1 ];
	}
};

const getBackgroundColorFromEmbedCode = embedCode => {
	const backgroundColor = embedCode.match( /color: '([^']*?)'/ );
	if ( backgroundColor ) {
		return backgroundColor[ 1 ];
	}
};

export const getAttributesFromUrl = url => {
	const attributes = {};
	const urlObject = new URL( url );
	attributes.url = urlObject.origin + urlObject.pathname;

	if ( ! urlObject.search ) {
		return attributes;
	}

	const searchParams = new URLSearchParams( urlObject.search );
	const backgroundColor = searchParams.get( 'background_color' );
	const primaryColor = searchParams.get( 'primary_color' );
	const textColor = searchParams.get( 'text_color' );
	const hexRegex = /^[A-Za-z0-9]{6}$/;

	if ( searchParams.get( 'hide_event_type_details' ) ) {
		attributes.hideEventTypeDetails = searchParams.get( 'hide_event_type_details' );
	}

	if ( backgroundColor && backgroundColor.match( hexRegex ) ) {
		attributes.backgroundColor = backgroundColor;
	}

	if ( primaryColor && primaryColor.match( hexRegex ) ) {
		attributes.primaryColor = primaryColor;
	}

	if ( textColor && textColor.match( hexRegex ) ) {
		attributes.textColor = textColor;
	}

	return attributes;
};

const getStyleFromEmbedCode = embedCode => {
	if ( embedCode.indexOf( 'data-url' ) > 0 ) {
		return 'inline';
	}

	if ( embedCode.indexOf( 'initPopupWidget' ) > 0 || embedCode.indexOf( 'initBadgeWidget' ) > 0 ) {
		return 'link';
	}
};

export const getAttributesFromEmbedCode = embedCode => {
	if ( ! embedCode ) {
		return;
	}

	const newUrl = getURLFromEmbedCode( embedCode );
	if ( ! newUrl ) {
		return;
	}

	const newAttributes = getAttributesFromUrl( newUrl );

	const newStyle = getStyleFromEmbedCode( embedCode );
	if ( newStyle ) {
		newAttributes.style = newStyle;
	}

	if ( 'link' === newStyle ) {
		newAttributes.buttonAttributes = {};

		const text = getTextFromEmbedCode( embedCode );
		if ( text ) {
			newAttributes.buttonAttributes.text = text;
		}

		const textColor = getTextColorFromEmbedCode( embedCode );
		if ( textColor ) {
			newAttributes.buttonAttributes.textColor = undefined;
			newAttributes.buttonAttributes.customTextColor = textColor;
		}

		const backgroundColor = getBackgroundColorFromEmbedCode( embedCode );
		if ( backgroundColor ) {
			newAttributes.buttonAttributes.backgroundColor = undefined;
			newAttributes.buttonAttributes.customBackgroundColor = backgroundColor;
		}
	}

	return newAttributes;
};
