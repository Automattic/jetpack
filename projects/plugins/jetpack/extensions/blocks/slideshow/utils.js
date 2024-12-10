export default function applyPaddingForStackBlock() {
	// Helper function to apply styles
	const applyPaddingStyles = ( doc, isIframe ) => {
		const parentElement = doc.querySelector( '.wp-site-blocks' );
		if ( ! parentElement ) return;

		const { paddingLeft, paddingRight } = window.getComputedStyle( parentElement );
		const totalPadding = parseFloat( paddingLeft ) + parseFloat( paddingRight );

		const targetElements = doc.querySelectorAll(
			isIframe
				? '.wp-block-group.is-vertical:not(.is-layout-constrained) .wp-block-jetpack-slideshow'
				: '.wp-block-group.is-vertical:not(.is-layout-constrained) .wp-block-jetpack-slideshow:not(.entry-content .wp-block-jetpack-slideshow)'
		);

		targetElements.forEach( element => {
			element.style.maxWidth = `calc(100vw - ${ totalPadding }px)`;
		} );
	};

	// Apply styles to the main document
	applyPaddingStyles( document, false );

	// Find all iframes and apply styles to their content
	const iframes = document.querySelectorAll( 'iframe' );
	iframes.forEach( iframe => {
		const iframeDoc = iframe.contentDocument;
		if ( iframeDoc ) {
			applyPaddingStyles( iframeDoc, true );
		}
	} );
}
