/* global wp, colourloversDeprecate */
wp.customize.bind( 'ready', function () {
	const message = colourloversDeprecate.message;
	const panel = document.querySelector( '#accordion-section-colors_manager_tool' );

	if ( panel ) {
		const warningContainer = document.createElement( 'div' );
		warningContainer.className = 'colourlover-warning';

		const warningMessage = document.createElement( 'p' );
		warningMessage.textContent = message;

		warningContainer.appendChild( warningMessage );

		panel.insertBefore( warningContainer, panel.firstChild );
	}
} );
