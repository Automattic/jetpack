window.addEventListener( 'load', () => {
	const FRONTEND_SELECTOR = '.wp-block-jetpack-contact-form-container';
	const EDITOR_SELECTOR = '[data-type="jetpack/contact-form"]';

	const observer = new MutationObserver( () => {
		generateStyleVariables( FRONTEND_SELECTOR );
		generateStyleVariables( EDITOR_SELECTOR );
	} );

	observer.observe( document.querySelector( 'body' ), {
		childList: true,
		subtree: true,
	} );

	//Make sure to execute at least once if not triggered by the observer
	setTimeout( () => {
		generateStyleVariables( FRONTEND_SELECTOR );
		generateStyleVariables( EDITOR_SELECTOR );
	}, 300 );
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
				<input class="components-text-control__input" type="text">
			</div>
		</div>
	`;

	const iframeCanvas = document.querySelector( 'iframe[name="editor-canvas"]' );
	const doc = iframeCanvas ? iframeCanvas.contentDocument : document;

	if (
		! doc.querySelectorAll( selector ).length ||
		doc.querySelectorAll( `.${ STYLE_PROBE_CLASS }` ).length
	) {
		return;
	}

	const styleProbe = doc.createElement( 'div' );
	styleProbe.className = STYLE_PROBE_CLASS;
	styleProbe.style = STYLE_PROBE_STYLE;
	styleProbe.innerHTML = HTML;

	const container = doc.querySelector( selector );
	container.appendChild( styleProbe );

	const bodyNode = doc.querySelector( 'body' );
	const buttonNode = styleProbe.querySelector( '.wp-block-button__link' );
	const inputNode = styleProbe.querySelector( 'input[type="text"]' );

	const backgroundColor = window.getComputedStyle( bodyNode ).backgroundColor;
	const primaryColor = window.getComputedStyle( buttonNode ).borderColor;
	const {
		color: textColor,
		padding: inputPadding,
		backgroundColor: inputBackground,
		border,
		borderColor,
		borderWidth,
		borderStyle,
		borderRadius,
		fontSize,
		fontFamily,
		lineHeight,
	} = window.getComputedStyle( inputNode );

	const outputContainer = doc.querySelector( outputSelector );
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
	outputContainer.style.setProperty( '--jetpack--contact-form--font-size', fontSize );
	outputContainer.style.setProperty( '--jetpack--contact-form--font-family', fontFamily );
	outputContainer.style.setProperty( '--jetpack--contact-form--line-height', lineHeight );
}
