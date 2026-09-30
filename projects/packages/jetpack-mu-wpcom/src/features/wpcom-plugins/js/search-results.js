/**
 * Moves each Marketplace card's price into its bottom strip in core's search results.
 *
 * Core fills the strip with WordPress.org stats and has no filter for it, so the price
 * arrives in a template in the description. Jetpack's plugin search hint swaps the strip
 * the same way.
 */
( function () {
	/**
	 * Places every price still waiting in a template.
	 */
	function placePrices() {
		document
			.querySelectorAll( '#plugin-filter template.wpcom-marketplace-strip' )
			.forEach( function ( template ) {
				const card = template.closest( '.plugin-card' );
				const strip = card && card.querySelector( '.plugin-card-bottom' );

				if ( strip ) {
					card.classList.add( 'wpcom-marketplace-card' );
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

		placePrices();

		// Core's live search empties #plugin-filter and appends the new results to it.
		new MutationObserver( placePrices ).observe( results, { childList: true, subtree: true } );
	} );
} )();
