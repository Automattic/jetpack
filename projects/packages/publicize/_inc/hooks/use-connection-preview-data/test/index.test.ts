/* eslint-disable import/order */
// Setup mock script data BEFORE any other imports that might use it
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';

mockScriptData();

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
		useSelect: jest.fn(),
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property as keyof typeof mocks ] ?? target[ property as keyof typeof target ];
		},
	} );
} );

jest.mock( '../../use-per-network-customization', () => ( {
	usePerNetworkCustomization: jest.fn(),
} ) );

jest.mock( '../../use-social-media-message', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../use-social-preview-post-data', () => ( {
	useSocialPreviewPostData: jest.fn(),
} ) );

jest.mock( '../../use-media-details', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../use-sig-preview', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../../use-post-meta', () => ( {
	usePostMeta: jest.fn(),
} ) );

import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { useConnectionPreviewData } from '../';
import useMediaDetails from '../../use-media-details';
import { usePerNetworkCustomization } from '../../use-per-network-customization';
import { usePostMeta } from '../../use-post-meta';
import useSigPreview from '../../use-sig-preview';
import useSocialMediaMessage from '../../use-social-media-message';
import { useSocialPreviewPostData } from '../../use-social-preview-post-data';
import type { Connection } from '../../../social-store/types';

const mockSiteHasFeature = jest.requireMock( '@automattic/jetpack-script-data' )
	.siteHasFeature as jest.Mock;
const mockUseSelect = useSelect as jest.MockedFunction< typeof useSelect >;
const mockUsePerNetworkCustomization = usePerNetworkCustomization as jest.MockedFunction<
	typeof usePerNetworkCustomization
>;
const mockUseSocialMediaMessage = useSocialMediaMessage as jest.MockedFunction<
	typeof useSocialMediaMessage
>;
const mockUseSocialPreviewPostData = useSocialPreviewPostData as jest.MockedFunction<
	typeof useSocialPreviewPostData
>;
const mockUseMediaDetails = useMediaDetails as jest.MockedFunction< typeof useMediaDetails >;
const mockUseSigPreview = useSigPreview as jest.MockedFunction< typeof useSigPreview >;
const mockUsePostMeta = usePostMeta as jest.MockedFunction< typeof usePostMeta >;

const createMockConnection = ( overrides: Partial< Connection > = {} ): Connection => ( {
	connection_id: '123',
	display_name: 'Test User',
	external_handle: '@test',
	external_id: 'ext123',
	profile_link: 'https://example.com/test',
	profile_picture: 'https://example.com/pic.jpg',
	service_label: 'Test Service',
	service_name: 'test',
	shared: false,
	status: 'ok',
	wpcom_user_id: 1,
	enabled: true,
	...overrides,
} );

const defaultPostData = {
	title: 'Test Post',
	description: 'Test description',
	url: 'https://example.com/post',
	image: 'https://example.com/image.jpg',
	excerpt: 'Test excerpt',
	media: [],
	message: '',
};

describe( 'useConnectionPreviewData', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		mockSiteHasFeature.mockReturnValue( false );
		mockUseSelect.mockReturnValue( 0 );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: false, toggle: jest.fn() } );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: 'Global message',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );
		mockUseSocialPreviewPostData.mockReturnValue( defaultPostData );
		mockUseMediaDetails.mockReturnValue( [ null ] );
		mockUseSigPreview.mockReturnValue( { url: null, isLoading: false } );
		mockUsePostMeta.mockReturnValue( {
			mediaSource: undefined,
		} as ReturnType< typeof usePostMeta > );
	} );

	afterAll( () => {
		clearMockedScriptData();
	} );

	it( 'should return post data with global message when per-network customization is disabled', () => {
		const connection = createMockConnection();

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current ).toEqual( {
			...defaultPostData,
			message: 'Global message',
		} );
	} );

	it( 'should return post data with global message when ENHANCED_PUBLISHING feature is not available', () => {
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );
		mockSiteHasFeature.mockReturnValue( false );

		const connection = createMockConnection();

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.message ).toBe( 'Global message' );
	} );

	it( 'should trim the global message', () => {
		mockUseSocialMediaMessage.mockReturnValue( {
			message: '  Message with spaces  ',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );

		const connection = createMockConnection();

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.message ).toBe( 'Message with spaces' );
	} );

	it( 'should use connection attached_media when per-network customization is enabled', () => {
		mockSiteHasFeature.mockReturnValue( true );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );

		const attachedMedia = [ { id: 1, url: 'https://example.com/media.jpg', type: 'image/jpeg' } ];
		const connection = createMockConnection( {
			attached_media: attachedMedia,
		} );

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.media ).toEqual( attachedMedia );
	} );

	it( 'should return featured image when media_source is featured-image', () => {
		mockSiteHasFeature.mockReturnValue( true );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );
		mockUseMediaDetails.mockReturnValue( [
			{
				mediaData: { width: 800, height: 600, sourceUrl: 'https://example.com/featured.jpg' },
				metaData: { mime: 'image/jpeg', fileSize: 1024, length: 0 },
			},
		] );

		const connection = createMockConnection( { media_source: 'featured-image' } );

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.media ).toEqual( [
			{ url: 'https://example.com/featured.jpg', type: 'image/jpeg' },
		] );
	} );

	it( 'should return empty media when media_source is featured-image but no featured image exists', () => {
		mockSiteHasFeature.mockReturnValue( true );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );
		// When no featured image is set, useMediaDetails returns [ {} ] with no mediaData.sourceUrl
		// The hook checks featuredImageDetails?.mediaData?.sourceUrl to handle this edge case
		mockUseMediaDetails.mockReturnValue( [ {} ] as ReturnType< typeof useMediaDetails > );

		const connection = createMockConnection( { media_source: 'featured-image' } );

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.media ).toEqual( [] );
	} );

	it( 'should return SIG image when media_source is sig', () => {
		mockSiteHasFeature.mockReturnValue( true );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );
		mockUseSigPreview.mockReturnValue( {
			url: 'https://example.com/sig.png',
			isLoading: false,
		} );

		const connection = createMockConnection( { media_source: 'sig' } );

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.media ).toEqual( [
			{ url: 'https://example.com/sig.png', type: 'image/png' },
		] );
	} );

	it( 'should return empty media when media_source is sig but no SIG URL exists', () => {
		mockSiteHasFeature.mockReturnValue( true );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );
		mockUseSigPreview.mockReturnValue( { url: null, isLoading: false } );

		const connection = createMockConnection( { media_source: 'sig' } );

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.media ).toEqual( [] );
	} );

	it( 'should return empty media when media_source is none', () => {
		mockSiteHasFeature.mockReturnValue( true );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );

		const connection = createMockConnection( { media_source: 'none' } );

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.media ).toEqual( [] );
	} );
} );
