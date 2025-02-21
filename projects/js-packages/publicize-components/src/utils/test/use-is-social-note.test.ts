import { renderHook } from '@testing-library/react';
import { store as editorStore } from '@wordpress/editor';
import { useIsSocialNote } from '../use-is-social-note';

// Mock the editor store
jest.mock( '@wordpress/editor', () => ( {
	store: 'core/editor',
} ) );

const mockGetCurrentPostType = jest.fn();
const mockSelect = jest.fn().mockReturnValue( { getCurrentPostType: mockGetCurrentPostType } );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn( fn => fn( mockSelect ) ),
} ) );

describe( 'useIsSocialNote', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should return true when post type is jetpack-social-note', () => {
		mockGetCurrentPostType.mockReturnValue( 'jetpack-social-note' );
		const { result } = renderHook( () => useIsSocialNote() );

		expect( result.current ).toBe( true );
		expect( mockSelect ).toHaveBeenCalledWith( editorStore );
		expect( mockGetCurrentPostType ).toHaveBeenCalled();
	} );

	it( 'should return false when post type is not jetpack-social-note', () => {
		mockGetCurrentPostType.mockReturnValue( 'post' );
		const { result } = renderHook( () => useIsSocialNote() );

		expect( result.current ).toBe( false );
		expect( mockSelect ).toHaveBeenCalledWith( editorStore );
		expect( mockGetCurrentPostType ).toHaveBeenCalled();
	} );
} );
