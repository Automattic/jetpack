import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import useMediaDetails from '../../../../hooks/use-media-details';
import * as fontOptions from '../../../../hooks/use-social-image-font-options';
import { Sidebar } from '../sidebar';
import { LocalState } from '../types';

// Mock dependencies
jest.mock( '../../../../hooks/use-media-details', () => jest.fn() );
jest.spyOn( fontOptions, 'useSocialImageFontOptions' ).mockImplementation();

// Mock TemplatePicker
jest.mock( '../../../social-image-generator/template-picker/picker', () => {
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
	sidebar: 'sidebar',
	section: 'section',
	sectionLabel: 'sectionLabel',
	backgroundPicker: 'backgroundPicker',
	sourceLabel: 'sourceLabel',
	selectDropdown: 'selectDropdown',
	selectButton: 'selectButton',
	notice: 'notice',
	templateGrid: 'templateGrid',
} ) );

const mockSetLocalState = jest.fn();

const defaultLocalState: LocalState = {
	imageId: null,
	imageType: 'featured',
	customText: '',
	template: 'highway',
	font: '',
};

const setupMocks = () => {
	( useMediaDetails as jest.Mock ).mockReturnValue( [
		{
			mediaData: {
				sourceUrl: 'https://example.com/image.jpg',
			},
		},
		false,
	] );

	( fontOptions.useSocialImageFontOptions as jest.Mock ).mockReturnValue( {
		isLoading: false,
		fontOptions: [
			{ label: 'Default', value: '' },
			{ label: 'Font 1', value: 'font-1' },
			{ label: 'Font 2', value: 'font-2' },
		],
	} );
};

describe( 'Sidebar', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		setupMocks();
	} );

	it( 'should render all sections', () => {
		render(
			<Sidebar
				localState={ defaultLocalState }
				setLocalState={ mockSetLocalState }
				defaultImageId={ null }
				featuredImageId={ 456 }
			/>
		);

		// Check sections
		expect( screen.getByText( 'Background image' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Template' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Text' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Font' ) ).toBeInTheDocument();
	} );

	it( 'should render template picker', () => {
		render(
			<Sidebar
				localState={ defaultLocalState }
				setLocalState={ mockSetLocalState }
				defaultImageId={ null }
				featuredImageId={ 456 }
			/>
		);

		expect( screen.getByTestId( 'template-picker' ) ).toBeInTheDocument();
	} );

	it( 'should render custom text input', () => {
		render(
			<Sidebar
				localState={ defaultLocalState }
				setLocalState={ mockSetLocalState }
				defaultImageId={ null }
				featuredImageId={ 456 }
			/>
		);

		expect( screen.getByPlaceholderText( 'Custom text' ) ).toBeInTheDocument();
	} );

	describe( 'Background image picker', () => {
		it( 'should show current image source label', () => {
			render(
				<Sidebar
					localState={ defaultLocalState }
					setLocalState={ mockSetLocalState }
					defaultImageId={ null }
					featuredImageId={ 456 }
				/>
			);

			expect( screen.getByText( 'You are using your post featured image' ) ).toBeInTheDocument();
		} );

		it( 'should show Select image button for image preview', () => {
			render(
				<Sidebar
					localState={ defaultLocalState }
					setLocalState={ mockSetLocalState }
					defaultImageId={ null }
					featuredImageId={ 456 }
				/>
			);

			expect( screen.getByRole( 'img', { name: 'Media preview' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'Select image' } ) ).toBeInTheDocument();
		} );

		it( 'should show image options when Select image button is clicked', async () => {
			const user = userEvent.setup();
			render(
				<Sidebar
					localState={ defaultLocalState }
					setLocalState={ mockSetLocalState }
					defaultImageId={ null }
					featuredImageId={ 456 }
				/>
			);

			await user.click( screen.getByRole( 'button', { name: 'Select image' } ) );

			await waitFor( () => {
				expect( screen.getByText( 'Featured Image' ) ).toBeInTheDocument();
				expect( screen.getByText( 'Media Library' ) ).toBeInTheDocument();
			} );
		} );

		it( 'should show Default Image option when defaultImageId is provided', async () => {
			const user = userEvent.setup();
			render(
				<Sidebar
					localState={ defaultLocalState }
					setLocalState={ mockSetLocalState }
					defaultImageId={ 789 }
					featuredImageId={ 456 }
				/>
			);

			await user.click( screen.getByRole( 'button', { name: 'Select image' } ) );

			await waitFor( () => {
				expect( screen.getByText( 'Default Image' ) ).toBeInTheDocument();
			} );
		} );

		it( 'should clear local image state when No image option is selected', async () => {
			const user = userEvent.setup();
			render(
				<Sidebar
					localState={ defaultLocalState }
					setLocalState={ mockSetLocalState }
					defaultImageId={ null }
					featuredImageId={ 456 }
				/>
			);

			await user.click( screen.getByRole( 'button', { name: 'Select image' } ) );
			await user.click( screen.getByRole( 'menuitem', { name: 'No image' } ) );

			await waitFor( () => {
				expect( mockSetLocalState ).toHaveBeenCalled();
				const updaterFunctions = mockSetLocalState.mock.calls.map( call => call[ 0 ] );
				const updatedStates = updaterFunctions.map( updater => updater( defaultLocalState ) );

				expect( updatedStates ).toEqual(
					expect.arrayContaining( [
						expect.objectContaining( { imageType: 'none' } ),
						expect.objectContaining( { imageId: null } ),
					] )
				);
			} );
		} );

		it( 'should switch imageType from default to none when default image is deleted', async () => {
			( useMediaDetails as jest.Mock ).mockReturnValue( [ {}, true ] );
			render(
				<Sidebar
					localState={ { ...defaultLocalState, imageType: 'default' } }
					setLocalState={ mockSetLocalState }
					defaultImageId={ 789 }
					featuredImageId={ 456 }
				/>
			);

			await waitFor( () => {
				expect( mockSetLocalState ).toHaveBeenCalled();
				const updater = mockSetLocalState.mock.calls[ 0 ][ 0 ];
				const newState = updater( { ...defaultLocalState, imageType: 'default' } );
				expect( newState ).toEqual( expect.objectContaining( { imageType: 'none' } ) );
			} );
		} );

		it( 'should hide Default Image option when default image does not exist', async () => {
			const user = userEvent.setup();
			// useMediaDetails returns isNotFound=true for the deleted default image
			( useMediaDetails as jest.Mock ).mockReturnValue( [ {}, true ] );
			render(
				<Sidebar
					localState={ { ...defaultLocalState, imageType: 'featured' } }
					setLocalState={ mockSetLocalState }
					defaultImageId={ 789 }
					featuredImageId={ 456 }
				/>
			);

			// Need to click Select image since there's no preview (media not found)
			const selectButton = screen.getByText( 'Select image' );
			await user.click( selectButton );

			await waitFor( () => {
				expect( screen.getByText( 'Featured Image' ) ).toBeInTheDocument();
				expect( screen.getByText( 'Media Library' ) ).toBeInTheDocument();
				expect( screen.queryByText( 'Default Image' ) ).not.toBeInTheDocument();
			} );
		} );

		it( 'should show warning notice when featured image is not set', () => {
			( useMediaDetails as jest.Mock ).mockReturnValue( [ {}, false ] );
			render(
				<Sidebar
					localState={ defaultLocalState }
					setLocalState={ mockSetLocalState }
					defaultImageId={ null }
					featuredImageId={ null }
				/>
			);

			const notices = screen.getAllByText( 'Your post does not have a featured image.' );
			expect( notices.length ).toBeGreaterThanOrEqual( 1 );
		} );
	} );

	describe( 'Custom text input', () => {
		it( 'should call setLocalState when custom text is changed', async () => {
			const user = userEvent.setup();
			render(
				<Sidebar
					localState={ defaultLocalState }
					setLocalState={ mockSetLocalState }
					defaultImageId={ null }
					featuredImageId={ 456 }
				/>
			);

			const textInput = screen.getByPlaceholderText( 'Custom text' );
			await user.type( textInput, 'M' );

			await waitFor( () => {
				expect( mockSetLocalState ).toHaveBeenCalled();
				// Get the updater function and call it with previous state
				const updater = mockSetLocalState.mock.calls[ 0 ][ 0 ];
				const newState = updater( defaultLocalState );
				expect( newState ).toEqual(
					expect.objectContaining( {
						customText: 'M',
					} )
				);
			} );
		} );
	} );

	describe( 'Template picker', () => {
		it( 'should call setLocalState when template is selected', async () => {
			const user = userEvent.setup();
			render(
				<Sidebar
					localState={ defaultLocalState }
					setLocalState={ mockSetLocalState }
					defaultImageId={ null }
					featuredImageId={ 456 }
				/>
			);

			const pickButton = screen.getByText( 'Pick Template' );
			await user.click( pickButton );

			await waitFor( () => {
				expect( mockSetLocalState ).toHaveBeenCalled();
				// Get the updater function and call it with previous state
				const updater = mockSetLocalState.mock.calls[ 0 ][ 0 ];
				const newState = updater( defaultLocalState );
				expect( newState ).toEqual(
					expect.objectContaining( {
						template: 'new-template',
					} )
				);
			} );
		} );
	} );

	describe( 'Font selection', () => {
		it( 'should render font select control', () => {
			render(
				<Sidebar
					localState={ defaultLocalState }
					setLocalState={ mockSetLocalState }
					defaultImageId={ null }
					featuredImageId={ 456 }
				/>
			);

			// Check for a combobox element (the font dropdown)
			const fontSelect = screen.getByRole( 'combobox' );
			expect( fontSelect ).toBeInTheDocument();
		} );
	} );
} );
