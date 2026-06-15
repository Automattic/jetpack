import { renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { useSocialPreviewPostData } from '../';
import { useLinkPreviewPostData } from '../../use-link-preview-post-data';
import { getMediaSourceUrl } from '../../use-link-preview-post-data/utils';
import { usePostMeta } from '../../use-post-meta';

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

jest.mock( '../../use-link-preview-post-data', () => ( {
	useLinkPreviewPostData: jest.fn(),
} ) );

jest.mock( '../../use-link-preview-post-data/utils', () => ( {
	getMediaSourceUrl: jest.fn(),
} ) );

const mockUsePostMeta = usePostMeta as jest.MockedFunction< typeof usePostMeta >;
const mockUseSelect = useSelect as jest.Mock;
const mockUseLinkPreviewPostData = useLinkPreviewPostData as jest.MockedFunction<
	typeof useLinkPreviewPostData
>;
const mockGetMediaSourceUrl = getMediaSourceUrl as jest.MockedFunction< typeof getMediaSourceUrl >;

const mockGetEditedPostAttribute = jest.fn();
const mockGetEditedPostContent = jest.fn( () => '' );

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

const getDefaultLinkPreviewData = () => ( {
	title: 'Test Post Title',
	description: 'Test description',
	image: '',
	siteTitle: 'Test Site',
	url: 'https://example.com/test-post',
} );

describe( 'useSocialPreviewPostData', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		mockUsePostMeta.mockReturnValue( getDefaultMockPostMeta() );
		mockUseLinkPreviewPostData.mockReturnValue( getDefaultLinkPreviewData() );
		mockGetMediaSourceUrl.mockReturnValue( '' );

		mockGetEditedPostAttribute.mockImplementation( ( attr: string ) => {
			const attributes: Record< string, unknown > = {
				excerpt: 'Test excerpt',
				content: 'Test content',
			};
			return attributes[ attr ];
		} );

		mockUseSelect.mockImplementation( ( selectorOrMapper: unknown ) => {
			if ( typeof selectorOrMapper === 'function' ) {
				const mockSelect = () => ( {
					getEntityRecords: jest.fn().mockReturnValue( [] ),
					getEditedPostAttribute: mockGetEditedPostAttribute,
					getEditedPostContent: mockGetEditedPostContent,
				} );
				return selectorOrMapper( mockSelect );
			}

			return { getEditedPostAttribute: mockGetEditedPostAttribute };
		} );
	} );

	it( 'should spread link preview data into the result', () => {
		const linkPreviewData = {
			title: 'Link Preview Title',
			description: 'Link Preview Description',
			image: 'https://example.com/image.jpg',
			siteTitle: 'Link Preview Site',
			url: 'https://example.com/link-preview',
		};
		mockUseLinkPreviewPostData.mockReturnValue( linkPreviewData );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.title ).toBe( 'Link Preview Title' );
		expect( result.current.description ).toBe( 'Link Preview Description' );
		expect( result.current.image ).toBe( 'https://example.com/image.jpg' );
		expect( result.current.siteTitle ).toBe( 'Link Preview Site' );
		expect( result.current.url ).toBe( 'https://example.com/link-preview' );
	} );

	it( 'should return excerpt from post attributes', () => {
		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.excerpt ).toBe( 'Test excerpt' );
	} );

	it( 'should use content before more tag when no excerpt', () => {
		mockGetEditedPostAttribute.mockImplementation( ( attr: string ) => {
			const attributes: Record< string, unknown > = {
				excerpt: '',
				content: 'Content before more<!--more-->Content after more',
			};
			return attributes[ attr ];
		} );

		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.excerpt ).toBe( 'Content before more' );
	} );

	it( 'should return empty media when no attached media', () => {
		const { result } = renderHook( () => useSocialPreviewPostData() );

		expect( result.current.media ).toEqual( [] );
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
					getEditedPostAttribute: mockGetEditedPostAttribute,
					getEditedPostContent: mockGetEditedPostContent,
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

	it( 'should not fetch media when there are no attached media IDs', () => {
		mockUsePostMeta.mockReturnValue( getDefaultMockPostMeta() );

		const mockGetEntityRecords = jest.fn().mockReturnValue( [] );

		mockUseSelect.mockImplementation( ( selectorOrMapper: unknown ) => {
			if ( typeof selectorOrMapper === 'function' ) {
				const mockSelect = () => ( {
					getEntityRecords: mockGetEntityRecords,
					getEditedPostAttribute: mockGetEditedPostAttribute,
					getEditedPostContent: mockGetEditedPostContent,
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
