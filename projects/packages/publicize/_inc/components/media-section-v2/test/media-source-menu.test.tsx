import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import MediaSourceMenu from '../media-source-menu';
import { getMediaSourceDescription } from '../utils/media-source-options';

jest.mock(
	'@automattic/jetpack-ai-client',
	() => ( {
		AiSVG: 'svg',
	} ),
	{ virtual: true }
);

jest.mock( '../../../utils', () => ( {
	getSocialScriptData: jest.fn( () => ( {
		plugin_info: {
			jetpack: { version: '15.5' },
		},
	} ) ),
} ) );

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
} );

describe( 'MediaSourceMenu', () => {
	const mockOnSelect = jest.fn();
	const mockOnMediaLibraryClick = jest.fn();
	const mockOnRemove = jest.fn();

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
				featuredImageId={ 123 }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

		// Check that menu groups are rendered
		expect( screen.getByText( 'Link preview' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Attachment' ) ).toBeInTheDocument();

		// Check that menu items are rendered
		expect( screen.getByRole( 'menuitem', { name: 'Featured image' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'menuitem', { name: 'Social image template' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'menuitem', { name: 'From Media Library' } ) ).toBeInTheDocument();
	} );

	it( 'should call onSelect when Featured image is clicked', async () => {
		const user = userEvent.setup();

		render(
			<MediaSourceMenu
				currentSource={ null }
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
				featuredImageId={ 123 }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );
		await user.click( screen.getByRole( 'menuitem', { name: 'Featured image' } ) );

		expect( mockOnSelect ).toHaveBeenCalledWith( 'featured-image' );
	} );

	it( 'should call onSelect when Social image template is clicked', async () => {
		const user = userEvent.setup();

		render(
			<MediaSourceMenu
				currentSource={ null }
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );
		await user.click( screen.getByRole( 'menuitem', { name: 'Social image template' } ) );

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
		await user.click( screen.getByRole( 'menuitem', { name: 'From Media Library' } ) );

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
				featuredImageId={ 123 }
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
		expect( screen.getByText( 'Link preview' ) ).toBeInTheDocument();
	} );

	it( 'should disable the current source item', async () => {
		const user = userEvent.setup();

		render(
			<MediaSourceMenu
				currentSource="featured-image"
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
				featuredImageId={ 123 }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

		// Verify the menu renders with the current source item disabled
		const featuredImageItem = screen.getByRole( 'menuitem', { name: 'Featured image' } );
		expect( featuredImageItem ).toBeInTheDocument();
		expect( featuredImageItem ).toHaveAttribute( 'aria-disabled', 'true' );

		// Verify clicking the disabled item does not trigger onSelect
		await user.click( featuredImageItem );
		expect( mockOnSelect ).not.toHaveBeenCalled();
	} );

	it( 'should hide Featured image option when no featured image exists', async () => {
		const user = userEvent.setup();

		render(
			<MediaSourceMenu
				currentSource={ null }
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

		expect( screen.queryByRole( 'menuitem', { name: 'Featured image' } ) ).not.toBeInTheDocument();
	} );

	it( 'should show No media option when no featured image exists', async () => {
		const user = userEvent.setup();

		render(
			<MediaSourceMenu
				currentSource={ null }
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
				onRemove={ mockOnRemove }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

		expect( screen.getByRole( 'menuitem', { name: 'No media' } ) ).toBeInTheDocument();
	} );

	it( 'should call onRemove when No media is clicked', async () => {
		const user = userEvent.setup();

		render(
			<MediaSourceMenu
				currentSource="sig"
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
				onRemove={ mockOnRemove }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );
		await user.click( screen.getByRole( 'menuitem', { name: 'No media' } ) );

		expect( mockOnRemove ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'should not show No media option when featured image exists', async () => {
		const user = userEvent.setup();

		render(
			<MediaSourceMenu
				currentSource={ null }
				onSelect={ mockOnSelect }
				onMediaLibraryClick={ mockOnMediaLibraryClick }
				onRemove={ mockOnRemove }
				featuredImageId={ 123 }
			/>
		);

		await user.click( screen.getByRole( 'button', { name: 'Select' } ) );

		expect( screen.queryByRole( 'menuitem', { name: 'No media' } ) ).not.toBeInTheDocument();
	} );
} );
