/**
 * Handle tooltips in the WordPress.com account column.
 */
document.addEventListener( 'DOMContentLoaded', function () {
	const tooltipElements = document.querySelectorAll( '.jetpack-connection-tooltip' );

	tooltipElements.forEach( function ( element ) {
		element.textContent = window.jetpackConnectionTooltips.columnTooltip;
	} );
} );
