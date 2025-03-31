/**
 * Script to display corrected query notice after search titles.
 */
document.addEventListener( 'DOMContentLoaded', function () {
	// Only proceed if we have corrected query data
	if ( ! window.JetpackSearchCorrectedQuery || ! window.JetpackSearchCorrectedQuery.html ) {
		return;
	}

	// Get the selectors and join them for querySelector
	const selectors = window.JetpackSearchCorrectedQuery.selectors;
	const selectorString = selectors.join( ', ' );

	// Find the title element using the selectors
	const titleElement = document.querySelector( selectorString );
	if ( ! titleElement ) {
		return;
	}

	const tempDiv = document.createElement( 'div' );
	tempDiv.innerHTML = window.JetpackSearchCorrectedQuery.html;
	const notice = tempDiv.firstChild;

	// Apply styling and insert
	const originalClass = notice.className;
	notice.className = titleElement.className + ' ' + originalClass;
	notice.style.fontSize = '0.9em';
	notice.style.marginTop = '10px';
	notice.style.paddingTop = '0';

	titleElement.insertAdjacentElement( 'afterend', notice );
} );
