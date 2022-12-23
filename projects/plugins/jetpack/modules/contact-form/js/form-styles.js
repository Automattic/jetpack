jQuery( function ( $ ) {
	const EDITOR_SELECTOR = '[data-type="jetpack/contact-form"]';
	const FRONTEND_SELECTOR = '.wp-block-jetpack-contact-form-container';

	$( document ).ready( function () {
		generateStyleVariables( FRONTEND_SELECTOR );
		generateStyleVariables( EDITOR_SELECTOR );
		observeContentChanges();
	} );

	function observeContentChanges() {
		const observer = new MutationObserver( () => {
			generateStyleVariables( FRONTEND_SELECTOR );
			generateStyleVariables( EDITOR_SELECTOR );
		} );

		observer.observe( document.querySelector( 'body' ), {
			childList: true,
			subtree: true,
		} );
	}

	function generateStyleVariables( selector, outputSelector = 'body' ) {
		const STYLE_PROBE_CLASS = 'contact-form__style-probe';
		const HTML = `
			<div class="${ STYLE_PROBE_CLASS } contact-form" style="position: absolute; z-index: -1; width: 1px; height: 1px; visibility: hidden">
				<div class="wp-block-button is-style-outline">
					<div class="wp-block-button__link">Test</div>
				</div>
				<div class="jetpack-field">
					<input class="components-text-control__input" type="text">
				</div>
			</div>
		`;

		if ( ! $( selector ).length || $( `.${ STYLE_PROBE_CLASS }` ).length ) {
			return;
		}

		const outputContainer = $( outputSelector );
		const container = $( selector );
		const styleProbe = $( HTML );
		const styleProbeEl = styleProbe[ 0 ];
		container.append( styleProbe );

		const bodyNode = document.querySelector( 'body' );
		const buttonNode = styleProbeEl.querySelector( '.wp-block-button__link' );
		const inputNode = styleProbeEl.querySelector( 'input[type="text"]' );

		const primaryColor = window.getComputedStyle( buttonNode ).borderColor;
		const backgroundColor = window.getComputedStyle( bodyNode ).backgroundColor;
		const textColor = window.getComputedStyle( buttonNode ).color;
		const borderColor = window.getComputedStyle( inputNode ).borderColor;
		const borderWidth = window.getComputedStyle( inputNode ).borderWidth;
		const borderRadius = window.getComputedStyle( inputNode ).borderRadius;
		const inputPadding = window.getComputedStyle( inputNode ).padding;
		const fontSize = window.getComputedStyle( inputNode ).fontSize;
		const lineHeight = window.getComputedStyle( inputNode ).lineHeight;

		outputContainer.css( '--jetpack--contact-form--primary-color', primaryColor );
		outputContainer.css( '--jetpack--contact-form--background-color', backgroundColor );
		outputContainer.css( '--jetpack--contact-form--text-color', textColor );
		outputContainer.css( '--jetpack--contact-form--border-color', borderColor );
		outputContainer.css( '--jetpack--contact-form--border-size', borderWidth );
		outputContainer.css( '--jetpack--contact-form--border-radius', borderRadius );
		outputContainer.css( '--jetpack--contact-form--input-padding', inputPadding );
		outputContainer.css( '--jetpack--contact-form--font-size', fontSize );
		outputContainer.css( '--jetpack--contact-form--line-height', lineHeight );
	}
} );
