import { readFileSync } from 'node:fs';

describe( 'PricingTable styles', () => {
	it( 'loads no images by relative URL', () => {
		const stylesheet = readFileSync( new URL( '../styles.module.scss', import.meta.url ), 'utf8' );

		// Stylesheets injected at runtime resolve relative URLs against the page, not the package.
		expect( stylesheet ).not.toMatch( /url\(\s*['"]?(?![\w-]+:|#)/ );
	} );
} );
