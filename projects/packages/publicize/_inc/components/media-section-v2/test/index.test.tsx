import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MediaSectionV2 from '..';
import useFeaturedImage from '../../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../../hooks/use-image-generator-config';
import useMediaDetails from '../../../hooks/use-media-details';
import { usePostMeta } from '../../../hooks/use-post-meta';
import useSigPreview from '../../../hooks/use-sig-preview';

// Mock functions
const mockUpdateJetpackSocialOptions = jest.fn();
const mockRecordEvent = jest.fn();
const mockOpenUnifiedModal = jest.fn();
const mockApplyFilters = jest.fn();
const mockSiteHasFeature = jest.fn< boolean, [ string ] >( () => true );
const mockSetFocalPoint = jest.fn();
const mockSetPreviewFocalPoint = jest.fn();
const getMockMediaFocalPoint = ( canEdit: boolean | undefined = true ) => ( {
	value: { x: 0.5, y: 0.5 },
	canEdit,
	setPreviewFocalPoint: mockSetPreviewFocalPoint,
	setFocalPoint: mockSetFocalPoint,
} );
const mockUseMediaFocalPoint = jest.fn( () => getMockMediaFocalPoint() );

jest.mock( '@automattic/jetpack-script-data', () => {
	const actual = jest.requireActual( '@automattic/jetpack-script-data' );
	return {
		...actual,
		siteHasFeature: ( feature: string ) => mockSiteHasFeature( feature ),
	};
} );

jest.mock( '../use-media-focal-point', () => ( {
	useMediaFocalPoint: () => mockUseMediaFocalPoint(),
} ) );

// Mock the social store to prevent importing @wordpress/editor
jest.mock( '../../../social-store', () => ( {
	store: 'jetpack-social',
} ) );

// Mock @wordpress/data using Proxy pattern
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const mocks = {
		useDispatch: () => ( {
			openUnifiedModal: mockOpenUnifiedModal,
		} ),
	};
	return new Proxy( actual, {
		get( target, property ) {
			return mocks[ property ] ?? target[ property ];
		},
	} );
} );

jest.mock( '../../../hooks/use-featured-image', () => {
	return jest.fn( () => 123 );
} );

jest.mock( '../../../hooks/use-image-generator-config', () => {
	return jest.fn( () => ( {
		isEnabled: false,
		setIsEnabled: jest.fn(),
	} ) );
} );

jest.mock( '../../../hooks/use-media-details', () => {
	return jest.fn( () => [
		{
			mediaData: {
				sourceUrl: 'https://example.com/featured.jpg',
			},
			metaData: {
				mime: 'image/jpeg',
			},
		},
	] );
} );

jest.mock( '../../../hooks/use-post-meta', () => ( {
	usePostMeta: jest.fn( () => ( {
		attachedMedia: [],
		imageGeneratorSettings: { enabled: false },
		mediaSource: undefined,
		updateJetpackSocialOptions: mockUpdateJetpackSocialOptions,
	} ) ),
} ) );

jest.mock( '../../../hooks/use-sig-preview', () => {
	return jest.fn( () => ( {
		url: 'https://example.com/sig-preview.jpg',
		isLoading: false,
	} ) );
} );

jest.mock( '@automattic/jetpack-shared-extension-utils', () => ( {
	useAnalytics: () => ( {
		recordEvent: mockRecordEvent,
	} ),
} ) );

jest.mock( '../../../utils', () => ( {
	getSocialScriptData: jest.fn( () => ( {
		plugin_info: {
			jetpack: { version: '15.5' },
		},
	} ) ),
	features: jest.requireActual( '../../../utils/constants' ).features,
} ) );

jest.mock(
	'@automattic/jetpack-ai-client',
	() => ( {
		GeneralPurposeImage: () => <div data-testid="ai-image-modal">AI Image Modal</div>,
		AiSVG: 'svg',
	} ),
	{ virtual: true }
);

jest.mock( '@wordpress/hooks', () => ( {
	applyFilters: ( ...args: unknown[] ) => mockApplyFilters( ...args ),
} ) );

jest.mock( '@wordpress/block-editor', () => ( {
	MediaUpload: ( {
		render: renderProp,
		onSelect,
	}: {
		render: ( props: { open: () => void } ) => React.ReactNode;
		onSelect: ( media: unknown ) => void;
	} ) => {
		const open = () => {
			onSelect( {
				id: 456,
				url: 'https://example.com/selected.jpg',
				mime: 'image/jpeg',
			} );
		};
		return renderProp( { open } );
	},
} ) );

describe( 'MediaSectionV2', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'Initial rendering', () => {
		it( 'should render the Media label', () => {
			render( <MediaSectionV2 /> );

			expect( screen.getByText( 'Media' ) ).toBeInTheDocument();
		} );

		it( 'should show featured image description when featured image is detected', () => {
			render( <MediaSectionV2 /> );

			expect( screen.getByText( 'You are using your post featured image.' ) ).toBeInTheDocument();
		} );

		it( 'should show featured image preview', () => {
			render( <MediaSectionV2 /> );

			const img = screen.getByRole( 'img' );
			expect( img ).toBeInTheDocument();
			expect( img ).toHaveAttribute( 'src', 'https://example.com/featured.jpg' );
		} );
	} );

	describe( 'No media state', () => {
		beforeEach( () => {
			( useFeaturedImage as jest.Mock ).mockReturnValue( null );
			( useMediaDetails as jest.Mock ).mockReturnValue( [ null, false ] );
		} );

		afterEach( () => {
			( useFeaturedImage as jest.Mock ).mockReturnValue( 123 );
			( useMediaDetails as jest.Mock ).mockReturnValue( [
				{
					mediaData: { sourceUrl: 'https://example.com/featured.jpg' },
					metaData: { mime: 'image/jpeg' },
				},
				false,
			] );
		} );

		it( 'should show no-image warning when no fallback image is available', () => {
			render( <MediaSectionV2 /> );

			expect( screen.getByText( "Your post won't show an image." ) ).toBeInTheDocument();
		} );

		it( 'should show Select button when no media', () => {
			render( <MediaSectionV2 /> );

			expect( screen.getByRole( 'button', { name: 'Select' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Attached media state', () => {
		beforeEach( () => {
			( usePostMeta as jest.Mock ).mockReturnValue( {
				attachedMedia: [ { id: 789, url: 'https://example.com/attached.jpg', type: 'image/jpeg' } ],
				imageGeneratorSettings: { enabled: false },
				mediaSource: 'media-library',
				updateJetpackSocialOptions: mockUpdateJetpackSocialOptions,
			} );
			( useMediaDetails as jest.Mock ).mockReturnValue( [
				{
					mediaData: { sourceUrl: 'https://example.com/attached.jpg' },
					metaData: { mime: 'image/jpeg' },
				},
				false,
			] );
		} );

		afterEach( () => {
			( usePostMeta as jest.Mock ).mockReturnValue( {
				attachedMedia: [],
				imageGeneratorSettings: { enabled: false },
				mediaSource: undefined,
				updateJetpackSocialOptions: mockUpdateJetpackSocialOptions,
			} );
		} );

		it( 'should show custom image description when attached media exists', () => {
			render( <MediaSectionV2 /> );

			expect( screen.getByText( 'You are using a custom image.' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'SIG enabled state', () => {
		beforeEach( () => {
			( useImageGeneratorConfig as jest.Mock ).mockReturnValue( {
				isEnabled: true,
				setIsEnabled: jest.fn(),
			} );
		} );

		afterEach( () => {
			( useImageGeneratorConfig as jest.Mock ).mockReturnValue( {
				isEnabled: false,
				setIsEnabled: jest.fn(),
			} );
		} );

		it( 'should show SIG description when SIG is enabled', () => {
			render( <MediaSectionV2 /> );

			expect( screen.getByText( 'You are using the template.' ) ).toBeInTheDocument();
		} );

		it( 'should show SIG preview image', () => {
			render( <MediaSectionV2 /> );

			const img = screen.getByRole( 'img' );
			expect( img ).toHaveAttribute( 'src', 'https://example.com/sig-preview.jpg' );
		} );

		it( 'should not show SIG preview image when loading', () => {
			( useSigPreview as jest.Mock ).mockReturnValue( {
				url: '',
				isLoading: true,
			} );

			render( <MediaSectionV2 /> );

			// When SIG is loading, the preview image should not be visible yet
			expect( screen.queryByRole( 'img' ) ).not.toBeInTheDocument();

			// Reset
			( useSigPreview as jest.Mock ).mockReturnValue( {
				url: 'https://example.com/sig-preview.jpg',
				isLoading: false,
			} );
		} );
	} );

	describe( 'Source selection', () => {
		it( 'should call updateJetpackSocialOptions when selecting SIG', async () => {
			const user = userEvent.setup();

			render( <MediaSectionV2 /> );

			// Open dropdown
			await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

			// Select SIG
			await user.click( screen.getByRole( 'menuitemradio', { name: 'Social image template' } ) );

			expect( mockUpdateJetpackSocialOptions ).toHaveBeenCalledWith( {
				media_source: 'sig',
				attached_media: [],
				image_generator_settings: { enabled: true },
			} );
		} );

		it( 'should call updateJetpackSocialOptions when selecting Use featured image', async () => {
			const user = userEvent.setup();

			// Start with SIG enabled
			( useImageGeneratorConfig as jest.Mock ).mockReturnValue( {
				isEnabled: true,
				setIsEnabled: jest.fn(),
			} );

			render( <MediaSectionV2 /> );

			// Open dropdown
			await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

			// Select Use featured image
			await user.click( screen.getByRole( 'menuitemradio', { name: 'Featured image' } ) );

			expect( mockUpdateJetpackSocialOptions ).toHaveBeenCalledWith( {
				media_source: 'featured-image',
				attached_media: [],
				image_generator_settings: { enabled: false },
			} );

			// Reset
			( useImageGeneratorConfig as jest.Mock ).mockReturnValue( {
				isEnabled: false,
				setIsEnabled: jest.fn(),
			} );
		} );

		it( 'should record analytics event when source is changed', async () => {
			const user = userEvent.setup();

			render( <MediaSectionV2 analyticsData={ { test: 'data' } } /> );

			// Open dropdown
			await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

			// Select SIG
			await user.click( screen.getByRole( 'menuitemradio', { name: 'Social image template' } ) );

			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_social_media_source_changed', {
				test: 'data',
				source: 'sig',
			} );
		} );
	} );

	describe( 'Switch to Default option', () => {
		beforeEach( () => {
			( usePostMeta as jest.Mock ).mockReturnValue( {
				attachedMedia: [],
				imageGeneratorSettings: { enabled: true },
				mediaSource: 'sig',
				updateJetpackSocialOptions: mockUpdateJetpackSocialOptions,
			} );
		} );

		afterEach( () => {
			( usePostMeta as jest.Mock ).mockReturnValue( {
				attachedMedia: [],
				imageGeneratorSettings: { enabled: false },
				mediaSource: undefined,
				updateJetpackSocialOptions: mockUpdateJetpackSocialOptions,
			} );
		} );

		it( 'should unset media_source and attached_media when Default is selected', async () => {
			const user = userEvent.setup();

			render(
				<MediaSectionV2
					analyticsData={ { test: 'data' } }
					attachmentToggleMode="hidden"
					mediaSource="sig"
					imageGeneratorSettings={ { enabled: true } }
					onMediaChange={ mockUpdateJetpackSocialOptions }
				/>
			);

			// Open dropdown
			await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

			// Click Default
			await user.click( screen.getByRole( 'menuitemradio', { name: 'Default' } ) );

			expect( mockUpdateJetpackSocialOptions ).toHaveBeenCalledWith( {
				media_source: undefined,
				attached_media: undefined,
				image_generator_settings: { enabled: false },
			} );
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_social_media_source_changed', {
				test: 'data',
				source: null,
			} );
		} );
	} );

	describe( 'Disabled state', () => {
		beforeEach( () => {
			( usePostMeta as jest.Mock ).mockReturnValue( {
				attachedMedia: [ { id: 789, url: 'https://example.com/attached.jpg', type: 'image/jpeg' } ],
				imageGeneratorSettings: { enabled: false },
				mediaSource: 'media-library',
				updateJetpackSocialOptions: mockUpdateJetpackSocialOptions,
			} );
		} );

		afterEach( () => {
			( usePostMeta as jest.Mock ).mockReturnValue( {
				attachedMedia: [],
				imageGeneratorSettings: { enabled: false },
				mediaSource: undefined,
				updateJetpackSocialOptions: mockUpdateJetpackSocialOptions,
			} );
		} );

		it( 'should disable Select button when disabled prop is true', () => {
			render( <MediaSectionV2 disabled={ true } /> );

			expect( screen.getByRole( 'button', { name: 'Select' } ) ).toBeDisabled();
		} );
	} );

	describe( 'Focal point picker', () => {
		const attachedImageState = {
			attachedMedia: [ { id: 789, url: 'https://example.com/attached.jpg', type: 'image/jpeg' } ],
			imageGeneratorSettings: { enabled: false },
			mediaSource: 'media-library',
			updateJetpackSocialOptions: mockUpdateJetpackSocialOptions,
		};

		afterEach( () => {
			mockSiteHasFeature.mockReturnValue( true );
			mockUseMediaFocalPoint.mockReturnValue( getMockMediaFocalPoint() );
			( usePostMeta as jest.Mock ).mockReturnValue( {
				attachedMedia: [],
				imageGeneratorSettings: { enabled: false },
				mediaSource: undefined,
				updateJetpackSocialOptions: mockUpdateJetpackSocialOptions,
			} );
			( useMediaDetails as jest.Mock ).mockReturnValue( [
				{
					mediaData: { sourceUrl: 'https://example.com/featured.jpg' },
					metaData: { mime: 'image/jpeg' },
				},
				false,
			] );
		} );

		it( 'should hide the picker when the feature flag is off', () => {
			mockSiteHasFeature.mockReturnValue( false );
			( useMediaDetails as jest.Mock ).mockReturnValue( [
				{
					mediaData: { sourceUrl: 'https://example.com/featured.jpg' },
					metaData: { mime: 'image/jpeg' },
				},
				false,
			] );

			render( <MediaSectionV2 /> );

			expect( mockSiteHasFeature ).toHaveBeenCalledWith( 'social-image-focal-point' );
			expect( screen.queryByText( 'Focal point' ) ).not.toBeInTheDocument();
			// The plain preview is shown instead.
			expect( screen.getByRole( 'img' ) ).toHaveAttribute(
				'src',
				'https://example.com/featured.jpg'
			);
		} );

		it( 'should hide the picker when the user cannot edit the image', () => {
			mockUseMediaFocalPoint.mockReturnValue( getMockMediaFocalPoint( false ) );

			render( <MediaSectionV2 /> );

			expect( screen.queryByText( 'Focal point' ) ).not.toBeInTheDocument();
			// The plain preview is shown instead.
			expect( screen.getByRole( 'img' ) ).toHaveAttribute(
				'src',
				'https://example.com/featured.jpg'
			);
		} );

		it( 'should show the picker for an attached image', () => {
			( usePostMeta as jest.Mock ).mockReturnValue( attachedImageState );
			( useMediaDetails as jest.Mock ).mockReturnValue( [
				{
					mediaData: { sourceUrl: 'https://example.com/attached.jpg' },
					metaData: { mime: 'image/jpeg' },
				},
				false,
			] );

			render( <MediaSectionV2 /> );

			expect( screen.getByText( 'Focal point' ) ).toBeInTheDocument();
		} );

		it( 'should show the picker for the featured image', () => {
			render( <MediaSectionV2 /> );

			expect( screen.getByText( 'Focal point' ) ).toBeInTheDocument();
		} );

		it( 'should hide the picker when SIG is the media source', () => {
			( usePostMeta as jest.Mock ).mockReturnValue( {
				attachedMedia: [],
				imageGeneratorSettings: { enabled: true },
				mediaSource: 'sig',
				updateJetpackSocialOptions: mockUpdateJetpackSocialOptions,
			} );

			render( <MediaSectionV2 /> );

			expect( screen.queryByText( 'Focal point' ) ).not.toBeInTheDocument();
			// The plain preview is shown instead.
			expect( screen.getByRole( 'img' ) ).toHaveAttribute(
				'src',
				'https://example.com/sig-preview.jpg'
			);
		} );

		it( 'should hide the picker for videos', () => {
			( usePostMeta as jest.Mock ).mockReturnValue( {
				...attachedImageState,
				attachedMedia: [ { id: 789, url: 'https://example.com/video.mp4', type: 'video/mp4' } ],
			} );
			( useMediaDetails as jest.Mock ).mockReturnValue( [
				{
					mediaData: { sourceUrl: 'https://example.com/video.mp4' },
					metaData: { mime: 'video/mp4' },
				},
				false,
			] );

			render( <MediaSectionV2 /> );

			expect( screen.queryByText( 'Focal point' ) ).not.toBeInTheDocument();
		} );

		it( 'should show the picker in per-network/controlled mode', () => {
			render(
				<MediaSectionV2
					attachmentToggleMode="hidden"
					mediaSource="media-library"
					attachedMedia={ [
						{ id: 789, url: 'https://example.com/attached.jpg', type: 'image/jpeg' },
					] }
					onMediaChange={ mockUpdateJetpackSocialOptions }
				/>
			);

			// The point is per image, not per connection, so the picker renders in
			// controlled mode too and writes the image's attachment meta directly.
			expect( screen.getByText( 'Focal point' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'imageGenerationHandler filter', () => {
		it( 'should call applyFilters with correct arguments', () => {
			mockApplyFilters.mockReturnValue( null );

			render( <MediaSectionV2 /> );

			expect( mockApplyFilters ).toHaveBeenCalledWith(
				'jetpack.ai.imageGenerationHandler',
				null,
				expect.objectContaining( {
					entryPoint: 'social-media',
					onImageSelect: expect.any( Function ),
				} )
			);
		} );

		it( 'should open default AI modal when no filter handler is registered', async () => {
			const user = userEvent.setup();
			mockApplyFilters.mockReturnValue( null );

			render( <MediaSectionV2 /> );

			// Modal should not be visible initially
			expect( screen.queryByTestId( 'ai-image-modal' ) ).not.toBeInTheDocument();

			// Open dropdown
			await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

			// Click Generate image option
			await user.click( screen.getByRole( 'menuitemradio', { name: 'Generate image' } ) );

			// The GeneralPurposeImage modal should now be rendered
			expect( screen.getByTestId( 'ai-image-modal' ) ).toBeInTheDocument();
		} );

		it( 'should call custom handler when filter provides one', async () => {
			const user = userEvent.setup();
			const mockCustomHandler = jest.fn();
			mockApplyFilters.mockReturnValue( mockCustomHandler );

			render( <MediaSectionV2 /> );

			// Open dropdown
			await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

			// Click Generate image option
			await user.click( screen.getByRole( 'menuitemradio', { name: 'Generate image' } ) );

			expect( mockCustomHandler ).toHaveBeenCalled();
		} );

		it( 'should update media options when filter handler calls onImageSelect', () => {
			let capturedOnImageSelect:
				| ( ( image: { id: number; url: string; mime?: string } ) => void )
				| null = null;

			mockApplyFilters.mockImplementation(
				(
					filterName: string,
					defaultValue: unknown,
					args: { onImageSelect: ( image: { id: number; url: string; mime?: string } ) => void }
				) => {
					if ( filterName === 'jetpack.ai.imageGenerationHandler' ) {
						capturedOnImageSelect = args.onImageSelect;
					}
					return null;
				}
			);

			render( <MediaSectionV2 /> );

			// Simulate external handler calling onImageSelect
			if ( capturedOnImageSelect ) {
				capturedOnImageSelect( {
					id: 999,
					url: 'https://example.com/ai-generated.png',
					mime: 'image/png',
				} );
			}

			expect( mockUpdateJetpackSocialOptions ).toHaveBeenCalledWith( {
				media_source: 'media-library',
				attached_media: [
					{ id: 999, url: 'https://example.com/ai-generated.png', type: 'image/png' },
				],
				image_generator_settings: { enabled: false },
			} );
		} );

		it( 'should default to image/png mime type when not provided', () => {
			let capturedOnImageSelect:
				| ( ( image: { id: number; url: string; mime?: string } ) => void )
				| null = null;

			mockApplyFilters.mockImplementation(
				(
					filterName: string,
					defaultValue: unknown,
					args: { onImageSelect: ( image: { id: number; url: string; mime?: string } ) => void }
				) => {
					if ( filterName === 'jetpack.ai.imageGenerationHandler' ) {
						capturedOnImageSelect = args.onImageSelect;
					}
					return null;
				}
			);

			render( <MediaSectionV2 /> );

			// Simulate external handler calling onImageSelect without mime
			if ( capturedOnImageSelect ) {
				capturedOnImageSelect( {
					id: 888,
					url: 'https://example.com/no-mime.png',
				} );
			}

			expect( mockUpdateJetpackSocialOptions ).toHaveBeenCalledWith( {
				media_source: 'media-library',
				attached_media: [ { id: 888, url: 'https://example.com/no-mime.png', type: 'image/png' } ],
				image_generator_settings: { enabled: false },
			} );
		} );
	} );
} );
