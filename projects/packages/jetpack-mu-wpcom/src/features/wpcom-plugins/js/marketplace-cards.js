/**
 * Finishes each Marketplace card in core's plugin list table, on the tab and in search results.
 *
 * Core fills the bottom strip with WordPress.org stats and has no filter for it, so ours
 * arrives in a template in the description. Jetpack's plugin search hint swaps the strip
 * the same way.
 */
( function () {
	/**
	 * Swaps in every strip still waiting in a template, and tags its card.
	 */
	function finishCards() {
		document
			.querySelectorAll( '#plugin-filter template.wpcom-marketplace-strip' )
			.forEach( function ( template ) {
				const card = template.closest( '.plugin-card' );
				const strip = card && card.querySelector( '.plugin-card-bottom' );

				if ( strip ) {
					strip.replaceChildren( template.content.cloneNode( true ) );

					// Core hardcodes its dependency heading, and checkout installs what these need.
					const heading = template.dataset.requiresLabel
						? card.querySelector( '.plugin-dependencies-explainer-text strong' )
						: null;
					if ( heading ) {
						heading.textContent = template.dataset.requiresLabel;
					}

					// What the tab's Tracks and kept details modals read off a card.
					card.classList.add( 'wpcom-marketplace-card' );
					Object.assign( card.dataset, template.dataset );
					// Not a dependency's More Details link, which is about another plugin.
					card.querySelectorAll( 'a.open-plugin-details-modal' ).forEach( function ( link ) {
						if ( ! link.closest( '.plugin-dependencies' ) ) {
							link.dataset.wpcomMarketplaceTrack = 'details';
						}
					} );
				}
				template.remove();
			} );
	}

	document.addEventListener( 'DOMContentLoaded', function () {
		const results = document.getElementById( 'plugin-filter' );
		if ( ! results ) {
			return;
		}

		finishCards();

		// Core's live search empties #plugin-filter and appends the new results to it.
		new MutationObserver( finishCards ).observe( results, { childList: true, subtree: true } );
	} );
} )();
