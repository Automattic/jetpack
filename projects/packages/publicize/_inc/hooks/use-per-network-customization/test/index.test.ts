import { siteHasFeature } from '@automattic/jetpack-script-data';
import { act, renderHook } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import { usePerNetworkCustomization } from '../';

jest.mock( '@automattic/jetpack-script-data', () => {
	const actual = jest.requireActual( '@automattic/jetpack-script-data' );
	return {
		...actual,
		siteHasFeature: jest.fn(),
	};
} );

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

const mockUsePostMeta = jest.fn();

// Mock usePostMeta to avoid nested hook calls
jest.mock( '../../use-post-meta', () => ( {
	usePostMeta: () => mockUsePostMeta(),
} ) );

// Mock useAnalytics to avoid deep dependency chain
jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: jest.fn( () => ( { recordEvent: jest.fn() } ) ),
} ) );

const mockUseDispatch = useDispatch as jest.Mock;
const mockUseSelect = useSelect as jest.Mock;
const mockSiteHasFeature = siteHasFeature as jest.Mock;

const createMockSelect = (
	meta: Record< string, unknown > = {},
	connections: Array< Record< string, unknown > > = []
) => {
	return () => ( {
		getEditedPostAttribute: jest.fn().mockReturnValue( meta ),
		getConnections: jest.fn().mockReturnValue( connections ),
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

		mockUsePostMeta.mockReturnValue( {
			attachedMedia: [],
			imageGeneratorSettings: { enabled: false },
			jetpackSocialOptions: {},
			mediaSource: undefined,
			shareMessage: '',
		} );

		mockSiteHasFeature.mockImplementation( feature =>
			[ 'social-message-templates', 'social-enhanced-publishing' ].includes( feature )
		);
	} );

	it( 'should return isEnabled as false when meta key is not set', () => {
		mockUseSelect.mockImplementation( ( selector: ( select: unknown ) => unknown ) => {
			return selector( createMockSelect( {} ) );
		} );

		const { result } = renderHook( () => usePerNetworkCustomization() );

		expect( result.current.isEnabled ).toBe( false );
		expect( mockEditPost ).not.toHaveBeenCalled();
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
		expect( mockEditPost ).not.toHaveBeenCalled();
	} );

	it( 'should default to enabled when message templates are enabled and a connection has a custom template', () => {
		mockUseSelect.mockImplementation( ( selector: ( select: unknown ) => unknown ) => {
			return selector(
				createMockSelect(
					{
						_wpas_customize_per_network: false,
					},
					[
						{
							connection_id: 'connection-1',
							template: 'Custom template',
						},
					]
				)
			);
		} );

		const { result } = renderHook( () => usePerNetworkCustomization() );

		expect( result.current.isEnabled ).toBe( true );
		expect( mockEditPost ).toHaveBeenCalledWith( {
			meta: {
				_wpas_customize_per_network: true,
			},
		} );
	} );

	it( 'should respect an explicitly saved global mode when a connection has a custom template', () => {
		mockUsePostMeta.mockReturnValue( {
			attachedMedia: [],
			imageGeneratorSettings: { enabled: false },
			jetpackSocialOptions: {
				customize_per_network_user_set: true,
			},
			mediaSource: undefined,
			shareMessage: '',
		} );
		mockUseSelect.mockImplementation( ( selector: ( select: unknown ) => unknown ) => {
			return selector(
				createMockSelect(
					{
						_wpas_customize_per_network: false,
					},
					[
						{
							connection_id: 'connection-1',
							template: 'Custom template',
						},
					]
				)
			);
		} );

		const { result } = renderHook( () => usePerNetworkCustomization() );

		expect( result.current.isEnabled ).toBe( false );
		expect( mockEditPost ).not.toHaveBeenCalled();
	} );

	it( 'should not default to enabled when the connection template is blank', () => {
		mockUseSelect.mockImplementation( ( selector: ( select: unknown ) => unknown ) => {
			return selector(
				createMockSelect( {}, [
					{
						connection_id: 'connection-1',
						template: '   ',
					},
				] )
			);
		} );

		const { result } = renderHook( () => usePerNetworkCustomization() );

		expect( result.current.isEnabled ).toBe( false );
		expect( mockEditPost ).not.toHaveBeenCalled();
	} );

	it( 'should not default to enabled when message templates are disabled', () => {
		mockSiteHasFeature.mockReturnValue( false );
		mockUseSelect.mockImplementation( ( selector: ( select: unknown ) => unknown ) => {
			return selector(
				createMockSelect( {}, [
					{
						connection_id: 'connection-1',
						template: 'Custom template',
					},
				] )
			);
		} );

		const { result } = renderHook( () => usePerNetworkCustomization() );

		expect( result.current.isEnabled ).toBe( false );
		expect( mockEditPost ).not.toHaveBeenCalled();
	} );

	it( 'should allow turning off the template-based default for the current editor session', () => {
		let meta = {};
		const connections = [
			{
				connection_id: 'connection-1',
				template: 'Custom template',
			},
		];

		mockEditPost.mockImplementation( ( update: { meta: Record< string, unknown > } ) => {
			meta = {
				...meta,
				...update.meta,
			};
		} );
		mockUseSelect.mockImplementation( ( selector: ( select: unknown ) => unknown ) => {
			return selector( createMockSelect( meta, connections ) );
		} );

		const { result, rerender } = renderHook( () => usePerNetworkCustomization() );

		expect( result.current.isEnabled ).toBe( true );

		act( () => {
			result.current.toggle();
		} );
		rerender();

		expect( result.current.isEnabled ).toBe( false );
		expect( mockEditPost ).toHaveBeenLastCalledWith( {
			meta: {
				_wpas_customize_per_network: false,
				jetpack_social_options: {
					customize_per_network_user_set: true,
					version: 2,
				},
			},
		} );
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
				jetpack_social_options: {
					customize_per_network_user_set: true,
					version: 2,
				},
			},
		} );
	} );
} );
