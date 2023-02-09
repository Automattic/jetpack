window.addEventListener( 'load', () => {
	const FRONTEND_SELECTOR = '.wp-block-jetpack-contact-form-container';
	const EDITOR_SELECTOR = '[data-type="jetpack/contact-form"]';

	const observer = new MutationObserver( () => {
		generateStyleVariables( FRONTEND_SELECTOR );
		generateStyleVariables( EDITOR_SELECTOR );
	} );

	//Make sure to execute at least once if not triggered by the observer
	setTimeout( () => {
		generateStyleVariables( FRONTEND_SELECTOR );
		generateStyleVariables( EDITOR_SELECTOR );

		observer.observe( document.querySelector( 'body' ), {
			childList: true,
			subtree: true,
		} );
	}, 100 );
} );

function generateStyleVariables( selector, outputSelector = 'body' ) {
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

	const iframeCanvas = document.querySelector( 'iframe[name="editor-canvas"]' );
	const doc = iframeCanvas ? iframeCanvas.contentDocument : document;

	if ( ! doc.querySelectorAll( selector ).length ) {
		return;
	}

	let styleProbe = doc.querySelector( `.${ STYLE_PROBE_CLASS }` );
	const outputContainer = doc.querySelector( outputSelector );

	if ( styleProbe ) {
		const node = styleProbe.querySelector( 'input[type="text"]' );
		const inputBorder = window.getComputedStyle( node ).border;
		const currentInputBorder = outputContainer.style.getPropertyValue(
			'--jetpack--contact-form--border'
		);

		if ( inputBorder === currentInputBorder ) {
			return;
		}
	}

	styleProbe = doc.createElement( 'div' );
	styleProbe.className = STYLE_PROBE_CLASS;
	styleProbe.style = STYLE_PROBE_STYLE;
	styleProbe.innerHTML = HTML;

	const container = doc.querySelector( selector );
	container.appendChild( styleProbe );

	const bodyNode = doc.querySelector( 'body' );
	const buttonNode = styleProbe.querySelector( '.wp-block-button__link' );
	const inputNode = styleProbe.querySelector( 'input[type="text"]' );

	const backgroundColor = getBackgroundColor( bodyNode );
	const inputBackground = getBackgroundColor( inputNode );
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

	outputContainer.style.setProperty( '--jetpack--contact-form--primary-color', primaryColor );
	outputContainer.style.setProperty( '--jetpack--contact-form--background-color', backgroundColor );
	outputContainer.style.setProperty( '--jetpack--contact-form--text-color', textColor );
	outputContainer.style.setProperty( '--jetpack--contact-form--border', border );
	outputContainer.style.setProperty( '--jetpack--contact-form--border-color', borderColor );
	outputContainer.style.setProperty( '--jetpack--contact-form--border-size', borderWidth );
	outputContainer.style.setProperty( '--jetpack--contact-form--border-style', borderStyle );
	outputContainer.style.setProperty( '--jetpack--contact-form--border-radius', borderRadius );
	outputContainer.style.setProperty( '--jetpack--contact-form--input-background', inputBackground );
	outputContainer.style.setProperty( '--jetpack--contact-form--input-padding', inputPadding );
	outputContainer.style.setProperty(
		'--jetpack--contact-form--input-padding-top',
		inputPaddingTop
	);
	outputContainer.style.setProperty(
		'--jetpack--contact-form--input-padding-left',
		inputPaddingLeft
	);
	outputContainer.style.setProperty( '--jetpack--contact-form--font-size', fontSize );
	outputContainer.style.setProperty( '--jetpack--contact-form--font-family', fontFamily );
	outputContainer.style.setProperty( '--jetpack--contact-form--line-height', lineHeight );

	setTimeout( () => {
		bodyNode.classList.add( 'contact-form-styles-loaded' );
	}, 200 );
}

function getBackgroundColor( backgroundColorNode ) {
	let backgroundColor = window.getComputedStyle( backgroundColorNode ).backgroundColor;
	while (
		backgroundColor === 'rgba(0, 0, 0, 0)' &&
		backgroundColorNode.parentNode &&
		backgroundColorNode.parentNode.nodeType === window.Node.ELEMENT_NODE
	) {
		backgroundColorNode = backgroundColorNode.parentNode;
		backgroundColor = window.getComputedStyle( backgroundColorNode ).backgroundColor;
	}
	return backgroundColor;
}
