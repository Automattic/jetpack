import { act, renderHook } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { useLinkPreviewPostData } from '../';
import { FOCAL_POINT_META_KEY } from '../../../utils/focal-point';
import { clearFocalPointOverlay, setFocalPointOverlay } from '../../../utils/focal-point-overlay';
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

jest.mock( '../../use-sig-preview/utils', () => ( {
	getSigImageUrl: jest.fn(),
} ) );

jest.mock( '../utils', () => ( {
	getMediaSourceUrl: jest.fn(),
	getPostImageUrl: jest.fn(),
} ) );

const mockUseSelect = useSelect as jest.Mock;
const mockGetSigImageUrl = getSigImageUrl as jest.MockedFunction< typeof getSigImageUrl >;
const mockGetMediaSourceUrl = getMediaSourceUrl as jest.MockedFunction< typeof getMediaSourceUrl >;
const mockGetPostImageUrl = getPostImageUrl as jest.MockedFunction< typeof getPostImageUrl >;

const mockGetEditedPostAttribute = jest.fn();

const getDefaultAttributes = (): Record< string, unknown > => ( {
	title: 'Test Post Title',
	excerpt: 'Test excerpt',
	content: 'Test content',
	link: 'https://example.com/test-post',
	featured_media: 0,
	meta: {},
} );

const setupMocks = ( {
	attributes = getDefaultAttributes(),
	site = { name: 'Test Site', site_icon_url: '' },
	featuredMediaRecord = null,
	editedPostContent = '',
}: {
	attributes?: Record< string, unknown >;
	site?: { name: string; site_icon_url?: string } | null;
	featuredMediaRecord?: Record< string, unknown > | null;
	editedPostContent?: string;
} = {} ) => {
	mockGetEditedPostAttribute.mockImplementation( ( attr: string ) => attributes[ attr ] );

	mockUseSelect.mockImplementation( ( selectorOrMapper: unknown ) => {
		if ( typeof selectorOrMapper === 'function' ) {
			const mockSelect = () => ( {
				getEntityRecord: jest.fn().mockReturnValue( featuredMediaRecord ),
				getEditedPostAttribute: mockGetEditedPostAttribute,
				getEditedPostContent: jest.fn().mockReturnValue( editedPostContent ),
				getSite: jest.fn().mockReturnValue( site ),
				getUnstableBase: jest.fn().mockReturnValue( site ),
			} );
			return selectorOrMapper( mockSelect );
		}

		return { getEditedPostAttribute: mockGetEditedPostAttribute };
	} );
};

describe( 'useLinkPreviewPostData', () => {
	beforeEach( () => {
		jest.clearAllMocks();

		mockGetSigImageUrl.mockReturnValue( '' );
		mockGetMediaSourceUrl.mockReturnValue( '' );
		mockGetPostImageUrl.mockReturnValue( null );

		setupMocks();
	} );

	it( 'should return basic post data', () => {
		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.title ).toBe( 'Test Post Title' );
		expect( result.current.description ).toBe( 'Test excerpt' );
		expect( result.current.url ).toBe( 'https://example.com/test-post' );
		expect( result.current.siteTitle ).toBe( 'Test Site' );
		expect( result.current.image ).toBe( '' );
	} );

	it( 'should use SEO title when available', () => {
		setupMocks( {
			attributes: {
				...getDefaultAttributes(),
				title: 'Regular Title',
				meta: {
					jetpack_seo_html_title: 'SEO Title',
				},
			},
		} );

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.title ).toBe( 'SEO Title' );
	} );

	it( 'should use advanced SEO description when available', () => {
		setupMocks( {
			attributes: {
				...getDefaultAttributes(),
				meta: {
					advanced_seo_description: 'SEO Description',
				},
			},
		} );

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.description ).toBe( 'SEO Description' );
	} );

	it( 'should fall back to excerpt for description', () => {
		setupMocks( {
			attributes: {
				...getDefaultAttributes(),
				excerpt: 'Post excerpt',
				meta: {},
			},
		} );

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.description ).toBe( 'Post excerpt' );
	} );

	it( 'should use content before more tag when no excerpt', () => {
		setupMocks( {
			attributes: {
				...getDefaultAttributes(),
				excerpt: '',
				content: 'Content before more<!--more-->Content after more',
				meta: {},
			},
		} );

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.description ).toBe( 'Content before more' );
	} );

	it( 'should trim whitespace from title and description', () => {
		setupMocks( {
			attributes: {
				...getDefaultAttributes(),
				title: '  Title with spaces  ',
				excerpt: '  Excerpt with spaces  ',
				meta: {},
			},
		} );

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.title ).toBe( 'Title with spaces' );
		expect( result.current.description ).toBe( 'Excerpt with spaces' );
	} );

	it( 'should use SIG image URL when enabled', () => {
		mockGetSigImageUrl.mockReturnValue( 'https://example.com/sig-generated.jpg' );

		setupMocks( {
			attributes: {
				...getDefaultAttributes(),
				meta: {
					jetpack_social_options: {
						image_generator_settings: {
							enabled: true,
							token: 'test-token',
						},
					},
				},
			},
		} );

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.image ).toBe( 'https://example.com/sig-generated.jpg' );
	} );

	it( 'should use featured image when no SIG', () => {
		const mockFeaturedMedia = {
			id: 456,
			source_url: 'https://example.com/featured.jpg',
		};

		mockGetMediaSourceUrl.mockReturnValue( 'https://example.com/featured.jpg' );

		setupMocks( {
			attributes: {
				...getDefaultAttributes(),
				featured_media: 456,
			},
			featuredMediaRecord: mockFeaturedMedia,
		} );

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.image ).toBe( 'https://example.com/featured.jpg' );
	} );

	it( 'should extract image from post content when no featured image', () => {
		mockGetPostImageUrl.mockReturnValue( 'https://example.com/content-image.jpg' );

		setupMocks( {
			editedPostContent: '<img src="https://example.com/content-image.jpg">',
		} );

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.image ).toBe( 'https://example.com/content-image.jpg' );
	} );

	it( 'should return empty string for siteTitle when site is not loaded', () => {
		setupMocks( { site: null } );

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.siteTitle ).toBe( '' );
	} );

	it( 'should return empty string for image when none available', () => {
		mockGetPostImageUrl.mockReturnValue( null );

		setupMocks();

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.image ).toBe( '' );
	} );

	it( 'should resolve imageFocalPoint from the featured image meta', () => {
		mockGetMediaSourceUrl.mockReturnValue( 'https://example.com/featured.jpg' );

		setupMocks( {
			attributes: {
				...getDefaultAttributes(),
				featured_media: 456,
			},
			featuredMediaRecord: {
				id: 456,
				meta: { [ FOCAL_POINT_META_KEY ]: { x: 0.25, y: 0.75 } },
			},
		} );

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.imageFocalPoint ).toEqual( { x: 0.25, y: 0.75 } );
	} );

	it( 'should leave imageFocalPoint undefined when the featured image has no stored point', () => {
		mockGetMediaSourceUrl.mockReturnValue( 'https://example.com/featured.jpg' );

		setupMocks( {
			attributes: {
				...getDefaultAttributes(),
				featured_media: 456,
			},
			featuredMediaRecord: { id: 456, meta: {} },
		} );

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.imageFocalPoint ).toBeUndefined();
	} );

	it( 'should clear imageFocalPoint when a SIG image replaces the featured image', () => {
		mockGetSigImageUrl.mockReturnValue( 'https://example.com/sig-generated.jpg' );
		mockGetMediaSourceUrl.mockReturnValue( 'https://example.com/featured.jpg' );

		setupMocks( {
			attributes: {
				...getDefaultAttributes(),
				featured_media: 456,
				meta: {
					jetpack_social_options: {
						image_generator_settings: { enabled: true, token: 'test-token' },
					},
				},
			},
			featuredMediaRecord: {
				id: 456,
				meta: { [ FOCAL_POINT_META_KEY ]: { x: 0.25, y: 0.75 } },
			},
		} );

		const { result } = renderHook( () => useLinkPreviewPostData() );

		expect( result.current.image ).toBe( 'https://example.com/sig-generated.jpg' );
		expect( result.current.imageFocalPoint ).toBeUndefined();
	} );

	it( 'should prefer the live overlay point over the stored one for the featured image', () => {
		mockGetMediaSourceUrl.mockReturnValue( 'https://example.com/featured.jpg' );

		setupMocks( {
			attributes: {
				...getDefaultAttributes(),
				featured_media: 456,
			},
			featuredMediaRecord: {
				id: 456,
				meta: { [ FOCAL_POINT_META_KEY ]: { x: 0.25, y: 0.75 } },
			},
		} );

		// Simulate the picker dragging a new point (not yet persisted).
		setFocalPointOverlay( 456, { x: 0.1, y: 0.9 } );

		try {
			const { result } = renderHook( () => useLinkPreviewPostData() );

			expect( result.current.imageFocalPoint ).toEqual( { x: 0.1, y: 0.9 } );
		} finally {
			act( () => {
				clearFocalPointOverlay( 456 );
			} );
		}
	} );

	it( 'should not apply the overlay when a SIG image is shown instead of the featured image', () => {
		mockGetSigImageUrl.mockReturnValue( 'https://example.com/sig-generated.jpg' );
		mockGetMediaSourceUrl.mockReturnValue( 'https://example.com/featured.jpg' );

		setupMocks( {
			attributes: {
				...getDefaultAttributes(),
				featured_media: 456,
				meta: {
					jetpack_social_options: {
						image_generator_settings: { enabled: true, token: 'test-token' },
					},
				},
			},
			featuredMediaRecord: {
				id: 456,
				meta: { [ FOCAL_POINT_META_KEY ]: { x: 0.25, y: 0.75 } },
			},
		} );

		// Even with a live overlay on the featured image, the SIG image is the one
		// being shown, so no focal point should leak through.
		setFocalPointOverlay( 456, { x: 0.1, y: 0.9 } );

		try {
			const { result } = renderHook( () => useLinkPreviewPostData() );

			expect( result.current.image ).toBe( 'https://example.com/sig-generated.jpg' );
			expect( result.current.imageFocalPoint ).toBeUndefined();
		} finally {
			act( () => {
				clearFocalPointOverlay( 456 );
			} );
		}
	} );
} );
