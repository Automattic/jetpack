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
			<div class="contact-form" style="">
				<div class="wp-block-button is-style-outline">
					<div class="wp-block-button__link">Test</div>
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

	formNode.appendChild( styleProbe );

	const buttonNode = styleProbe.querySelector( '.wp-block-button__link' );
	const inputNode = styleProbe.querySelector( 'input[type="text"]' );

	const backgroundColor = window.jetpackForms.getBackgroundColor( bodyNode );
	const inputBackgroundFallback = window.jetpackForms.getBackgroundColor( inputNode );
	const inputBackground = window.getComputedStyle( inputNode ).backgroundColor;
	const primaryColor = window.getComputedStyle( buttonNode ).borderColor;

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
		'--jetpack--contact-form--primary-color': primaryColor,
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
	};
};
