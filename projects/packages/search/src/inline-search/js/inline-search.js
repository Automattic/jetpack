/**
 * Script to display corrected query notice after search titles and colophon at the bottom of search results.
 */
document.addEventListener( 'DOMContentLoaded', () => {
	// Handle corrected query display
	if ( window.JetpackSearchCorrectedQuery?.html ) {
		const { selectors, html } = window.JetpackSearchCorrectedQuery;
		const titleElement = document.querySelector( selectors.join( ', ' ) );

		if ( titleElement ) {
			titleElement.insertAdjacentHTML( 'afterend', html );
		}
	}

	// Handle colophon display
	if ( window.JetpackSearchColophon?.html ) {
		const { selector, html } = window.JetpackSearchColophon;
		const contentElement = document.querySelector( selector );

		if ( contentElement ) {
			contentElement.insertAdjacentHTML( 'beforeend', html );
		}
	}
} );
