/**
 * Script to display corrected query notice after search titles.
 */
document.addEventListener( 'DOMContentLoaded', () => {
	if ( ! window.JetpackSearchCorrectedQuery?.html ) {
		return;
	}

	const { selectors, html } = window.JetpackSearchCorrectedQuery;
	const titleElement = document.querySelector( selectors.join( ', ' ) );

	if ( ! titleElement ) {
		return;
	}

	const notice = document.createElement( 'div' );
	notice.innerHTML = html;

	notice.className = `${ titleElement.className } ${ notice.className }`;
	notice.style.cssText = 'font-size: 0.9em; margin-top: 10px; padding-top: 0;';

	notice.setAttribute( 'role', 'status' );
	notice.setAttribute( 'aria-live', 'polite' );

	titleElement.insertAdjacentElement( 'afterend', notice );
} );
