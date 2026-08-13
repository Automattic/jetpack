import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Edit from '../edit';
import type { PlaylistBlockAttributes } from '../types';
import type { BlockEditProps } from '@wordpress/blocks';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: ( { children }: { children: React.ReactNode } ) => <div>{ children }</div>,
} ) );

/**
 * Render the Edit component with the given attributes.
 *
 * @param attributes - Partial block attributes.
 * @return The setAttributes mock.
 */
function renderEdit( attributes: Partial< PlaylistBlockAttributes > = {} ) {
	const setAttributes = jest.fn();
	// The component only consumes attributes/setAttributes; the remaining
	// BlockEditProps fields are editor-runtime plumbing it never touches.
	const props = {
		attributes: { videos: [], autoAdvance: true, loop: false, ...attributes },
		setAttributes,
	} as unknown as BlockEditProps< PlaylistBlockAttributes >;
	render( <Edit { ...props } /> );
	return { setAttributes };
}

describe( 'PlaylistBlockEdit', () => {
	it( 'shows the placeholder and adds a video by GUID', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit();

		expect( screen.getByText( 'VideoPress Playlist' ) ).toBeInTheDocument();

		await user.type( screen.getByPlaceholderText( 'VideoPress GUID or URL' ), 'abcd1234' );
		await user.click( screen.getByText( 'Add to playlist' ) );

		expect( setAttributes ).toHaveBeenCalledWith( { videos: [ { guid: 'abcd1234' } ] } );
	} );

	it( 'accepts a VideoPress URL and extracts its GUID', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit();

		await user.type(
			screen.getByPlaceholderText( 'VideoPress GUID or URL' ),
			'https://videopress.com/v/efgh5678'
		);
		await user.keyboard( '{Enter}' );

		expect( setAttributes ).toHaveBeenCalledWith( { videos: [ { guid: 'efgh5678' } ] } );
	} );

	it( 'rejects unrecognized input with an error message', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit();

		await user.type( screen.getByPlaceholderText( 'VideoPress GUID or URL' ), 'not a video' );
		await user.click( screen.getByText( 'Add to playlist' ) );

		expect( setAttributes ).not.toHaveBeenCalled();
		expect(
			screen.getByText( 'Enter a VideoPress GUID or a VideoPress video URL.' )
		).toBeInTheDocument();
	} );

	it( 'previews the first video and lists every item', () => {
		renderEdit( {
			videos: [ { guid: 'abcd1234', title: 'First' }, { guid: 'efgh5678' } ],
		} );

		const preview = screen.getByTitle( 'VideoPress Playlist Player' );
		expect( preview ).toHaveAttribute(
			'src',
			expect.stringContaining( 'videopress.com/embed/abcd1234' )
		);

		expect( screen.getByDisplayValue( 'First' ) ).toBeInTheDocument();
		expect( screen.getByPlaceholderText( 'efgh5678' ) ).toBeInTheDocument();
	} );

	it( 'removes an item from the playlist', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit( {
			videos: [ { guid: 'abcd1234' }, { guid: 'efgh5678' } ],
		} );

		await user.click( screen.getAllByLabelText( 'Remove from playlist' )[ 0 ] );

		expect( setAttributes ).toHaveBeenCalledWith( { videos: [ { guid: 'efgh5678' } ] } );
	} );

	it( 'moves an item down and disables the impossible directions', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit( {
			videos: [ { guid: 'abcd1234' }, { guid: 'efgh5678' } ],
		} );

		expect( screen.getAllByLabelText( 'Move up' )[ 0 ] ).toBeDisabled();
		expect( screen.getAllByLabelText( 'Move down' )[ 1 ] ).toBeDisabled();

		await user.click( screen.getAllByLabelText( 'Move down' )[ 0 ] );

		expect( setAttributes ).toHaveBeenCalledWith( {
			videos: [ { guid: 'efgh5678' }, { guid: 'abcd1234' } ],
		} );
	} );

	it( 'updates an item title', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit( { videos: [ { guid: 'abcd1234' } ] } );

		await user.type( screen.getByPlaceholderText( 'abcd1234' ), 'A' );

		expect( setAttributes ).toHaveBeenCalledWith( {
			videos: [ { guid: 'abcd1234', title: 'A' } ],
		} );
	} );

	it( 'switches the preview when selecting another item', async () => {
		const user = userEvent.setup();
		renderEdit( { videos: [ { guid: 'abcd1234' }, { guid: 'efgh5678' } ] } );

		await user.click( screen.getByLabelText( 'Preview video 2' ) );

		expect( screen.getByTitle( 'VideoPress Playlist Player' ) ).toHaveAttribute(
			'src',
			expect.stringContaining( 'videopress.com/embed/efgh5678' )
		);
	} );

	it( 'toggles the auto-advance and loop settings', async () => {
		const user = userEvent.setup();
		const { setAttributes } = renderEdit( { videos: [ { guid: 'abcd1234' } ] } );

		await user.click( screen.getByLabelText( 'Autoplay next video' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { autoAdvance: false } );

		await user.click( screen.getByLabelText( 'Loop playlist' ) );
		expect( setAttributes ).toHaveBeenCalledWith( { loop: true } );
	} );
} );
