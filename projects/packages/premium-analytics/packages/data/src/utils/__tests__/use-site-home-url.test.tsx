/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
/**
 * Internal dependencies
 */
import { useSiteHomeUrl } from '../use-site-home-url';

const mockGetEntityRecord = jest.fn();

jest.mock( '@wordpress/core-data', () => ( {
	store: 'core',
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: ( selector: ( select: () => { getEntityRecord: jest.Mock } ) => unknown ) =>
		selector( () => ( { getEntityRecord: mockGetEntityRecord } ) ),
} ) );

describe( 'useSiteHomeUrl', () => {
	beforeEach( () => {
		mockGetEntityRecord.mockReset();
	} );

	it( 'returns the site URL from the core site settings', () => {
		mockGetEntityRecord.mockReturnValue( { url: 'https://example.com/' } );

		const { result } = renderHook( () => useSiteHomeUrl() );

		expect( mockGetEntityRecord ).toHaveBeenCalledWith( 'root', 'site' );
		expect( result.current ).toBe( 'https://example.com/' );
	} );

	it( 'returns undefined when the site settings are unavailable', () => {
		mockGetEntityRecord.mockReturnValue( undefined );

		const { result } = renderHook( () => useSiteHomeUrl() );

		expect( result.current ).toBeUndefined();
	} );
} );
