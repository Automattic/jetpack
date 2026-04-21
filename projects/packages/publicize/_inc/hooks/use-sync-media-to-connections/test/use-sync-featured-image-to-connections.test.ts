import { renderHook } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import * as scriptData from '../../../utils/script-data';
import useFeaturedImage from '../../use-featured-image';
import useMediaDetails from '../../use-media-details';
import { usePerNetworkCustomization } from '../../use-per-network-customization';
import { useSyncFeaturedImageToConnections } from '../use-sync-featured-image-to-connections';

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

jest.mock( '../../use-featured-image', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../use-media-details', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../use-per-network-customization', () => ( {
	usePerNetworkCustomization: jest.fn(),
} ) );

jest.mock( '../../../social-store', () => ( {
	store: 'jetpack-social-store',
} ) );

const mockUseDispatch = useDispatch as jest.Mock;
const mockUseSelect = useSelect as jest.Mock;
const mockHasSocialPaidFeatures = scriptData.hasSocialPaidFeatures as jest.MockedFunction<
	typeof scriptData.hasSocialPaidFeatures
>;
const mockUseFeaturedImage = useFeaturedImage as jest.MockedFunction< typeof useFeaturedImage >;
const mockUseMediaDetails = useMediaDetails as jest.MockedFunction< typeof useMediaDetails >;
const mockUsePerNetworkCustomization = usePerNetworkCustomization as jest.MockedFunction<
	typeof usePerNetworkCustomization
>;

describe( 'useSyncFeaturedImageToConnections', () => {
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

		mockUseFeaturedImage.mockReturnValue( 123 );

		mockUseMediaDetails.mockReturnValue( [
			{
				mediaData: {
					width: 1200,
					height: 630,
					sourceUrl: 'https://example.com/featured-image.jpg',
				},
				metaData: {
					mime: 'image/jpeg',
					fileSize: 12345,
					length: 0,
				},
			},
			false,
		] );

		mockHasSocialPaidFeatures.mockReturnValue( true );
	} );

	it( 'should not sync when hasSocialPaidFeatures returns false', () => {
		mockHasSocialPaidFeatures.mockReturnValue( false );

		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'featured-image',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncFeaturedImageToConnections() );

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
				media_source: 'featured-image',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncFeaturedImageToConnections() );

		expect( mockCustomizeConnectionById ).not.toHaveBeenCalled();
	} );

	it( 'should not sync when featured image ID is not set', () => {
		mockUseFeaturedImage.mockReturnValue( 0 );

		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'featured-image',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncFeaturedImageToConnections() );

		expect( mockCustomizeConnectionById ).not.toHaveBeenCalled();
	} );

	it( 'should not sync when featured image URL is not available', () => {
		mockUseMediaDetails.mockReturnValue( [
			{
				mediaData: {
					width: 1200,
					height: 630,
					sourceUrl: undefined,
				},
				metaData: {
					mime: 'image/jpeg',
					fileSize: 12345,
					length: 0,
				},
			},
			false,
		] );

		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'featured-image',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncFeaturedImageToConnections() );

		expect( mockCustomizeConnectionById ).not.toHaveBeenCalled();
	} );

	it( 'should sync featured image URL to connections with media_source === featured-image', () => {
		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'featured-image',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncFeaturedImageToConnections() );

		expect( mockCustomizeConnectionById ).toHaveBeenCalledWith(
			'123',
			{
				attached_media: [
					{ id: 123, url: 'https://example.com/featured-image.jpg', type: 'image/jpeg' },
				],
			},
			true
		);
	} );

	it( 'should not sync connections with different media_source', () => {
		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'sig',
				attached_media: [],
			},
			{
				connection_id: '456',
				media_source: 'custom',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncFeaturedImageToConnections() );

		expect( mockCustomizeConnectionById ).not.toHaveBeenCalled();
	} );

	it( 'should not sync if URL is already up to date', () => {
		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'featured-image',
				attached_media: [
					{ id: 123, url: 'https://example.com/featured-image.jpg', type: 'image/jpeg' },
				],
			},
		] );

		renderHook( () => useSyncFeaturedImageToConnections() );

		expect( mockCustomizeConnectionById ).not.toHaveBeenCalled();
	} );

	it( 'should use default mime type when not available', () => {
		mockUseMediaDetails.mockReturnValue( [
			{
				mediaData: {
					width: 1200,
					height: 630,
					sourceUrl: 'https://example.com/featured-image.jpg',
				},
				metaData: {} as { mime: string; fileSize: number; length: number },
			},
			false,
		] );

		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'featured-image',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncFeaturedImageToConnections() );

		expect( mockCustomizeConnectionById ).toHaveBeenCalledWith(
			'123',
			{
				attached_media: [
					{ id: 123, url: 'https://example.com/featured-image.jpg', type: 'image/jpeg' },
				],
			},
			true
		);
	} );

	it( 'should sync multiple connections with featured-image media_source', () => {
		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'featured-image',
				attached_media: [],
			},
			{
				connection_id: '456',
				media_source: 'featured-image',
				attached_media: [
					{ id: 100, url: 'https://example.com/old-featured-image.jpg', type: 'image/jpeg' },
				],
			},
			{
				connection_id: '789',
				media_source: 'sig',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncFeaturedImageToConnections() );

		expect( mockCustomizeConnectionById ).toHaveBeenCalledTimes( 2 );
		expect( mockCustomizeConnectionById ).toHaveBeenCalledWith(
			'123',
			{
				attached_media: [
					{ id: 123, url: 'https://example.com/featured-image.jpg', type: 'image/jpeg' },
				],
			},
			true
		);
		expect( mockCustomizeConnectionById ).toHaveBeenCalledWith(
			'456',
			{
				attached_media: [
					{ id: 123, url: 'https://example.com/featured-image.jpg', type: 'image/jpeg' },
				],
			},
			true
		);
	} );

	it( 'should use the correct mime type from media details', () => {
		mockUseMediaDetails.mockReturnValue( [
			{
				mediaData: {
					width: 1200,
					height: 630,
					sourceUrl: 'https://example.com/featured-image.png',
				},
				metaData: {
					mime: 'image/png',
					fileSize: 12345,
					length: 0,
				},
			},
			false,
		] );

		mockUseSelect.mockReturnValue( [
			{
				connection_id: '123',
				media_source: 'featured-image',
				attached_media: [],
			},
		] );

		renderHook( () => useSyncFeaturedImageToConnections() );

		expect( mockCustomizeConnectionById ).toHaveBeenCalledWith(
			'123',
			{
				attached_media: [
					{ id: 123, url: 'https://example.com/featured-image.png', type: 'image/png' },
				],
			},
			true
		);
	} );
} );
