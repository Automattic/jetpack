import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MediaSourceMenu from '../media-source-menu';
import { getMediaSourceDescription } from '../utils/media-source-options';

describe( 'getMediaSourceDescription', () => {
	it( 'should return default message when sourceType is null', () => {
		expect( getMediaSourceDescription( null ) ).toBe( "Your post won't show an image." );
	} );

	it( 'should return featured image description', () => {
		expect( getMediaSourceDescription( 'featured-image' ) ).toBe(
			'You are using your post featured image.'
		);
	} );

	it( 'should return SIG description', () => {
		expect( getMediaSourceDescription( 'sig' ) ).toBe( 'You are using the template.' );
	} );

	it( 'should return media library description', () => {
		expect( getMediaSourceDescription( 'media-library' ) ).toBe( 'You are using a custom image.' );
	} );

	it( 'should return upload video description', () => {
		expect( getMediaSourceDescription( 'upload-video' ) ).toBe( 'Upload a video file.' );
	} );
} );

describe( 'MediaSourceMenu', () => {
	const mockOnSelect = jest.fn();
	const mockOnMediaLibraryClick = jest.fn();

	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should render Select button when no children provided', () => {
		render(
			<MediaSourceMenu
				currentSource={ null }
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
			/>
		);

		expect( screen.getByRole( 'button', { name: 'Select' } ) ).toBeInTheDocument();
	} );

	it( 'should disable Select button when disabled prop is true', () => {
		render(
			<MediaSourceMenu
				currentSource={ null }
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
				disabled={ true }
			/>
		);

		expect( screen.getByRole( 'button', { name: 'Select' } ) ).toBeDisabled();
	} );

	it( 'should open dropdown menu when Select button is clicked', async () => {
		const user = userEvent.setup();

		render(
			<MediaSourceMenu
				currentSource={ null }
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

		// Check that menu groups are rendered
		expect( screen.getByText( 'Link Preview' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Attachment' ) ).toBeInTheDocument();

		// Check that menu items are rendered
		expect( screen.getByRole( 'menuitem', { name: 'Featured Image' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'menuitem', { name: 'Social Image Template' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'menuitem', { name: 'Media Library' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'menuitem', { name: 'Upload video' } ) ).toBeInTheDocument();
	} );

	it( 'should call onSelect when Featured Image is clicked', async () => {
		const user = userEvent.setup();

		render(
			<MediaSourceMenu
				currentSource={ null }
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );
		await user.click( screen.getByRole( 'menuitem', { name: 'Featured Image' } ) );

		expect( mockOnSelect ).toHaveBeenCalledWith( 'featured-image' );
	} );

	it( 'should call onSelect when Social Image Template is clicked', async () => {
		const user = userEvent.setup();

		render(
			<MediaSourceMenu
				currentSource={ null }
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );
		await user.click( screen.getByRole( 'menuitem', { name: 'Social Image Template' } ) );

		expect( mockOnSelect ).toHaveBeenCalledWith( 'sig' );
	} );

	it( 'should call onMediaLibraryClick when Media Library is clicked', async () => {
		const user = userEvent.setup();

		render(
			<MediaSourceMenu
				currentSource={ null }
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );
		await user.click( screen.getByRole( 'menuitem', { name: 'Media Library' } ) );

		expect( mockOnMediaLibraryClick ).toHaveBeenCalledTimes( 1 );
		expect( mockOnSelect ).not.toHaveBeenCalled();
	} );

	it( 'should render children with open function when provided', async () => {
		const user = userEvent.setup();
		const mockChildren = jest.fn( ( { open } ) => (
			<button onClick={ open }>Custom Trigger</button>
		) );

		render(
			<MediaSourceMenu
				currentSource={ null }
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
			>
				{ mockChildren }
			</MediaSourceMenu>
		);

		// Select button should not be rendered
		expect( screen.queryByRole( 'button', { name: 'Select' } ) ).not.toBeInTheDocument();

		// Custom trigger should be rendered
		expect( screen.getByRole( 'button', { name: 'Custom Trigger' } ) ).toBeInTheDocument();

		// Children should receive open function
		expect( mockChildren ).toHaveBeenCalledWith(
			expect.objectContaining( { open: expect.any( Function ) } )
		);

		// Clicking custom trigger should open dropdown
		await user.click( screen.getByRole( 'button', { name: 'Custom Trigger' } ) );
		expect( screen.getByText( 'Link Preview' ) ).toBeInTheDocument();
	} );

	it( 'should render menu with current source item', async () => {
		const user = userEvent.setup();

		render(
			<MediaSourceMenu
				currentSource="featured-image"
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

		// Verify the menu renders with all options including the current source
		const featuredImageItem = screen.getByRole( 'menuitem', { name: 'Featured Image' } );
		expect( featuredImageItem ).toBeInTheDocument();

		// Verify clicking the current source still triggers onSelect
		await user.click( featuredImageItem );
		expect( mockOnSelect ).toHaveBeenCalledWith( 'featured-image' );
	} );
} );
