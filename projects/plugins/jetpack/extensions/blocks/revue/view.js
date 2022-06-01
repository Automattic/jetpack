import domReady from '@wordpress/dom-ready';

import './view.scss';

if ( typeof window !== 'undefined' && window.jQuery ) {
	domReady( function () {
		const revueBlocks = document.querySelectorAll( '.wp-block-jetpack-revue' );

		revueBlocks.forEach( block => {
			if ( block.getAttribute( 'data-jetpack-block-initialized' ) === 'true' ) {
				return;
			}

			const form = block.querySelector( '.wp-block-jetpack-revue__form' );
			if ( ! form ) {
				return;
			}

			const message = block.querySelector( '.wp-block-jetpack-revue__message' );

			form.addEventListener( 'submit', () => {
				form.classList.remove( 'is-visible' );
				message.classList.add( 'is-visible' );
			} );

			block.setAttribute( 'data-jetpack-block-initialized', 'true' );
		} );
	} );
}
