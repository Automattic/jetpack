export const getURLFromEmbedCode = embedCode => {
	const url = embedCode.match( /(^|\/\/)(calendly\.com[^"']*)/i );
	if ( url ) {
		return 'https://' + url[ 2 ];
	}
};

export const getSubmitButtonTextFromEmbedCode = embedCode => {
	let submitButtonText = embedCode.match( /false;"\>([^<]+)\<\// );
	if ( submitButtonText ) {
		return submitButtonText[ 1 ];
	}

	submitButtonText = embedCode.match( /text: '([^']*?)'/ );
	if ( submitButtonText ) {
		return submitButtonText[ 1 ];
	}
};

const getSubmitButtonTextColorFromEmbedCode = embedCode => {
	const submitButtonTextColor = embedCode.match( /textColor: '([^']*?)'/ );
	if ( submitButtonTextColor ) {
		return submitButtonTextColor[ 1 ];
	}
};

const getSubmitButtonBackgroundColorFromEmbedCode = embedCode => {
	const submitButtonBackgroundColor = embedCode.match( /color: '([^']*?)'/ );
	if ( submitButtonBackgroundColor ) {
		return submitButtonBackgroundColor[ 1 ];
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

	const submitButtonText = getSubmitButtonTextFromEmbedCode( embedCode );
	if ( submitButtonText ) {
		newAttributes.submitButtonText = submitButtonText;
	}

	const submitButtonTextColor = getSubmitButtonTextColorFromEmbedCode( embedCode );
	if ( submitButtonTextColor ) {
		newAttributes.customTextButtonColor = submitButtonTextColor;
	}

	const submitButtonBackgroundColor = getSubmitButtonBackgroundColorFromEmbedCode( embedCode );
	if ( submitButtonBackgroundColor ) {
		newAttributes.customBackgroundButtonColor = submitButtonBackgroundColor;
	}

	return newAttributes;
};
