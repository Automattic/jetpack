import { renderHook } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import * as scriptData from '../../../utils/script-data';
import useImageGeneratorConfig from '../../use-image-generator-config';
import { usePerNetworkCustomization } from '../../use-per-network-customization';
import { useSyncSigToConnections } from '../use-sync-sig-to-connections';

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

jest.mock( '../../../utils/script-data', () => ( {
	hasSocialPaidFeatures: jest.fn(),
} ) );

jest.mock( '../../use-image-generator-config', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../use-per-network-customization', () => ( {
	usePerNetworkCustomization: jest.fn(),
} ) );

jest.mock( '../../use-sig-preview/utils', () => ( {
	getSigImageUrl: jest.fn( ( token: string ) => `https://example.com/sig?t=${ token }` ),
} ) );

jest.mock( '../../../social-store', () => ( {
	store: 'jetpack-social-store',
} ) );

const mockUseDispatch = useDispatch as jest.Mock;
const mockUseSelect = useSelect as jest.Mock;
const mockHasSocialPaidFeatures = scriptData.hasSocialPaidFeatures as jest.MockedFunction<
	typeof scriptData.hasSocialPaidFeatures
>;
const mockUseImageGeneratorConfig = useImageGeneratorConfig as jest.MockedFunction<
	typeof useImageGeneratorConfig
>;
const mockUsePerNetworkCustomization = usePerNetworkCustomization as jest.MockedFunction<
	typeof usePerNetworkCustomization
>;

describe( 'useSyncSigToConnections', () => {
	const mockCustomizeConnectionById = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();

		mockUseDispatch.mockReturnValue( {
			customizeConnectionById: mockCustomizeConnectionById,
		} );

		mockUsePerNetworkCustomization.mockReturnValue( {
			isEnabled: true,
			toggle: jest.fn(),
		} );

		mockUseImageGeneratorConfig.mockReturnValue( {
			token: 'test-token',
			isEnabled: true,
			customText: '',
			imageType: 'featured',
			imageId: null,
			template: 'default',
			font: '',
			defaultImageId: 0,
			postSettings: [],
			setToken: jest.fn(),
			setIsEnabled: jest.fn(),
			updateProperty: jest.fn(),
			updateSettings: jest.fn(),
		} );

		mockHasSocialPaidFeatures.mockReturnValue( true );
	} );

	it( 'should not sync when hasSocialPaidFeatures returns false', () => {
		mockHasSocialPaidFeatures.mockReturnValue( false );

		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'sig',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncSigToConnections() );

		expect( mockCustomizeConnectionById ).not.toHaveBeenCalled();
	} );

	it( 'should not sync when per-network customization is disabled', () => {
		mockUsePerNetworkCustomization.mockReturnValue( {
			isEnabled: false,
			toggle: jest.fn(),
		} );

		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'sig',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncSigToConnections() );

		expect( mockCustomizeConnectionById ).not.toHaveBeenCalled();
	} );

	it( 'should not sync when token is empty', () => {
		mockUseImageGeneratorConfig.mockReturnValue( {
			token: '',
			isEnabled: true,
			customText: '',
			imageType: 'featured',
			imageId: null,
			template: 'default',
			font: '',
			defaultImageId: 0,
			postSettings: [],
			setToken: jest.fn(),
			setIsEnabled: jest.fn(),
			updateProperty: jest.fn(),
			updateSettings: jest.fn(),
		} );

		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'sig',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncSigToConnections() );

		expect( mockCustomizeConnectionById ).not.toHaveBeenCalled();
	} );

	it( 'should sync SIG URL to connections with media_source === sig', () => {
		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'sig',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncSigToConnections() );

		expect( mockCustomizeConnectionById ).toHaveBeenCalledWith(
			'123',
			{
				attached_media: [
					{ id: 0, url: 'https://example.com/sig?t=test-token', type: 'image/png' },
				],
			},
			true
		);
	} );

	it( 'should not sync connections with different media_source', () => {
		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'featured-image',
				attached_media: [],
			},
			{
				connection_id: '456',
				media_source: 'custom',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncSigToConnections() );

		expect( mockCustomizeConnectionById ).not.toHaveBeenCalled();
	} );

	it( 'should not sync if URL is already up to date', () => {
		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'sig',
				attached_media: [
					{ id: 0, url: 'https://example.com/sig?t=test-token', type: 'image/png' },
				],
			},
		] );

		renderHook( () => useSyncSigToConnections() );

		expect( mockCustomizeConnectionById ).not.toHaveBeenCalled();
	} );

	it( 'should sync multiple connections with sig media_source', () => {
		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'sig',
				attached_media: [],
			},
			{
				connection_id: '456',
				media_source: 'sig',
				attached_media: [
					{ id: 0, url: 'https://example.com/sig?t=old-token', type: 'image/png' },
				],
			},
			{
				connection_id: '789',
				media_source: 'featured-image',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncSigToConnections() );

		expect( mockCustomizeConnectionById ).toHaveBeenCalledTimes( 2 );
		expect( mockCustomizeConnectionById ).toHaveBeenCalledWith(
			'123',
			{
				attached_media: [
					{ id: 0, url: 'https://example.com/sig?t=test-token', type: 'image/png' },
				],
			},
			true
		);
		expect( mockCustomizeConnectionById ).toHaveBeenCalledWith(
			'456',
			{
				attached_media: [
					{ id: 0, url: 'https://example.com/sig?t=test-token', type: 'image/png' },
				],
			},
			true
		);
	} );
} );
