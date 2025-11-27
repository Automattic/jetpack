import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import NewMediaSection from '..';
import useAttachedMedia from '../../../hooks/use-attached-media';
import useFeaturedImage from '../../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../../hooks/use-image-generator-config';
import useMediaDetails from '../../../hooks/use-media-details';
import useSigPreview from '../../../hooks/use-sig-preview';

// Mock functions
const mockUpdateAttachedMedia = jest.fn();
const mockSetSigEnabled = jest.fn();
const mockUpdateJetpackSocialOptions = jest.fn();
const mockRecordEvent = jest.fn();

jest.mock( '../../../hooks/use-attached-media', () => {
	return jest.fn( () => ( {
		attachedMedia: [],
		updateAttachedMedia: mockUpdateAttachedMedia,
	} ) );
} );

jest.mock( '../../../hooks/use-featured-image', () => {
	return jest.fn( () => 123 );
} );

jest.mock( '../../../hooks/use-image-generator-config', () => {
	return jest.fn( () => ( {
		isEnabled: false,
		setIsEnabled: mockSetSigEnabled,
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
		imageGeneratorSettings: { enabled: false },
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

describe( 'NewMediaSection', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	describe( 'Initial rendering', () => {
		it( 'should render the Media label', () => {
			render( <NewMediaSection /> );

			expect( screen.getByText( 'Media' ) ).toBeInTheDocument();
		} );

		it( 'should show featured image description when featured image is detected', () => {
			render( <NewMediaSection /> );

			expect( screen.getByText( 'You are using your post featured image' ) ).toBeInTheDocument();
		} );

		it( 'should show featured image preview', () => {
			render( <NewMediaSection /> );

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
			render( <NewMediaSection /> );

			expect( screen.getByText( "Your post won't show an image." ) ).toBeInTheDocument();
		} );

		it( 'should show Select button when no media', () => {
			render( <NewMediaSection /> );

			expect( screen.getByRole( 'button', { name: 'Select' } ) ).toBeInTheDocument();
		} );
	} );

	describe( 'Attached media state', () => {
		beforeEach( () => {
			( useAttachedMedia as jest.Mock ).mockReturnValue( {
				attachedMedia: [ { id: 789, url: 'https://example.com/attached.jpg', type: 'image/jpeg' } ],
				updateAttachedMedia: mockUpdateAttachedMedia,
			} );
			( useMediaDetails as jest.Mock ).mockReturnValue( [
				{
					mediaData: { sourceUrl: 'https://example.com/attached.jpg' },
					metaData: { mime: 'image/jpeg' },
				},
			] );
		} );

		afterEach( () => {
			( useAttachedMedia as jest.Mock ).mockReturnValue( {
				attachedMedia: [],
				updateAttachedMedia: mockUpdateAttachedMedia,
			} );
		} );

		it( 'should show custom image description when attached media exists', () => {
			render( <NewMediaSection /> );

			expect( screen.getByText( 'You are using a custom image.' ) ).toBeInTheDocument();
		} );
	} );

	describe( 'SIG enabled state', () => {
		beforeEach( () => {
			( useImageGeneratorConfig as jest.Mock ).mockReturnValue( {
				isEnabled: true,
				setIsEnabled: mockSetSigEnabled,
			} );
		} );

		afterEach( () => {
			( useImageGeneratorConfig as jest.Mock ).mockReturnValue( {
				isEnabled: false,
				setIsEnabled: mockSetSigEnabled,
			} );
		} );

		it( 'should show SIG description when SIG is enabled', () => {
			render( <NewMediaSection /> );

			expect( screen.getByText( 'You are using the template' ) ).toBeInTheDocument();
		} );

		it( 'should show SIG preview image', () => {
			render( <NewMediaSection /> );

			const img = screen.getByRole( 'img' );
			expect( img ).toHaveAttribute( 'src', 'https://example.com/sig-preview.jpg' );
		} );

		it( 'should not show SIG preview image when loading', () => {
			( useSigPreview as jest.Mock ).mockReturnValue( {
				url: '',
				isLoading: true,
			} );

			render( <NewMediaSection /> );

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

			render( <NewMediaSection /> );

			// Open dropdown
			await user.click( screen.getByRole( 'button', { name: 'Replace' } ) );

			// Select SIG
			await user.click( screen.getByRole( 'menuitem', { name: 'Social Image Template' } ) );

			expect( mockUpdateJetpackSocialOptions ).toHaveBeenCalledWith( {
				attached_media: [],
				image_generator_settings: { enabled: true },
			} );
		} );

		it( 'should call updateJetpackSocialOptions when selecting Featured Image', async () => {
			const user = userEvent.setup();

			// Start with SIG enabled
			( useImageGeneratorConfig as jest.Mock ).mockReturnValue( {
				isEnabled: true,
				setIsEnabled: mockSetSigEnabled,
			} );

			render( <NewMediaSection /> );

			// Open dropdown
			await user.click( screen.getByRole( 'button', { name: 'Replace' } ) );

			// Select Featured Image
			await user.click( screen.getByRole( 'menuitem', { name: 'Featured Image' } ) );

			expect( mockUpdateJetpackSocialOptions ).toHaveBeenCalledWith( {
				attached_media: [],
				image_generator_settings: { enabled: false },
			} );

			// Reset
			( useImageGeneratorConfig as jest.Mock ).mockReturnValue( {
				isEnabled: false,
				setIsEnabled: mockSetSigEnabled,
			} );
		} );

		it( 'should record analytics event when source is changed', async () => {
			const user = userEvent.setup();

			render( <NewMediaSection analyticsData={ { test: 'data' } } /> );

			// Open dropdown
			await user.click( screen.getByRole( 'button', { name: 'Replace' } ) );

			// Select SIG
			await user.click( screen.getByRole( 'menuitem', { name: 'Social Image Template' } ) );

			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_social_media_source_changed', {
				test: 'data',
				source: 'sig',
			} );
		} );
	} );

	describe( 'Remove media', () => {
		it( 'should clear media and record event when Remove is clicked', async () => {
			const user = userEvent.setup();

			render( <NewMediaSection analyticsData={ { test: 'data' } } /> );

			await user.click( screen.getByRole( 'button', { name: 'Remove' } ) );

			expect( mockUpdateAttachedMedia ).toHaveBeenCalledWith( [] );
			expect( mockSetSigEnabled ).toHaveBeenCalledWith( false );
			expect( mockRecordEvent ).toHaveBeenCalledWith( 'jetpack_social_media_removed', {
				test: 'data',
				source: 'featured-image',
			} );
		} );
	} );

	describe( 'Disabled state', () => {
		it( 'should disable buttons when disabled prop is true', () => {
			render( <NewMediaSection disabled={ true } /> );

			expect( screen.getByRole( 'button', { name: 'Replace' } ) ).toBeDisabled();
			expect( screen.getByRole( 'button', { name: 'Remove' } ) ).toBeDisabled();
		} );
	} );
} );
