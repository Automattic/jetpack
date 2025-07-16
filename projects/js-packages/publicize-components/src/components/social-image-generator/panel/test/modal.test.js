import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import useImageGeneratorConfig from '../../../../hooks/use-image-generator-config';
import useMediaDetails from '../../../../hooks/use-media-details';
import SocialImageGeneratorSettingsModal from '../modal';

// Mock dependencies
jest.mock( '@wordpress/data/build/components/use-select', () => jest.fn() );
jest.mock( '../../../../hooks/use-image-generator-config', () => jest.fn() );
jest.mock( '../../../../hooks/use-media-details', () => jest.fn() );
jest.mock( '../../../generated-image-preview', () => {
	return function MockGeneratedImagePreview() {
		return <div data-testid="generated-image-preview">Generated Preview</div>;
	};
} );
jest.mock( '../../../media-picker', () => {
	// eslint-disable-next-line jsdoc/require-jsdoc
	function mockOnChange( onChange ) {
		return function handleClick() {
			onChange( { id: 123 } );
		};
	}

	return function MockMediaPicker( { onChange, buttonLabel } ) {
		return (
			<div data-testid="media-picker">
				<button onClick={ mockOnChange( onChange ) }>{ buttonLabel }</button>
			</div>
		);
	};
} );
jest.mock( '../../template-picker/picker', () => {
	// eslint-disable-next-line jsdoc/require-jsdoc
	function mockOnTemplateSelected( onTemplateSelected ) {
		return function handleClick() {
			onTemplateSelected( 'new-template' );
		};
	}

	return function MockTemplatePicker( { onTemplateSelected } ) {
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
	preview: 'preview',
	mediaPicker: 'mediaPicker',
	customText: 'customText',
	templateControl: 'templateControl',
	footer: 'footer',
} ) );

const mockUpdateSettings = jest.fn();
const mockOnClose = jest.fn();

const defaultMockConfig = {
	customText: '',
	imageType: 'featured',
	imageId: 0,
	featuredImageId: 456,
	defaultImageId: 0,
	template: 'default-template',
	updateSettings: mockUpdateSettings,
};

const setupMocks = ( config = {} ) => {
	useImageGeneratorConfig.mockReturnValue( {
		...defaultMockConfig,
		...config,
	} );

	useMediaDetails.mockReturnValue( [ { id: 123, url: 'https://example.com/image.jpg' } ] );

	useSelect.mockImplementation( () => ( {
		title: 'Test Post Title',
	} ) );
};

describe( 'SocialImageGeneratorSettingsModal', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		setupMocks();
	} );

	it( 'should render the modal with all components', () => {
		render( <SocialImageGeneratorSettingsModal onClose={ mockOnClose } /> );

		expect( screen.getByTestId( 'generated-image-preview' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Image Type' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Custom Header' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Templates' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'template-picker' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Cancel' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Save' ) ).toBeInTheDocument();
	} );

	describe( 'Image Type Selection', () => {
		it( 'should show Default Image option when defaultImageId is provided', () => {
			setupMocks( { defaultImageId: 789 } );
			render( <SocialImageGeneratorSettingsModal onClose={ mockOnClose } /> );

			const imageTypeSelect = screen.getByDisplayValue( 'Featured Image' );
			expect( imageTypeSelect ).toBeInTheDocument();

			// Check that the Default Image option exists
			const options = screen.getAllByRole( 'option' );
			const optionLabels = options.map( option => option.textContent );
			expect( optionLabels ).toContain( 'Default Image' );
		} );

		it( 'should not show Default Image option when defaultImageId is 0', () => {
			setupMocks( { defaultImageId: 0 } );
			render( <SocialImageGeneratorSettingsModal onClose={ mockOnClose } /> );

			const options = screen.getAllByRole( 'option' );
			const optionLabels = options.map( option => option.textContent );
			expect( optionLabels ).not.toContain( 'Default Image' );
		} );

		it( 'should show MediaPicker when custom image type is selected', () => {
			setupMocks( { imageType: 'custom' } );
			render( <SocialImageGeneratorSettingsModal onClose={ mockOnClose } /> );

			expect( screen.getByTestId( 'media-picker' ) ).toBeInTheDocument();
		} );

		it( 'should not show MediaPicker when image type is not custom', () => {
			setupMocks( { imageType: 'featured' } );
			render( <SocialImageGeneratorSettingsModal onClose={ mockOnClose } /> );

			expect( screen.queryByTestId( 'media-picker' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'Local Image Type Logic', () => {
		it( 'should default to "default" when no featured image but default image exists', () => {
			setupMocks( {
				imageType: null,
				featuredImageId: 0,
				defaultImageId: 789,
			} );
			render( <SocialImageGeneratorSettingsModal onClose={ mockOnClose } /> );

			const imageTypeSelect = screen.getByDisplayValue( 'Default Image' );
			expect( imageTypeSelect ).toBeInTheDocument();
		} );

		it( 'should default to "featured" when featured image exists', () => {
			setupMocks( {
				imageType: null,
				featuredImageId: 456,
				defaultImageId: 789,
			} );
			render( <SocialImageGeneratorSettingsModal onClose={ mockOnClose } /> );

			const imageTypeSelect = screen.getByDisplayValue( 'Featured Image' );
			expect( imageTypeSelect ).toBeInTheDocument();
		} );

		it( 'should default to "featured" when no images exist', () => {
			setupMocks( {
				imageType: null,
				featuredImageId: 0,
				defaultImageId: 0,
			} );
			render( <SocialImageGeneratorSettingsModal onClose={ mockOnClose } /> );

			const imageTypeSelect = screen.getByDisplayValue( 'Featured Image' );
			expect( imageTypeSelect ).toBeInTheDocument();
		} );
	} );

	describe( 'Save Functionality', () => {
		it( 'should save settings with custom image when custom type is selected', async () => {
			const user = userEvent.setup();
			setupMocks( { imageType: 'custom', imageId: 123 } );
			render( <SocialImageGeneratorSettingsModal onClose={ mockOnClose } /> );

			const saveButton = screen.getByText( 'Save' );
			await user.click( saveButton );

			await waitFor( () => {
				expect( mockUpdateSettings ).toHaveBeenCalledWith( {
					template: 'default-template',
					image_type: 'custom',
					custom_text: '',
					image_id: 123,
				} );
			} );

			expect( mockOnClose ).toHaveBeenCalled();
		} );

		it( 'should save settings without image_id when type is not custom', async () => {
			const user = userEvent.setup();
			setupMocks( { imageType: 'featured', imageId: 123 } );
			render( <SocialImageGeneratorSettingsModal onClose={ mockOnClose } /> );

			const saveButton = screen.getByText( 'Save' );
			await user.click( saveButton );

			await waitFor( () => {
				expect( mockUpdateSettings ).toHaveBeenCalledWith( {
					template: 'default-template',
					image_type: 'featured',
					custom_text: '',
				} );
			} );

			expect( mockOnClose ).toHaveBeenCalled();
		} );

		it( 'should save custom text when provided', async () => {
			const user = userEvent.setup();
			render( <SocialImageGeneratorSettingsModal onClose={ mockOnClose } /> );

			const customTextInput = screen.getByLabelText( 'Custom Header' );
			await user.clear( customTextInput );
			await user.type( customTextInput, 'My Custom Text' );

			const saveButton = screen.getByText( 'Save' );
			await user.click( saveButton );

			await waitFor( () => {
				expect( mockUpdateSettings ).toHaveBeenCalledWith( {
					template: 'default-template',
					image_type: 'featured',
					custom_text: 'My Custom Text',
				} );
			} );
		} );
	} );
} );
