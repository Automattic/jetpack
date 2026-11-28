import { renderHook } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import useBlockAttributes from '../index';

jest.mock( '@wordpress/block-editor', () => ( {
	store: 'core/block-editor',
} ) );
jest.mock( '@wordpress/data', () => ( {
	useDispatch: jest.fn(),
	useSelect: jest.fn(),
} ) );

describe( 'VideoPress - useBlockAttributes', () => {
	const blockAttributes = { title: 'Demo video', description: 'Details' };
	const updateBlockAttributes = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
		useDispatch.mockReturnValue( { updateBlockAttributes } );
	} );

	it( 'returns stable values directly from selectors without allocating a new object inside useSelect', () => {
		const selectors = {
			getSelectedBlockClientId: () => 'block-123',
			getBlockAttributes: id => ( id === 'block-123' ? blockAttributes : undefined ),
		};
		const returnedReferences = [];

		useSelect.mockImplementation( selector => {
			const first = selector( () => selectors );
			const second = selector( () => selectors );
			returnedReferences.push( [ first, second ] );
			return first;
		} );

		const { result } = renderHook( () => useBlockAttributes() );

		expect( returnedReferences ).toEqual( [
			[ 'block-123', 'block-123' ],
			[ blockAttributes, blockAttributes ],
		] );
		expect( returnedReferences[ 1 ][ 0 ] ).toBe( returnedReferences[ 1 ][ 1 ] );
		expect( result.current.clientId ).toBe( 'block-123' );
		expect( result.current.attributes ).toBe( blockAttributes );

		result.current.setAttributes( { title: 'Updated' } );
		expect( updateBlockAttributes ).toHaveBeenCalledWith( 'block-123', { title: 'Updated' } );
	} );

	it( 'returns undefined attributes when no block is selected', () => {
		const selectors = {
			getSelectedBlockClientId: () => null,
			getBlockAttributes: jest.fn(),
		};

		useSelect.mockImplementation( selector => selector( () => selectors ) );

		const { result } = renderHook( () => useBlockAttributes() );

		expect( result.current.clientId ).toBeNull();
		expect( result.current.attributes ).toBeUndefined();
		expect( selectors.getBlockAttributes ).not.toHaveBeenCalled();
	} );
} );
