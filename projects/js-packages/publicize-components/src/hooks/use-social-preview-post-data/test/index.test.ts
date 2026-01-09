import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { useSocialPreviewPostData } from '../';
import { usePostMeta } from '../../use-post-meta';
import { getSigImageUrl } from '../../use-sig-preview/utils';
import { getMediaSourceUrl, getPostImageUrl } from '../utils';

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

jest.mock( '../../use-post-meta', () => ( {
	usePostMeta: jest.fn(),
} ) );

jest.mock( '../../use-sig-preview/utils', () => ( {
	getSigImageUrl: jest.fn(),
} ) );

jest.mock( '../utils', () => ( {
	getMediaSourceUrl: jest.fn(),
	getPostImageUrl: jest.fn(),
} ) );

const mockUsePostMeta = usePostMeta as jest.MockedFunction< typeof usePostMeta >;
const mockUseSelect = useSelect as jest.MockedFunction< typeof useSelect >;
const mockGetSigImageUrl = getSigImageUrl as jest.MockedFunction< typeof getSigImageUrl >;
const mockGetMediaSourceUrl = getMediaSourceUrl as jest.MockedFunction< typeof getMediaSourceUrl >;
const mockGetPostImageUrl = getPostImageUrl as jest.MockedFunction< typeof getPostImageUrl >;

const mockGetEditedPostAttribute = jest.fn();

const getDefaultMockPostMeta = () => ( {
	attachedMedia: [] as Array< { id: number; type: string; url: string } >,
	imageGeneratorSettings: {
		enabled: false,
		token: '',
	},
	isPostAlreadyShared: false,
	isPublicizeEnabled: true,
	jetpackSocialOptions: {},
	mediaSource: undefined,
	shareMessage: '',
	togglePublicizeFeature: jest.fn(),
	updateMeta: jest.fn(),
	updateJetpackSocialOptions: jest.fn(),
} );

describe( 'useSocialPreviewPostData', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		mockUsePostMeta.mockReturnValue( getDefaultMockPostMeta() );

		mockGetSigImageUrl.mockReturnValue( '' );
		mockGetMediaSourceUrl.mockReturnValue( '' );
		mockGetPostImageUrl.mockReturnValue( null );

		// Default mock for useSelect
		mockUseSelect.mockImplementation( ( selectorOrMapper: unknown ) => {
			// Handle callback-style useSelect
			if ( typeof selectorOrMapper === 'function' ) {
				const mockSelect = () => ( {
					getEntityRecords: jest.fn().mockReturnValue( [] ),
					getEntityRecord: jest.fn().mockReturnValue( null ),
					getEditedPostAttribute: mockGetEditedPostAttribute,
					getEditedPostContent: jest.fn().mockReturnValue( '' ),
				} );
				return selectorOrMapper( mockSelect );
			}

			return { getEditedPostAttribute: mockGetEditedPostAttribute };
		} );

		mockGetEditedPostAttribute.mockImplementation( ( attr: string ) => {
			const attributes: Record< string, unknown > = {
				title: 'Test Post Title',
				excerpt: 'Test excerpt',
				content: 'Test content',
				link: 'https://example.com/test-post',
				featured_media: 0,
				meta: {},
			};
			return attributes[ attr ];
		} );
	} );

	it( 'should return basic post data', () => {
		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.title ).toBe( 'Test Post Title' );
		expect( result.current.excerpt ).toBe( 'Test excerpt' );
		expect( result.current.url ).toBe( 'https://example.com/test-post' );
		expect( result.current.media ).toEqual( [] );
	} );

	it( 'should use SEO title when available', () => {
		mockGetEditedPostAttribute.mockImplementation( ( attr: string ) => {
			const attributes: Record< string, unknown > = {
				title: 'Regular Title',
				excerpt: '',
				content: '',
				link: 'https://example.com/test-post',
				featured_media: 0,
				meta: {
					jetpack_seo_html_title: 'SEO Title',
				},
			};
			return attributes[ attr ];
		} );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.title ).toBe( 'SEO Title' );
	} );

	it( 'should use advanced SEO description when available', () => {
		mockGetEditedPostAttribute.mockImplementation( ( attr: string ) => {
			const attributes: Record< string, unknown > = {
				title: 'Test Title',
				excerpt: 'Regular excerpt',
				content: 'Test content',
				link: 'https://example.com/test-post',
				featured_media: 0,
				meta: {
					advanced_seo_description: 'SEO Description',
				},
			};
			return attributes[ attr ];
		} );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.description ).toBe( 'SEO Description' );
	} );

	it( 'should fall back to excerpt for description', () => {
		mockGetEditedPostAttribute.mockImplementation( ( attr: string ) => {
			const attributes: Record< string, unknown > = {
				title: 'Test Title',
				excerpt: 'Post excerpt',
				content: 'Test content',
				link: 'https://example.com/test-post',
				featured_media: 0,
				meta: {},
			};
			return attributes[ attr ];
		} );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.description ).toBe( 'Post excerpt' );
	} );

	it( 'should use content before more tag when no excerpt', () => {
		mockGetEditedPostAttribute.mockImplementation( ( attr: string ) => {
			const attributes: Record< string, unknown > = {
				title: 'Test Title',
				excerpt: '',
				content: 'Content before more<!--more-->Content after more',
				link: 'https://example.com/test-post',
				featured_media: 0,
				meta: {},
			};
			return attributes[ attr ];
		} );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.description ).toBe( 'Content before more' );
		expect( result.current.excerpt ).toBe( 'Content before more' );
	} );

	it( 'should trim whitespace from title and description', () => {
		mockGetEditedPostAttribute.mockImplementation( ( attr: string ) => {
			const attributes: Record< string, unknown > = {
				title: '  Title with spaces  ',
				excerpt: '  Excerpt with spaces  ',
				content: '',
				link: 'https://example.com/test-post',
				featured_media: 0,
				meta: {},
			};
			return attributes[ attr ];
		} );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.title ).toBe( 'Title with spaces' );
		expect( result.current.description ).toBe( 'Excerpt with spaces' );
	} );

	it( 'should return attached media with URLs from SIG images', () => {
		mockUsePostMeta.mockReturnValue( {
			...getDefaultMockPostMeta(),
			attachedMedia: [
				{
					id: 0,
					url: 'https://example.com/sig-image.jpg',
					type: 'image/png',
				},
			],
		} );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.media ).toEqual( [
			{
				type: 'image/png',
				url: 'https://example.com/sig-image.jpg',
				alt: '',
			},
		] );
	} );

	it( 'should default to image/jpeg for SIG images without type', () => {
		mockUsePostMeta.mockReturnValue( {
			...getDefaultMockPostMeta(),
			attachedMedia: [
				{
					id: 0,
					url: 'https://example.com/sig-image.jpg',
					type: '',
				},
			],
		} );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.media ).toEqual( [
			{
				type: 'image/jpeg',
				url: 'https://example.com/sig-image.jpg',
				alt: '',
			},
		] );
	} );

	it( 'should fetch media details from store for attached media with IDs', () => {
		const mockMediaItem = {
			id: 123,
			mime_type: 'image/png',
			alt_text: 'Alt text',
			source_url: 'https://example.com/image.png',
		};

		mockUsePostMeta.mockReturnValue( {
			...getDefaultMockPostMeta(),
			attachedMedia: [ { id: 123, type: 'image/png', url: 'https://example.com/image.png' } ],
		} );

		mockGetMediaSourceUrl.mockReturnValue( 'https://example.com/image.png' );

		mockUseSelect.mockImplementation( ( selectorOrMapper: unknown ) => {
			if ( typeof selectorOrMapper === 'function' ) {
				const mockSelect = () => ( {
					getEntityRecords: jest.fn().mockReturnValue( [ mockMediaItem ] ),
					getEntityRecord: jest.fn().mockReturnValue( null ),
					getEditedPostAttribute: mockGetEditedPostAttribute,
					getEditedPostContent: jest.fn().mockReturnValue( '' ),
				} );
				return selectorOrMapper( mockSelect );
			}
			return { getEditedPostAttribute: mockGetEditedPostAttribute };
		} );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.media ).toEqual( [
			{
				type: 'image/png',
				url: 'https://example.com/image.png',
				alt: 'Alt text',
			},
		] );
	} );

	it( 'should use SIG image URL when enabled', () => {
		mockUsePostMeta.mockReturnValue( {
			...getDefaultMockPostMeta(),
			imageGeneratorSettings: {
				enabled: true,
				token: 'test-token',
			},
		} );

		mockGetSigImageUrl.mockReturnValue( 'https://example.com/sig-generated.jpg' );

		mockUseSelect.mockImplementation( ( selectorOrMapper: unknown ) => {
			if ( typeof selectorOrMapper === 'function' ) {
				const mockSelect = () => ( {
					getEntityRecords: jest.fn().mockReturnValue( [] ),
					getEntityRecord: jest.fn().mockReturnValue( null ),
					getEditedPostAttribute: mockGetEditedPostAttribute,
					getEditedPostContent: jest.fn().mockReturnValue( '' ),
				} );
				return selectorOrMapper( mockSelect );
			}
			return { getEditedPostAttribute: mockGetEditedPostAttribute };
		} );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.image ).toBe( 'https://example.com/sig-generated.jpg' );
	} );

	it( 'should use featured image when no SIG', () => {
		const mockFeaturedMedia = {
			id: 456,
			source_url: 'https://example.com/featured.jpg',
		};

		mockGetEditedPostAttribute.mockImplementation( ( attr: string ) => {
			const attributes: Record< string, unknown > = {
				title: 'Test Title',
				excerpt: '',
				content: '',
				link: 'https://example.com/test-post',
				featured_media: 456,
				meta: {},
			};
			return attributes[ attr ];
		} );

		mockGetMediaSourceUrl.mockReturnValue( 'https://example.com/featured.jpg' );

		mockUseSelect.mockImplementation( ( selectorOrMapper: unknown ) => {
			if ( typeof selectorOrMapper === 'function' ) {
				const mockSelect = () => ( {
					getEntityRecords: jest.fn().mockReturnValue( [] ),
					getEntityRecord: jest.fn().mockReturnValue( mockFeaturedMedia ),
					getEditedPostAttribute: mockGetEditedPostAttribute,
					getEditedPostContent: jest.fn().mockReturnValue( '' ),
				} );
				return selectorOrMapper( mockSelect );
			}
			return { getEditedPostAttribute: mockGetEditedPostAttribute };
		} );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.image ).toBe( 'https://example.com/featured.jpg' );
	} );

	it( 'should extract image from post content when no featured image', () => {
		mockGetPostImageUrl.mockReturnValue( 'https://example.com/content-image.jpg' );

		mockUseSelect.mockImplementation( ( selectorOrMapper: unknown ) => {
			if ( typeof selectorOrMapper === 'function' ) {
				const mockSelect = () => ( {
					getEntityRecords: jest.fn().mockReturnValue( [] ),
					getEntityRecord: jest.fn().mockReturnValue( null ),
					getEditedPostAttribute: mockGetEditedPostAttribute,
					getEditedPostContent: jest
						.fn()
						.mockReturnValue( '<img src="https://example.com/content-image.jpg">' ),
				} );
				return selectorOrMapper( mockSelect );
			}
			return { getEditedPostAttribute: mockGetEditedPostAttribute };
		} );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.image ).toBe( 'https://example.com/content-image.jpg' );
	} );

	it( 'should return empty string for image when none available', () => {
		mockUseSelect.mockImplementation( ( selectorOrMapper: unknown ) => {
			if ( typeof selectorOrMapper === 'function' ) {
				const mockSelect = () => ( {
					getEntityRecords: jest.fn().mockReturnValue( [] ),
					getEntityRecord: jest.fn().mockReturnValue( null ),
					getEditedPostAttribute: mockGetEditedPostAttribute,
					getEditedPostContent: jest.fn().mockReturnValue( '' ),
				} );
				return selectorOrMapper( mockSelect );
			}
			return { getEditedPostAttribute: mockGetEditedPostAttribute };
		} );

		mockGetPostImageUrl.mockReturnValue( null );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.image ).toBe( '' );
	} );

	it( 'should not fetch media when there are no attached media IDs', () => {
		mockUsePostMeta.mockReturnValue( getDefaultMockPostMeta() );

		const mockGetEntityRecords = jest.fn().mockReturnValue( [] );

		mockUseSelect.mockImplementation( ( selectorOrMapper: unknown ) => {
			if ( typeof selectorOrMapper === 'function' ) {
				const mockSelect = () => ( {
					getEntityRecords: mockGetEntityRecords,
					getEntityRecord: jest.fn().mockReturnValue( null ),
					getEditedPostAttribute: mockGetEditedPostAttribute,
					getEditedPostContent: jest.fn().mockReturnValue( '' ),
				} );
				return selectorOrMapper( mockSelect );
			}
			return { getEditedPostAttribute: mockGetEditedPostAttribute };
		} );

		renderHook( () => useSocialPreviewPostData() );

		// getEntityRecords should not be called when there are no media IDs
		expect( mockGetEntityRecords ).not.toHaveBeenCalled();
	} );
} );
