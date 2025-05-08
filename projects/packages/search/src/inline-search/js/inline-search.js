/**
 * Script to display corrected query notice after search titles and colophon at the bottom of search results.
 */
document.addEventListener( 'DOMContentLoaded', () => {
	// Handle corrected query display
	if ( window.JetpackSearchCorrectedQuery?.html ) {
		const { selectors, html } = window.JetpackSearchCorrectedQuery;
		const titleElement = document.querySelector( selectors.join( ', ' ) );
		// Check if corrected query element already exists to prevent duplication
		const correctedQueryExists = document.querySelector( '.jetpack-search-corrected-query' );

		if ( titleElement && ! correctedQueryExists ) {
			titleElement.insertAdjacentHTML( 'afterend', html );
		}
	}

	// Handle colophon display
	if ( window.JetpackSearchColophon?.html ) {
		const { selector, html } = window.JetpackSearchColophon;
		const contentElement = document.querySelector( selector );
		// Check if colophon element already exists to prevent duplication
		const colophonExists = document.querySelector( '.jetpack-search-inline-colophon' );

		if ( contentElement && ! colophonExists ) {
			contentElement.insertAdjacentHTML( 'beforeend', html );
		}
	}
} );
