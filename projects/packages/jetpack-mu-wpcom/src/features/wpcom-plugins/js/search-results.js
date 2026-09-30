/**
 * Swaps each Marketplace card's bottom strip in core's search results for its own.
 *
 * Core fills the strip with WordPress.org stats and has no filter for it, so ours arrives
 * in a template in the description. Jetpack's plugin search hint swaps the strip the same way.
 */
( function () {
	/**
	 * Places every strip still waiting in a template.
	 */
	function placeStrips() {
		document
			.querySelectorAll( '#plugin-filter template.wpcom-marketplace-strip' )
			.forEach( function ( template ) {
				const card = template.closest( '.plugin-card' );
				const strip = card && card.querySelector( '.plugin-card-bottom' );

				if ( strip ) {
					strip.replaceChildren( template.content.cloneNode( true ) );
				}
				template.remove();
			} );
	}

	document.addEventListener( 'DOMContentLoaded', function () {
		const results = document.getElementById( 'plugin-filter' );
		if ( ! results ) {
			return;
		}

		placeStrips();

		// Core's live search empties #plugin-filter and appends the new results to it.
		new MutationObserver( placeStrips ).observe( results, { childList: true, subtree: true } );
	} );
} )();
