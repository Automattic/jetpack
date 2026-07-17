/** @jest-environment node */

import { resolveCssVariable } from '../resolve-css-var';

describe( 'resolveCssVariable', () => {
	describe( 'SSR compatibility', () => {
		it( 'returns null when window is undefined', () => {
			const result = resolveCssVariable( '--test-color' );
			expect( result ).toBeNull();
		} );

		it( 'returns null when document is undefined', () => {
			const result = resolveCssVariable( '--test-color' );
			expect( result ).toBeNull();
		} );
	} );
} );
