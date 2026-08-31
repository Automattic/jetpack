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

jest.mock( '../../use-render-message-items', () => ( {
	useRenderMessageInputs: jest.fn(),
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
import { useRenderMessageInputs } from '../../use-render-message-items';
import useSigPreview from '../../use-sig-preview';
import useSocialMediaMessage from '../../use-social-media-message';
import { useSocialPreviewPostData } from '../../use-social-preview-post-data';
import type { Connection } from '../../../social-store/types';

const mockSiteHasFeature = jest.requireMock( '@automattic/jetpack-script-data' )
	.siteHasFeature as jest.Mock;
const mockUseSelect = useSelect as jest.Mock;
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
const mockUseRenderMessageInputs = useRenderMessageInputs as jest.MockedFunction<
	typeof useRenderMessageInputs
>;
const mockUsePostMeta = usePostMeta as jest.MockedFunction< typeof usePostMeta >;

const createMockConnection = ( overrides: Partial< Connection > = {} ): Connection => ( {
	connection_id: '123',
	display_name: 'Test User',
	external_handle: '@test',
	external_id: 'ext123',
	profile_link: 'https://example.com/test',
	profile_picture: 'https://example.com/pic.jpg',
	service_label: 'Test Service',
	service_name: 'tumblr',
	shared: false,
	status: 'ok',
	wpcom_user_id: 1,
	enabled: true,
	...overrides,
} );

const defaultPostData = {
	title: 'Test Post',
	siteTitle: 'Test Site',
	description: 'Test description',
	url: 'https://example.com/post',
	image: 'https://example.com/image.jpg',
	excerpt: 'Test excerpt',
	media: [],
	message: '',
};

/**
 * Mock the chained useSelect calls inside the hook so each one returns its expected
 * shape: postId, featuredImageId, messageTemplate, then the rendered slice.
 *
 * @param opts                   - Per-test overrides.
 * @param opts.postId            - Post id returned to the editor-store useSelect.
 * @param opts.messageTemplate   - Saved site message template.
 * @param opts.legacySource      - Exact fallback body source for feature-off previews.
 * @param opts.rendered          - String returned for the rendered slice, or null to signal "no slice yet".
 * @param opts.hyperlinks        - Source-aware hyperlinks returned with the rendered message.
 * @param opts.isLoadingRendered - Whether the rendered-messages cache slot is currently in-flight.
 */
function mockSelectCalls(
	opts: {
		postId?: number;
		messageTemplate?: string;
		legacySource?: string;
		rendered?: string | null;
		hyperlinks?: Array< { text: string; href: string; occurrence?: number } >;
		isLoadingRendered?: boolean;
	} = {}
) {
	const {
		postId = 42,
		messageTemplate = '',
		legacySource = '',
		rendered = null,
		hyperlinks = [],
		isLoadingRendered = false,
	} = opts;
	mockUseSelect
		.mockReturnValueOnce( postId )
		.mockReturnValueOnce( 0 )
		.mockReturnValueOnce( messageTemplate )
		.mockReturnValueOnce( legacySource )
		.mockReturnValueOnce( { rendered, renderedHyperlinks: hyperlinks, isLoadingRendered } );
}

describe( 'useConnectionPreviewData', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		mockSiteHasFeature.mockReturnValue( false );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: false, toggle: jest.fn() } );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: 'Global message',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );
		mockUseSocialPreviewPostData.mockReturnValue( defaultPostData );
		mockUseMediaDetails.mockReturnValue( [ null, false ] );
		mockUseSigPreview.mockReturnValue( { url: null, isLoading: false } );
		mockUseRenderMessageInputs.mockReturnValue( { items: [], postIntent: {} } );
		mockUsePostMeta.mockReturnValue( {
			mediaSource: undefined,
		} as ReturnType< typeof usePostMeta > );
	} );

	afterAll( () => {
		clearMockedScriptData();
	} );

	it( 'should return post data with global message when per-network customization is disabled', () => {
		mockSelectCalls();
		const connection = createMockConnection();

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current ).toEqual( {
			...defaultPostData,
			hyperlinks: [],
			isLoading: false,
			message: 'Global message',
		} );
	} );

	it( 'should return post data with global message when ENHANCED_PUBLISHING feature is not available', () => {
		mockSelectCalls();
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );
		mockSiteHasFeature.mockReturnValue( false );

		const connection = createMockConnection();

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.message ).toBe( 'Global message' );
	} );

	it( 'keeps hyperlinks from the legacy default body without paid features', () => {
		mockSelectCalls( {
			legacySource: '<p>Read the <a href="https://example.com/real">launch post</a> today.</p>',
		} );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: '',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );

		const { result } = renderHook( () =>
			useConnectionPreviewData( createMockConnection( { service_name: 'bluesky' } ) )
		);

		expect( result.current.hyperlinks ).toEqual( [
			{ text: 'launch post', href: 'https://example.com/real', occurrence: 0 },
		] );
	} );

	it( 'does not leak legacy body hyperlinks into a literal custom message', () => {
		mockSelectCalls( {
			legacySource: '<p>Later: <a href="https://example.com/unrelated">same phrase</a>.</p>',
		} );

		const { result } = renderHook( () =>
			useConnectionPreviewData( createMockConnection( { service_name: 'bluesky' } ) )
		);

		expect( result.current.message ).toBe( 'Global message' );
		expect( result.current.hyperlinks ).toEqual( [] );
	} );

	it( 'does not apply a legacy body hyperlink to matching title text', () => {
		mockSelectCalls( {
			legacySource: '<p>Read the <a href="https://example.com/real">launch post</a>.</p>',
		} );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: '',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );
		mockUseSocialPreviewPostData.mockReturnValue( {
			...defaultPostData,
			title: 'launch post',
		} );

		const { result } = renderHook( () =>
			useConnectionPreviewData( createMockConnection( { service_name: 'bluesky' } ) )
		);

		expect( result.current.hyperlinks ).toEqual( [] );
	} );

	it( 'keeps legacy body hyperlinks aligned after a larger title word', () => {
		mockSelectCalls( {
			legacySource: '<p>First post, then <a href="https://example.com/real">post</a>.</p>',
		} );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: '',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );
		mockUseSocialPreviewPostData.mockReturnValue( {
			...defaultPostData,
			title: 'Composted',
		} );

		const { result } = renderHook( () =>
			useConnectionPreviewData( createMockConnection( { service_name: 'bluesky' } ) )
		);

		expect( result.current.hyperlinks ).toEqual( [
			{ text: 'post', href: 'https://example.com/real', occurrence: 2 },
		] );
	} );

	it( 'should trim the global message', () => {
		mockSelectCalls();
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
		mockSelectCalls();
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
		mockSelectCalls();
		mockSiteHasFeature.mockReturnValue( true );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );
		mockUseMediaDetails.mockReturnValue( [
			{
				mediaData: { width: 800, height: 600, sourceUrl: 'https://example.com/featured.jpg' },
				metaData: { mime: 'image/jpeg', fileSize: 1024, length: 0 },
			},
			false,
		] );

		const connection = createMockConnection( { media_source: 'featured-image' } );

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.media ).toEqual( [
			{ url: 'https://example.com/featured.jpg', type: 'image/jpeg' },
		] );
	} );

	it( 'should return empty media when media_source is featured-image but no featured image exists', () => {
		mockSelectCalls();
		mockSiteHasFeature.mockReturnValue( true );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );
		mockUseMediaDetails.mockReturnValue( [ {}, false ] as ReturnType< typeof useMediaDetails > );

		const connection = createMockConnection( { media_source: 'featured-image' } );

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.media ).toEqual( [] );
	} );

	it( 'should return SIG image when media_source is sig', () => {
		mockSelectCalls();
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
		mockSelectCalls();
		mockSiteHasFeature.mockReturnValue( true );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );
		mockUseSigPreview.mockReturnValue( { url: null, isLoading: false } );

		const connection = createMockConnection( { media_source: 'sig' } );

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.media ).toEqual( [] );
	} );

	it( 'should return empty media when media_source is none', () => {
		mockSelectCalls();
		mockSiteHasFeature.mockReturnValue( true );
		mockUsePerNetworkCustomization.mockReturnValue( { isEnabled: true, toggle: jest.fn() } );

		const connection = createMockConnection( { media_source: 'none' } );

		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.media ).toEqual( [] );
	} );

	it( 'uses the rendered message from the store when templates feature is on', () => {
		mockSelectCalls( {
			rendered: 'Hello World\n\nExcerpt\n\nhttps://example.com/post',
		} );
		mockSiteHasFeature.mockReturnValue( true );

		const connection = createMockConnection();
		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.message ).toBe( 'Hello World\n\nExcerpt\n\nhttps://example.com/post' );
	} );

	it( 'uses source-aware hyperlinks returned with the rendered message', () => {
		const hyperlinks = [ { text: 'same phrase', href: 'https://example.com/real', occurrence: 2 } ];
		mockSelectCalls( {
			rendered: 'same phrase | same phrase first, then same phrase',
			hyperlinks,
		} );
		mockSiteHasFeature.mockReturnValue( true );

		const { result } = renderHook( () => useConnectionPreviewData( createMockConnection() ) );

		expect( result.current.hyperlinks ).toEqual( hyperlinks );
	} );

	it( 'never invents hyperlinks for a literal custom message', () => {
		// A message with no {content}/{excerpt} output comes back with no
		// hyperlinks, and the client must not fill them in from the post body —
		// that whole-post matching is what SOCIAL-557 reported.
		mockSelectCalls( { rendered: 'Global message', hyperlinks: [] } );
		mockSiteHasFeature.mockReturnValue( true );

		const { result } = renderHook( () => useConnectionPreviewData( createMockConnection() ) );

		expect( result.current.message ).toBe( 'Global message' );
		expect( result.current.hyperlinks ).toEqual( [] );
	} );

	it( 'falls back to raw message when no rendered slice is available', () => {
		mockSelectCalls( { rendered: null } );
		mockSiteHasFeature.mockReturnValue( true );

		const connection = createMockConnection();
		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.message ).toBe( 'Global message' );
	} );

	it( 'shows loading while the live template message is waiting for debounce', () => {
		mockSelectCalls( { rendered: null } );
		mockSiteHasFeature.mockReturnValue( true );
		mockUseRenderMessageInputs.mockReturnValue( {
			items: [
				{
					connection_id: '123',
					message: 'Old template',
					is_social_post: false,
				},
			],
			postIntent: {},
		} );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: 'New template {excerpt}',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );

		const connection = createMockConnection();
		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.isLoading ).toBe( true );
	} );

	it( 'does not show loading in global mode when the render item matches the global message', () => {
		mockSelectCalls( { rendered: 'Rendered global template' } );
		mockSiteHasFeature.mockReturnValue( true );
		mockUseRenderMessageInputs.mockReturnValue( {
			items: [
				{
					connection_id: '123',
					message: 'Global message',
					is_social_post: false,
				},
			],
			postIntent: {},
		} );

		const connection = createMockConnection( { message: 'Per-network message' } );
		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.message ).toBe( 'Rendered global template' );
		expect( result.current.isLoading ).toBe( false );
	} );

	it( 'keeps loading after debounce until the render request finishes', () => {
		mockSelectCalls( { rendered: null, isLoadingRendered: true } );
		mockSiteHasFeature.mockReturnValue( true );
		mockUseRenderMessageInputs.mockReturnValue( {
			items: [
				{
					connection_id: '123',
					message: 'New template {excerpt}',
					is_social_post: false,
				},
			],
			postIntent: {},
		} );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: 'New template {excerpt}',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );

		const connection = createMockConnection();
		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.isLoading ).toBe( true );
	} );

	it( 'never falls back to the raw template while the render request is pending', () => {
		mockSelectCalls( { rendered: null, isLoadingRendered: true } );
		mockSiteHasFeature.mockReturnValue( true );
		mockUseSocialMediaMessage.mockReturnValue( {
			message: 'New post: {title} {excerpt}',
			updateMessage: jest.fn(),
			maxLength: 280,
		} );

		const connection = createMockConnection();
		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.message ).toBe( '' );
		expect( result.current.isLoading ).toBe( true );
	} );

	it( 'keeps the previous rendered message while a new render is pending', () => {
		mockSiteHasFeature.mockReturnValue( true );
		mockSelectCalls( { rendered: 'Rendered: Hello' } );

		const connection = createMockConnection();
		const { result, rerender } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.message ).toBe( 'Rendered: Hello' );

		// A title/excerpt edit committed — the new cache key has no rendered value yet.
		mockSelectCalls( { rendered: null, isLoadingRendered: true } );
		rerender();

		expect( result.current.message ).toBe( 'Rendered: Hello' );
		expect( result.current.isLoading ).toBe( false );
	} );

	it( 'ignores rendered message when the site lacks paid features', () => {
		mockSelectCalls( { rendered: 'Should not be used', isLoadingRendered: true } );
		mockSiteHasFeature.mockReturnValue( false );
		mockUseRenderMessageInputs.mockReturnValue( {
			items: [
				{
					connection_id: '123',
					message: 'Different debounced template',
					is_social_post: false,
				},
			],
			postIntent: {},
		} );

		const connection = createMockConnection();
		const { result } = renderHook( () => useConnectionPreviewData( connection ) );

		expect( result.current.message ).toBe( 'Global message' );
		expect( result.current.isLoading ).toBe( false );
	} );
} );
