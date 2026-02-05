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

jest.mock( '@automattic/jetpack-ai-client', () => ( {
	GeneralPurposeImage: () => null,
	AiSVG: 'svg',
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
			( useMediaDetails as jest.Mock ).mockReturnValue( [ null ] );
		} );

		afterEach( () => {
			( useFeaturedImage as jest.Mock ).mockReturnValue( 123 );
			( useMediaDetails as jest.Mock ).mockReturnValue( [
				{
					mediaData: { sourceUrl: 'https://example.com/featured.jpg' },
					metaData: { mime: 'image/jpeg' },
				},
			] );
		} );

		it( 'should show "no image" description when no media source is selected', () => {
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
			await user.click( screen.getByRole( 'button', { name: 'Replace' } ) );

			// Select SIG
			await user.click( screen.getByRole( 'menuitem', { name: 'Use template' } ) );

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
			await user.click( screen.getByRole( 'button', { name: 'Replace' } ) );

			// Select Use featured image
			await user.click( screen.getByRole( 'menuitem', { name: 'Use featured image' } ) );

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
			await user.click( screen.getByRole( 'button', { name: 'Replace' } ) );

			// Select SIG
			await user.click( screen.getByRole( 'menuitem', { name: 'Use template' } ) );

			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_social_media_source_changed', {
				test: 'data',
				source: 'sig',
			} );
		} );
	} );

	describe( 'Remove media', () => {
		beforeEach( () => {
			// Set up explicit media selection to show Remove button
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

		it( 'should clear media and record event when Remove is clicked', async () => {
			const user = userEvent.setup();

			render( <MediaSectionV2 analyticsData={ { test: 'data' } } /> );

			await user.click( screen.getByRole( 'button', { name: 'Remove' } ) );

			expect( mockUpdateJetpackSocialOptions ).toHaveBeenCalledWith( {
				media_source: undefined,
				attached_media: [],
				image_generator_settings: { enabled: false },
			} );
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_social_media_removed', {
				test: 'data',
				source: 'media-library',
			} );
		} );

		it( 'should not show Remove button for featured image fallback', () => {
			// Reset to featured image fallback state
			( usePostMeta as jest.Mock ).mockReturnValue( {
				attachedMedia: [],
				imageGeneratorSettings: { enabled: false },
				mediaSource: undefined,
				updateJetpackSocialOptions: mockUpdateJetpackSocialOptions,
			} );

			render( <MediaSectionV2 /> );

			// Featured image preview should be shown
			expect( screen.getByRole( 'img' ) ).toBeInTheDocument();
			// But Remove button should not be shown
			expect( screen.queryByRole( 'button', { name: 'Remove' } ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Disabled state', () => {
		beforeEach( () => {
			// Set up explicit media selection to show Remove button
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

		it( 'should disable buttons when disabled prop is true', () => {
			render( <MediaSectionV2 disabled={ true } /> );

			expect( screen.getByRole( 'button', { name: 'Replace' } ) ).toBeDisabled();
			expect( screen.getByRole( 'button', { name: 'Remove' } ) ).toBeDisabled();
		} );
	} );
} );
