jQuery( function ( $ ) {
	$( document ).ready( function () {
		const EDITOR_SELECTOR = '[data-type="jetpack/contact-form"]';
		const FRONTEND_SELECTOR = '.wp-block-jetpack-contact-form-container';

		if ( $( FRONTEND_SELECTOR ).length ) {
			generateStyleVariables( 'body' );
		}

		generateStyleVariables( EDITOR_SELECTOR );
	} );

	function generateStyleVariables( selector ) {
		const HTML = `
			<div class="contact-form__style-probe" style="position: absolute; z-index: -1; width: 1px; height: 1px; visibility: hidden">
				<div class="wp-block-button is-style-outline">
					<div class="wp-block-button__link">Test</div>
				</div>
				<div class="jetpack-field">
					<input class="components-text-control__input" type="text">
				</div>
			</div>
		`;

		if ( $( '.style-probe' ).length ) {
			return;
		}

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
		const borderWidth = window.getComputedStyle( buttonNode ).borderWidth;
		const borderRadius = window.getComputedStyle( buttonNode ).borderRadius;
		const padding = window.getComputedStyle( inputNode ).padding;
		const fontSize = window.getComputedStyle( inputNode ).fontSize;
		const lineHeight = window.getComputedStyle( inputNode ).lineHeight;

		container.css( '--jetpack--contact-form--primary-color', primaryColor );
		container.css( '--jetpack--contact-form--background-color', backgroundColor );
		container.css( '--jetpack--contact-form--text-color', textColor );
		container.css( '--jetpack--contact-form--border-size', borderWidth );
		container.css( '--jetpack--contact-form--border-radius', borderRadius );
		container.css( '--jetpack--contact-form--input-padding', padding );
		container.css( '--jetpack--contact-form--font-size', fontSize );
		container.css( '--jetpack--contact-form--line-height', lineHeight );
	}
} );
