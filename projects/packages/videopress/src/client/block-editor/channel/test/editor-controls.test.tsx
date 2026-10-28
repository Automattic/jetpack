import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { editorSourcePlaylist, PlaylistPicker } from '../editor-controls';

afterEach( () => {
	delete window.videopressChannelEditor;
} );

describe( 'PlaylistPicker', () => {
	it( 'falls back to typing the playlist ID when the editor has no playlist list', async () => {
		const onChange = jest.fn();
		render( <PlaylistPicker value="" onChange={ onChange } /> );

		const input = screen.getByRole( 'textbox', { name: 'Playlist ID' } );
		expect(
			screen.getByText( 'Leave empty for the most recently updated playlist.' )
		).toBeInTheDocument();
		await userEvent.type( input, 'a' );
		expect( onChange ).toHaveBeenLastCalledWith( 'a' );
	} );

	it( 'lists the site playlists after the most recently updated one', async () => {
		window.videopressChannelEditor = {
			playlists: [
				{ key: 'mc', title: 'Molten Core' },
				{ key: 'road', title: '' },
			],
		};
		const onChange = jest.fn();
		render( <PlaylistPicker onChange={ onChange } /> );

		const select = screen.getByRole( 'combobox', { name: 'Playlist' } );
		expect(
			Array.from( ( select as HTMLSelectElement ).options ).map( option => [
				option.value,
				option.text,
			] )
		).toEqual( [
			[ '', 'Most recently updated' ],
			[ 'mc', 'Molten Core' ],
			[ 'road', 'Untitled playlist' ],
		] );
		expect( select ).toHaveValue( '' );

		await userEvent.selectOptions( select, 'mc' );
		expect( onChange.mock.lastCall[ 0 ] ).toBe( 'mc' );
	} );

	it( 'keeps a picked playlist that is no longer published', () => {
		window.videopressChannelEditor = { playlists: [ { key: 'mc', title: 'Molten Core' } ] };
		render( <PlaylistPicker value="gone" onChange={ jest.fn() } /> );

		expect( screen.getByRole( 'combobox', { name: 'Playlist' } ) ).toHaveValue( 'gone' );
		expect( screen.getByRole( 'option', { name: 'Missing playlist (gone)' } ) ).toBeInTheDocument();
	} );
} );

describe( 'editorSourcePlaylist', () => {
	it( 'resolves the picked playlist, or the most recently updated one', () => {
		expect( editorSourcePlaylist( 'mc' ) ).toBeUndefined();

		const road = { key: 'road', title: 'The road to 60' };
		const mc = { key: 'mc', title: 'Molten Core' };
		window.videopressChannelEditor = { playlists: [ road, mc ] };
		expect( editorSourcePlaylist( 'mc' ) ).toBe( mc );
		expect( editorSourcePlaylist() ).toBe( road );
		expect( editorSourcePlaylist( 'gone' ) ).toBeNull();

		window.videopressChannelEditor = { playlists: [] };
		expect( editorSourcePlaylist() ).toBeNull();
	} );
} );
