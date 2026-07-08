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

// Mock useFeaturedImage to avoid nested useSelect calls
jest.mock( '../../use-featured-image', () => jest.fn( () => null ) );

// Mock useMediaDetails to avoid nested useSelect calls
jest.mock( '../../use-media-details', () => jest.fn( () => [ null ] ) );

// Mock usePostMeta to avoid nested hook calls
jest.mock( '../../use-post-meta', () => ( {
	usePostMeta: jest.fn( () => ( {
		attachedMedia: [],
		imageGeneratorSettings: { enabled: false },
		mediaSource: undefined,
		shareMessage: '',
	} ) ),
} ) );

// Mock useAnalytics to avoid deep dependency chain
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: jest.fn( () => ( { recordEvent: jest.fn() } ) ),
} ) );

// Mock hasSocialPaidFeatures to return true by default
jest.mock( '../../../utils', () => {
	const actual = jest.requireActual( '../../../utils' );
	return {
		...actual,
		hasSocialPaidFeatures: jest.fn( () => true ),
	};
} );

const mockUseDispatch = useDispatch as jest.Mock;
const mockUseSelect = useSelect as jest.Mock;

const createMockSelect = ( meta: Record< string, unknown > = {} ) => {
	return () => ( {
		getEditedPostAttribute: jest.fn().mockReturnValue( meta ),
		getConnections: jest.fn().mockReturnValue( [] ),
		getEnabledConnections: jest.fn().mockReturnValue( [] ),
		getDisabledConnections: jest.fn().mockReturnValue( [] ),
	} );
};

describe( 'usePerNetworkCustomization', () => {
	const mockEditPost = jest.fn();
	const mockCustomizeConnectionById = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();

		mockUseDispatch.mockReturnValue( {
			editPost: mockEditPost,
			customizeConnectionById: mockCustomizeConnectionById,
		} );
	} );

	it( 'should return isEnabled as false when meta key is not set', () => {
		mockUseSelect.mockImplementation( ( selector: ( select: unknown ) => unknown ) => {
			return selector( createMockSelect( {} ) );
		} );

		const { result } = renderHook( () => usePerNetworkCustomization() );

		expect( result.current.isEnabled ).toBe( false );
	} );

	it( 'should return isEnabled as true when meta key is true', () => {
		mockUseSelect.mockImplementation( ( selector: ( select: unknown ) => unknown ) => {
			return selector(
				createMockSelect( {
					_wpas_customize_per_network: true,
				} )
			);
		} );

		const { result } = renderHook( () => usePerNetworkCustomization() );

		expect( result.current.isEnabled ).toBe( true );
	} );

	it( 'should toggle the meta value when toggle is called', () => {
		mockUseSelect.mockImplementation( ( selector: ( select: unknown ) => unknown ) => {
			return selector(
				createMockSelect( {
					_wpas_customize_per_network: false,
				} )
			);
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
