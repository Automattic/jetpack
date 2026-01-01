window.jetpackForms = window.jetpackForms || {};

window.jetpackForms.getBackgroundColor = function ( backgroundColorNode ) {
	let backgroundColor = window.getComputedStyle( backgroundColorNode ).backgroundColor;
	while (
		backgroundColor === 'rgba(0, 0, 0, 0)' &&
		backgroundColorNode.parentNode &&
		backgroundColorNode.parentNode.nodeType === window.Node.ELEMENT_NODE
	) {
		backgroundColorNode = backgroundColorNode.parentNode;

		if ( backgroundColorNode.className === 'wp-block-cover' ) {
			const coverBackgroundNode = backgroundColorNode.querySelector(
				'.wp-block-cover__background'
			);
			backgroundColor = window.getComputedStyle( coverBackgroundNode ).backgroundColor;
			continue;
		}

		backgroundColor = window.getComputedStyle( backgroundColorNode ).backgroundColor;
	}
	return backgroundColor;
};

window.jetpackForms.getInverseReadableColor = function ( color ) {
	if ( ! color ) {
		return '#FFFFFF';
	}

	let r, g, b;

	if ( color.startsWith( '#' ) ) {
		let hex = color.slice( 1 );
		if ( hex.length === 3 ) {
			hex = hex
				.split( '' )
				.map( c => c + c )
				.join( '' );
		}
		r = parseInt( hex.slice( 0, 2 ), 16 );
		g = parseInt( hex.slice( 2, 4 ), 16 );
		b = parseInt( hex.slice( 4, 6 ), 16 );
	} else {
		const match = color.match( /(\d+),\s*(\d+),\s*(\d+)/ );
		if ( ! match ) {
			return '#000000';
		}
		r = +match[ 1 ];
		g = +match[ 2 ];
		b = +match[ 3 ];
	}
	const luminance = 0.299 * r + 0.587 * g + 0.114 * b;
	return luminance > 186 ? '#000000' : '#FFFFFF';
};

function isTransparent( color ) {
	return (
		color === 'rgba(0, 0, 0, 0)' ||
		color === 'transparent' ||
		color === '#00000000' ||
		color === 'none' ||
		color === 'transparent none'
	);
}

window.jetpackForms.generateStyleVariables = function ( formNode ) {
	const STYLE_PROBE_CLASS = 'contact-form__style-probe';
	const STYLE_PROBE_STYLE =
		'position: absolute; z-index: -1; width: 1px; height: 1px; visibility: hidden';
	const HTML = `
			<div class="contact-form">
				<div class="wp-block-buttons">
					<div class="wp-block-button">
						<div class="wp-block-button__link wp-element-button btn-primary">Test</div>
					</div>
				</div>
				<div class="wp-block-buttons">
					<div class="wp-block-button is-style-outline">
						<div class="wp-block-button__link wp-element-button btn-outline">Test</div>
					</div>
				</div>
				<div class="jetpack-field">
					<input class="jetpack-field__input" type="text">
				</div>
			</div>
		`;

	if ( ! formNode ) {
		return;
	}

	const _document = window[ 'editor-canvas' ] ? window[ 'editor-canvas' ].document : document;
	const bodyNode = _document.querySelector( 'body' );

	const styleProbe = _document.createElement( 'div' );
	styleProbe.className = STYLE_PROBE_CLASS;
	styleProbe.style = STYLE_PROBE_STYLE;
	styleProbe.innerHTML = HTML;

	formNode.parentNode.appendChild( styleProbe );

	const formRootNode = styleProbe.querySelector( '.contact-form' );
	const buttonPrimaryNode = styleProbe.querySelector( '.btn-primary' );
	const buttonOutlineNode = styleProbe.querySelector( '.btn-outline' );
	const inputNode = styleProbe.querySelector( 'input[type="text"]' );

	const backgroundColor = window.jetpackForms.getBackgroundColor( bodyNode );
	const inputBackgroundFallback = window.jetpackForms.getBackgroundColor( inputNode );

	const bodyTextColor = window.getComputedStyle( formRootNode ).color;
	const invertedBodyTextColor = window.jetpackForms.getInverseReadableColor( bodyTextColor );
	const {
		border: buttonPrimaryBorder,
		borderColor: buttonPrimaryBorderColor,
		backgroundColor: buttonPrimaryBackgroundColor,
		color: buttonPrimaryColor,
		padding: buttonPrimaryPadding,
	} = window.getComputedStyle( buttonPrimaryNode );

	const {
		backgroundColor: buttonOutlineBackgroundColor,
		border: buttonOutlineBorder,
		borderWidth: buttonOutlineBorderSize,
		borderRadius: buttonOutlineBorderRadius,
		color: buttonOutlineTextColor,
		padding: buttonOutlinePadding,
		lineHeight: buttonOutlineLineHeight,
	} = window.getComputedStyle( buttonOutlineNode );

	const buttonOutlineBackgroundColorFallback =
		window.jetpackForms.getBackgroundColor( buttonOutlineNode );

	// Fallbacks don't cut it, we need to evaluate bg/fg/border color
	const buttonOutlineSafeBackgroundColor =
		buttonOutlineBackgroundColor === buttonOutlineTextColor
			? 'transparent'
			: buttonOutlineBackgroundColor;

	const {
		color: textColor,
		padding: inputPadding,
		paddingTop: inputPaddingTop,
		paddingLeft: inputPaddingLeft,
		border,
		borderColor,
		borderWidth,
		borderStyle,
		borderRadius,
		fontSize,
		fontFamily,
		lineHeight,
		height: inputHeight,
		backdropFilter: inputBackdropFilter,
		backgroundColor: inputBackground,
		filter: inputFilter,
	} = window.getComputedStyle( inputNode );

	styleProbe.remove();

	return {
		'--jetpack--contact-form--primary-color': buttonPrimaryBackgroundColor,
		'--jetpack--contact-form--background-color': backgroundColor,
		'--jetpack--contact-form--body-text-color': bodyTextColor,
		'--jetpack--contact-form--inverted-body-text-color': invertedBodyTextColor,
		'--jetpack--contact-form--text-color': textColor,
		'--jetpack--contact-form--border': border,
		'--jetpack--contact-form--border-color': borderColor,
		'--jetpack--contact-form--border-size': borderWidth,
		'--jetpack--contact-form--border-style': borderStyle,
		'--jetpack--contact-form--border-radius': borderRadius,
		...( isTransparent( inputBackground )
			? {}
			: { '--jetpack--contact-form--input-background': inputBackground } ),
		'--jetpack--contact-form--input-backdrop-filter': inputBackdropFilter,
		'--jetpack--contact-form--input-background-fallback': inputBackgroundFallback,
		'--jetpack--contact-form--input-padding': inputPadding,
		'--jetpack--contact-form--input-padding-top': inputPaddingTop,
		'--jetpack--contact-form--input-padding-left': inputPaddingLeft,
		'--jetpack--contact-form--input-height': inputHeight,
		'--jetpack--contact-form--input-filter': inputFilter,
		'--jetpack--contact-form--font-size': fontSize,
		'--jetpack--contact-form--font-family': fontFamily,
		'--jetpack--contact-form--line-height': lineHeight === 'normal' ? '1.2em' : lineHeight,
		// Primary button styles
		'--jetpack--contact-form--button-primary--color': buttonPrimaryColor,
		'--jetpack--contact-form--button-primary--background-color': buttonPrimaryBackgroundColor,
		'--jetpack--contact-form--button-primary--border': buttonPrimaryBorder,
		'--jetpack--contact-form--button-primary--border-color': buttonPrimaryBorderColor,
		'--jetpack--contact-form--button-primary--padding': buttonPrimaryPadding,
		// Outline button styles
		'--jetpack--contact-form--button-outline--padding': buttonOutlinePadding,
		'--jetpack--contact-form--button-outline--border': buttonOutlineBorder,
		...( isTransparent( buttonOutlineBackgroundColor )
			? {}
			: {
					'--jetpack--contact-form--button-outline--background-color':
						buttonOutlineSafeBackgroundColor,
			  } ),
		'--jetpack--contact-form--button-outline--background-color-fallback':
			buttonOutlineBackgroundColorFallback,
		'--jetpack--contact-form--button-outline--border-size': buttonOutlineBorderSize,
		'--jetpack--contact-form--button-outline--border-radius': buttonOutlineBorderRadius,
		'--jetpack--contact-form--button-outline--text-color': buttonOutlineTextColor,
		'--jetpack--contact-form--button-outline--line-height': buttonOutlineLineHeight,
	};
};
