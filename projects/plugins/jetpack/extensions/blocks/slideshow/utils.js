export default function applyPaddingForStackBlock() {
	let parentElement = document.querySelector( '.wp-site-blocks' );
	// In the template editor, the slideshow block is inside an iframe
	const iframeDocument = document.querySelector( 'iframe' )?.contentDocument || null;

	if ( iframeDocument ) {
		parentElement = iframeDocument.querySelector( '.wp-site-blocks' );
	}

	if ( parentElement ) {
		const { paddingLeft, paddingRight } = window.getComputedStyle( parentElement );
		const totalPadding = parseFloat( paddingLeft ) + parseFloat( paddingRight );

		const targetElements = ( iframeDocument || document ).querySelectorAll(
			iframeDocument
				? '.wp-block-group.is-vertical:not(.is-layout-constrained) .wp-block-jetpack-slideshow'
				: 'div:not(.entry-content) > .wp-block-group.is-vertical:not(.is-layout-constrained) .wp-block-jetpack-slideshow'
		);

		targetElements.forEach( element => {
			element.style.maxWidth = `calc(100vw - ${ totalPadding }px)`;
		} );
	}
}
