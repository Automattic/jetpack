import { act, renderHook } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import { usePerNetworkCustomization } from '../';

jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useDispatch: jest.fn(),
		useSelect: jest.fn(),
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property as keyof typeof mocks ] ?? target[ property as keyof typeof target ];
		},
	} );
} );

const mockUseDispatch = useDispatch as jest.MockedFunction< typeof useDispatch >;
const mockUseSelect = useSelect as jest.MockedFunction< typeof useSelect >;

describe( 'usePerNetworkCustomization', () => {
	const mockEditPost = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();

		mockUseDispatch.mockReturnValue( {
			editPost: mockEditPost,
		} );
	} );

	it( 'should return isEnabled as false when meta key is not set', () => {
		mockUseSelect.mockImplementation( ( selector: ( select: unknown ) => unknown ) => {
			const mockSelect = () => ( {
				getEditedPostAttribute: jest.fn().mockReturnValue( {} ),
			} );
			return selector( mockSelect );
		} );

		const { result } = renderHook( () => usePerNetworkCustomization() );

		expect( result.current.isEnabled ).toBe( false );
	} );

	it( 'should return isEnabled as true when meta key is true', () => {
		mockUseSelect.mockImplementation( ( selector: ( select: unknown ) => unknown ) => {
			const mockSelect = () => ( {
				getEditedPostAttribute: jest.fn().mockReturnValue( {
					_wpas_customize_per_network: true,
				} ),
			} );
			return selector( mockSelect );
		} );

		const { result } = renderHook( () => usePerNetworkCustomization() );

		expect( result.current.isEnabled ).toBe( true );
	} );

	it( 'should toggle the meta value when toggle is called', () => {
		mockUseSelect.mockImplementation( ( selector: ( select: unknown ) => unknown ) => {
			const mockSelect = () => ( {
				getEditedPostAttribute: jest.fn().mockReturnValue( {
					_wpas_customize_per_network: false,
				} ),
			} );
			return selector( mockSelect );
		} );

		const { result } = renderHook( () => usePerNetworkCustomization() );

		act( () => {
			result.current.toggle();
		} );

		expect( mockEditPost ).toHaveBeenCalledWith( {
			meta: {
				_wpas_customize_per_network: true,
			},
		} );
	} );
} );
