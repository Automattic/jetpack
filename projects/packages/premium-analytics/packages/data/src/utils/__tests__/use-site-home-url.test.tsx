/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
/**
 * Internal dependencies
 */
import { useSiteHomeUrl } from '../use-site-home-url';

jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
	dispatch: jest.fn(),
	resolveSelect: jest.fn(),
	useSelect: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( { store: {} } ) );

describe( 'useSiteHomeUrl', () => {
	const getEntityRecord = jest.fn();
	const fakeSelect = () => ( { getEntityRecord } );

	beforeEach( () => {
		getEntityRecord.mockReset();
		jest
			.mocked( useSelect )
			.mockImplementation( mapSelect =>
				( mapSelect as unknown as ( select: typeof fakeSelect ) => unknown )( fakeSelect )
			);
	} );

	it( 'returns the site URL from the core site settings', () => {
		getEntityRecord.mockReturnValue( { url: 'https://example.com/' } );

		const { result } = renderHook( () => useSiteHomeUrl() );

		expect( getEntityRecord ).toHaveBeenCalledWith( 'root', 'site' );
		expect( result.current ).toBe( 'https://example.com/' );
	} );

	it( 'returns undefined when the site settings are unavailable', () => {
		getEntityRecord.mockReturnValue( undefined );

		const { result } = renderHook( () => useSiteHomeUrl() );

		expect( result.current ).toBeUndefined();
	} );
} );
