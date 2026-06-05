/**
 * Mocks – break the dependency chain to `@wordpress/core-data`.
 */
jest.mock( '../../defaults', () => ( {
	getDefaultQueryParams: jest.fn(),
} ) );

jest.mock( '../preset-date-range', () => ( {
	computeDateRangeFromPreset: jest.fn(),
} ) );

jest.mock( '../interval', () => ( {
	getDefaultIntervalForPeriod: jest.fn(),
} ) );
/**
 * Internal dependencies
 */
import { hasComparisonEnabled } from '../search';

describe( 'hasComparisonEnabled', () => {
	it( 'returns true when all comparison fields are present', () => {
		expect(
			hasComparisonEnabled( {
				comp: '1',
				compare_from: '2026-01-01T00:00:00.000-05:00',
				compare_to: '2026-01-31T23:59:59.999-05:00',
			} )
		).toBe( true );
	} );

	it( 'returns false when comp is undefined', () => {
		expect(
			hasComparisonEnabled( {
				compare_from: '2026-01-01T00:00:00.000-05:00',
				compare_to: '2026-01-31T23:59:59.999-05:00',
			} )
		).toBe( false );
	} );

	it( 'returns false when compare_from is missing', () => {
		expect(
			hasComparisonEnabled( {
				comp: '1',
				compare_to: '2026-01-31T23:59:59.999-05:00',
			} )
		).toBe( false );
	} );

	it( 'returns false when compare_to is missing', () => {
		expect(
			hasComparisonEnabled( {
				comp: '1',
				compare_from: '2026-01-01T00:00:00.000-05:00',
			} )
		).toBe( false );
	} );

	it( 'returns false when compare_from is whitespace', () => {
		expect(
			hasComparisonEnabled( {
				comp: '1',
				compare_from: '   ',
				compare_to: '2026-01-31T23:59:59.999-05:00',
			} )
		).toBe( false );
	} );

	it( 'returns false when compare_to is whitespace', () => {
		expect(
			hasComparisonEnabled( {
				comp: '1',
				compare_from: '2026-01-01T00:00:00.000-05:00',
				compare_to: '  ',
			} )
		).toBe( false );
	} );

	it( 'returns false for empty object', () => {
		expect( hasComparisonEnabled( {} ) ).toBe( false );
	} );
} );
