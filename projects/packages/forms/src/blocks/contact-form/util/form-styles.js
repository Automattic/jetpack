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

window.jetpackForms.generateStyleVariables = function ( formNode ) {
	const STYLE_PROBE_CLASS = 'contact-form__style-probe';
	const STYLE_PROBE_STYLE =
		'position: absolute; z-index: -1; width: 1px; height: 1px; visibility: hidden';
	const HTML = `
			<div class="contact-form">
				<div class="wp-block-button">
					<div class="wp-block-button__link btn-primary">Test</div>
				</div>
				<div class="wp-block-button is-style-outline">
					<div class="wp-block-button__link btn-outline">Test</div>
				</div>
				<div class="jetpack-field">
					<input class="jetpack-field__input" type="text">
				</div>
			</div>
		`;

	const _document = window[ 'editor-canvas' ] ? window[ 'editor-canvas' ].document : document;
	const bodyNode = _document.querySelector( 'body' );

	if ( ! formNode ) {
		return;
	}

	const styleProbe = _document.createElement( 'div' );
	styleProbe.className = STYLE_PROBE_CLASS;
	styleProbe.style = STYLE_PROBE_STYLE;
	styleProbe.innerHTML = HTML;

	formNode.parentNode.appendChild( styleProbe );

	const buttonPrimaryNode = styleProbe.querySelector( '.btn-primary' );
	const buttonOutlineNode = styleProbe.querySelector( '.btn-outline' );
	const inputNode = styleProbe.querySelector( 'input[type="text"]' );

	const backgroundColor = window.jetpackForms.getBackgroundColor( bodyNode );
	const inputBackgroundFallback = window.jetpackForms.getBackgroundColor( inputNode );
	const inputBackground = window.getComputedStyle( inputNode ).backgroundColor;
	const {
		border: buttonPrimaryBorder,
		borderColor: buttonPrimaryBorderColor,
		backgroundColor: buttonPrimaryBackgroundColor,
		color: buttonPrimaryColor,
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
	} = window.getComputedStyle( inputNode );

	styleProbe.remove();

	return {
		'--jetpack--contact-form--primary-color': buttonPrimaryBackgroundColor,
		'--jetpack--contact-form--background-color': backgroundColor,
		'--jetpack--contact-form--text-color': textColor,
		'--jetpack--contact-form--border': border,
		'--jetpack--contact-form--border-color': borderColor,
		'--jetpack--contact-form--border-size': borderWidth,
		'--jetpack--contact-form--border-style': borderStyle,
		'--jetpack--contact-form--border-radius': borderRadius,
		'--jetpack--contact-form--input-background': inputBackground,
		'--jetpack--contact-form--input-background-fallback': inputBackgroundFallback,
		'--jetpack--contact-form--input-padding': inputPadding,
		'--jetpack--contact-form--input-padding-top': inputPaddingTop,
		'--jetpack--contact-form--input-padding-left': inputPaddingLeft,
		'--jetpack--contact-form--font-size': fontSize,
		'--jetpack--contact-form--font-family': fontFamily,
		'--jetpack--contact-form--line-height': lineHeight,
		'--jetpack--contact-form--button-primary--color': buttonPrimaryColor,
		'--jetpack--contact-form--button-primary--background-color': buttonPrimaryBackgroundColor,
		'--jetpack--contact-form--button-primary--border': buttonPrimaryBorder,
		'--jetpack--contact-form--button-primary--border-color': buttonPrimaryBorderColor,
		'--jetpack--contact-form--button-outline--padding': buttonOutlinePadding,
		'--jetpack--contact-form--button-outline--border': buttonOutlineBorder,
		'--jetpack--contact-form--button-outline--background-color': buttonOutlineBackgroundColor,
		'--jetpack--contact-form--button-outline--background-color-fallback':
			buttonOutlineBackgroundColorFallback,
		'--jetpack--contact-form--button-outline--border-size': buttonOutlineBorderSize,
		'--jetpack--contact-form--button-outline--border-radius': buttonOutlineBorderRadius,
		'--jetpack--contact-form--button-outline--text-color': buttonOutlineTextColor,
		'--jetpack--contact-form--button-outline--line-height': buttonOutlineLineHeight,
	};
};
