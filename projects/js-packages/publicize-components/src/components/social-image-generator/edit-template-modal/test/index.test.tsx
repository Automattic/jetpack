import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useFeaturedImage from '../../../../hooks/use-featured-image';
import useImageGeneratorConfig from '../../../../hooks/use-image-generator-config';
import useMediaDetails from '../../../../hooks/use-media-details';
import useSigPreview from '../../../../hooks/use-sig-preview';
import * as fontOptions from '../../../../hooks/use-social-image-font-options';
import EditTemplateModal from '../index';

// Mock dependencies
jest.mock( '../../../../hooks/use-featured-image', () => jest.fn() );
jest.mock( '../../../../hooks/use-image-generator-config', () => jest.fn() );
jest.mock( '../../../../hooks/use-media-details', () => jest.fn() );
jest.mock( '../../../../hooks/use-sig-preview', () => jest.fn() );
jest.spyOn( fontOptions, 'useSocialImageFontOptions' ).mockImplementation();

// Mock TemplatePicker
jest.mock( '../../template-picker/picker', () => {
	// eslint-disable-next-line jsdoc/require-jsdoc
	function mockOnTemplateSelected( onTemplateSelected: ( template: string ) => void ) {
		return function handleClick() {
			onTemplateSelected( 'new-template' );
		};
	}

	return function MockTemplatePicker( {
		onTemplateSelected,
	}: {
		onTemplateSelected: ( template: string ) => void;
	} ) {
		return (
			<div data-testid="template-picker">
				<button onClick={ mockOnTemplateSelected( onTemplateSelected ) }>Pick Template</button>
			</div>
		);
	};
} );

// Mock styles
jest.mock( '../styles.module.scss', () => ( {
	modal: 'modal',
	layout: 'layout',
	sidebar: 'sidebar',
	section: 'section',
	sectionLabel: 'sectionLabel',
	content: 'content',
	preview: 'preview',
	previewImage: 'previewImage',
	footer: 'footer',
	backgroundPicker: 'backgroundPicker',
	sourceLabel: 'sourceLabel',
	selectDropdown: 'selectDropdown',
	selectButton: 'selectButton',
	notice: 'notice',
	templateGrid: 'templateGrid',
} ) );

const mockUpdateSettings = jest.fn();
const mockOnClose = jest.fn();

const defaultMockConfig = {
	customText: '',
	imageType: 'featured',
	imageId: null,
	featuredImageId: 456,
	defaultImageId: null,
	template: 'highway',
	font: '',
	updateSettings: mockUpdateSettings,
};

const setupMocks = ( config = {} ) => {
	( useImageGeneratorConfig as jest.Mock ).mockReturnValue( {
		...defaultMockConfig,
		...config,
	} );

	( useFeaturedImage as jest.Mock ).mockReturnValue( 456 );

	( useMediaDetails as jest.Mock ).mockReturnValue( [
		{
			mediaData: {
				sourceUrl: 'https://example.com/image.jpg',
			},
		},
	] );

	( useSigPreview as jest.Mock ).mockReturnValue( {
		url: 'https://example.com/generated-preview.jpg',
		isLoading: false,
	} );

	fontOptions.useSocialImageFontOptions.mockReturnValue( {
		isLoading: false,
		fontOptions: [
			{ label: 'Default', value: '' },
			{ label: 'Font 1', value: 'font-1' },
			{ label: 'Font 2', value: 'font-2' },
		],
	} );
};

describe( 'EditTemplateModal', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		setupMocks();
	} );

	it( 'should render the modal with all sections', () => {
		render( <EditTemplateModal onClose={ mockOnClose } /> );

		// Check modal title
		expect( screen.getByText( 'Edit social template' ) ).toBeInTheDocument();

		// Check sections
		expect( screen.getByText( 'Background image' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Template' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Text' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Font' ) ).toBeInTheDocument();

		// Check preview image is rendered (useSigPreview mock returns url and isLoading: false)
		expect( screen.getByAltText( 'Generated preview' ) ).toBeInTheDocument();

		// Check buttons
		expect( screen.getByText( 'Cancel' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Save changes' ) ).toBeInTheDocument();
	} );

	it( 'should render template picker', () => {
		render( <EditTemplateModal onClose={ mockOnClose } /> );

		expect( screen.getByTestId( 'template-picker' ) ).toBeInTheDocument();
	} );

	describe( 'Cancel button', () => {
		it( 'should close modal without saving when Cancel is clicked', async () => {
			const user = userEvent.setup();
			render( <EditTemplateModal onClose={ mockOnClose } /> );

			const cancelButton = screen.getByText( 'Cancel' );
			await user.click( cancelButton );

			expect( mockOnClose ).toHaveBeenCalled();
			expect( mockUpdateSettings ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Save functionality', () => {
		it( 'should save settings and close modal when Save is clicked', async () => {
			const user = userEvent.setup();
			render( <EditTemplateModal onClose={ mockOnClose } /> );

			const saveButton = screen.getByText( 'Save changes' );
			await user.click( saveButton );

			await waitFor( () => {
				expect( mockUpdateSettings ).toHaveBeenCalledWith( {
					template: 'highway',
					font: '',
					image_type: 'featured',
					custom_text: '',
				} );
			} );

			expect( mockOnClose ).toHaveBeenCalled();
		} );

		it( 'should include image_id when image type is custom', async () => {
			const user = userEvent.setup();
			setupMocks( { imageType: 'custom', imageId: 123 } );
			render( <EditTemplateModal onClose={ mockOnClose } /> );

			const saveButton = screen.getByText( 'Save changes' );
			await user.click( saveButton );

			await waitFor( () => {
				expect( mockUpdateSettings ).toHaveBeenCalledWith(
					expect.objectContaining( {
						image_type: 'custom',
						image_id: 123,
					} )
				);
			} );
		} );

		it( 'should save custom text when provided', async () => {
			const user = userEvent.setup();
			render( <EditTemplateModal onClose={ mockOnClose } /> );

			// Find the text input by placeholder
			const textInput = screen.getByPlaceholderText( 'Custom text' );
			await user.type( textInput, 'My Custom Text' );

			const saveButton = screen.getByText( 'Save changes' );
			await user.click( saveButton );

			await waitFor( () => {
				expect( mockUpdateSettings ).toHaveBeenCalledWith(
					expect.objectContaining( {
						custom_text: 'My Custom Text',
					} )
				);
			} );
		} );
	} );

	describe( 'Background image picker', () => {
		it( 'should show current image source label', () => {
			render( <EditTemplateModal onClose={ mockOnClose } /> );

			expect( screen.getByText( 'You are using your post featured image' ) ).toBeInTheDocument();
		} );

		it( 'should show Replace and Remove buttons for image preview', () => {
			render( <EditTemplateModal onClose={ mockOnClose } /> );

			expect( screen.getByText( 'Replace' ) ).toBeInTheDocument();
			expect( screen.getByText( 'Remove' ) ).toBeInTheDocument();
		} );

		it( 'should show image options when Replace button is clicked', async () => {
			const user = userEvent.setup();
			render( <EditTemplateModal onClose={ mockOnClose } /> );

			const replaceButton = screen.getByText( 'Replace' );
			await user.click( replaceButton );

			// Check menu options appear (no "No Image" - Remove button handles that)
			await waitFor( () => {
				expect( screen.getByText( 'Featured Image' ) ).toBeInTheDocument();
				expect( screen.getByText( 'Media Library' ) ).toBeInTheDocument();
			} );
		} );

		it( 'should show Default Image option when defaultImageId is provided', async () => {
			const user = userEvent.setup();
			setupMocks( { defaultImageId: 789 } );
			render( <EditTemplateModal onClose={ mockOnClose } /> );

			const replaceButton = screen.getByText( 'Replace' );
			await user.click( replaceButton );

			await waitFor( () => {
				expect( screen.getByText( 'Default Image' ) ).toBeInTheDocument();
			} );
		} );

		it( 'should show warning notice when featured image is not set', () => {
			( useFeaturedImage as jest.Mock ).mockReturnValue( null );
			( useMediaDetails as jest.Mock ).mockReturnValue( [ {} ] );
			render( <EditTemplateModal onClose={ mockOnClose } /> );

			// Notice text appears twice: once in a11y announcement and once in visible notice
			const notices = screen.getAllByText( 'Your post does not have a featured image.' );
			expect( notices.length ).toBeGreaterThanOrEqual( 1 );
		} );
	} );

	describe( 'Font selection', () => {
		it( 'should show font section label', () => {
			render( <EditTemplateModal onClose={ mockOnClose } /> );

			// Check font section label is visible
			expect( screen.getByText( 'Font' ) ).toBeInTheDocument();
		} );

		it( 'should save with default font value', async () => {
			const user = userEvent.setup();
			render( <EditTemplateModal onClose={ mockOnClose } /> );

			const saveButton = screen.getByText( 'Save changes' );
			await user.click( saveButton );

			await waitFor( () => {
				expect( mockUpdateSettings ).toHaveBeenCalledWith(
					expect.objectContaining( {
						font: '',
					} )
				);
			} );
		} );
	} );
} );
