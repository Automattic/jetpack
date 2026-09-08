// Run against an Overview fixture containing a history annotation: node history-tooltip-overlap.cjs <url>.
const assert = require( 'node:assert/strict' );
const { chromium } = require( '@playwright/test' );

( async () => {
	assert.ok( process.argv[ 2 ], 'Pass the URL of an Overview fixture with history annotations.' );
	const browser = await chromium.launch( { channel: 'chrome' } );
	try {
		const page = await browser.newPage( {
			viewport: { width: 1280, height: 900 },
			timezoneId: 'America/Los_Angeles',
		} );
		await page.goto( process.argv[ 2 ] );
		const chart = page.locator( '.jetpack-boost-overview__chart-canvas' );
		await chart.locator( '.visx-annotationlabel' ).first().waitFor();
		await chart.getByRole( 'grid' ).hover();
		await chart.locator( '.visx-tooltip' ).waitFor();
		const result = await chart.evaluate( element => {
			const tooltip = element.querySelector( '.visx-tooltip' );
			const box = tooltip.getBoundingClientRect();
			const labels = element.querySelectorAll( '.visx-annotationlabel' );
			let overlaps = 0;
			let obscured = 0;
			// Include pointer-transparent tooltip and annotation elements in the browser's paint-order hit test.
			const style = document.createElement( 'style' );
			style.textContent =
				'.jetpack-boost-overview__chart-canvas * { pointer-events: auto !important; }';
			document.head.append( style );
			try {
				for ( const label of labels ) {
					const rect = label.getBoundingClientRect();
					const left = Math.max( box.left, rect.left );
					const right = Math.min( box.right, rect.right );
					const top = Math.max( box.top, rect.top );
					const bottom = Math.min( box.bottom, rect.bottom );
					if ( left >= right || top >= bottom ) {
						continue;
					}
					overlaps++;
					const elements = document.elementsFromPoint( ( left + right ) / 2, ( top + bottom ) / 2 );
					const tooltipIndex = elements.findIndex( node => tooltip.contains( node ) );
					const labelIndex = elements.findIndex( node => label.contains( node ) );
					if ( tooltipIndex < 0 || labelIndex < 0 || tooltipIndex > labelIndex ) {
						obscured++;
					}
				}
			} finally {
				style.remove();
			}
			return { overlaps, obscured };
		} );
		assert.ok( result.overlaps > 0, 'The fixture must exercise annotation/tooltip overlap.' );
		assert.equal(
			result.obscured,
			0,
			'History tooltip must paint above overlapping annotation labels.'
		);
		console.log( 'History tooltip paints above overlapping annotations.' );
	} finally {
		await browser.close();
	}
} )().catch( error => {
	console.error( error );
	process.exitCode = 1;
} );
