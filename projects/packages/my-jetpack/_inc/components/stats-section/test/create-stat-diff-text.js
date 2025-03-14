import { _n } from '@wordpress/i18n';
import createStatDiffText from '../create-stat-diff-text';

// Mock formatNumber and formatPercentage to make tests predictable
jest.mock( '../../../utils/format-number', () => number => number.toString() );
jest.mock( '../../../utils/format-percentage', () => ratio => `${ ratio * 100 }%` );

describe( 'createStatDiffText', () => {
	// eslint-disable-next-line @wordpress/i18n-translator-comments
	const viewsCount = count => _n( '%s view', '%s views', count, 'jetpack-my-jetpack' );

	describe( 'when there is no change', () => {
		it( 'should not return the name of the stat', () => {
			expect( createStatDiffText( viewsCount, 5, 5 ) ).not.toContain( 'view' );
		} );
	} );

	describe( 'when there is an increase', () => {
		it( 'should format message with percentage when previous count is not zero', () => {
			const text = createStatDiffText( viewsCount, 10, 5 ).toLowerCase();

			expect( text ).toContain( 'increase' );
			expect( text ).toContain( '5 views' );
			expect( text ).toContain( '100%' );
		} );

		it( 'should format message without percentage when previous count is zero', () => {
			const text = createStatDiffText( viewsCount, 5, 0 ).toLowerCase();

			expect( text ).toContain( 'increase' );
			expect( text ).toContain( '5 views' );
			expect( text ).not.toContain( '%' );
		} );
	} );

	describe( 'when there is a decrease', () => {
		it( 'should format message with percentage when previous count is not zero', () => {
			const text = createStatDiffText( viewsCount, 5, 10 ).toLowerCase();

			expect( text ).toContain( 'decrease' );
			expect( text ).toContain( '5 views' );
			expect( text ).toContain( '50%' );
		} );

		it( 'should format message without percentage when previous count is zero', () => {
			const text = createStatDiffText( viewsCount, -5, 0 ).toLowerCase();
			// This case shouldn't happen in practice since you can't go below zero,
			// but we test it for completeness
			expect( text ).toContain( 'decrease' );
			expect( text ).toContain( '5 views' );
			expect( text ).not.toContain( '%' );
		} );
	} );

	describe( 'when inputs are not numbers', () => {
		it( 'should return empty string for non-number count', () => {
			expect( createStatDiffText( viewsCount, '10', 5 ) ).toBe( '' );
			expect( createStatDiffText( viewsCount, null, 5 ) ).toBe( '' );
			expect( createStatDiffText( viewsCount, undefined, 5 ) ).toBe( '' );
		} );

		it( 'should return empty string for non-number previousCount', () => {
			expect( createStatDiffText( viewsCount, 10, '5' ) ).toBe( '' );
			expect( createStatDiffText( viewsCount, 10, null ) ).toBe( '' );
			expect( createStatDiffText( viewsCount, 10, undefined ) ).toBe( '' );
		} );
	} );
} );
