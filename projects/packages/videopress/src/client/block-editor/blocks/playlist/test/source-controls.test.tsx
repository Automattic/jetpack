import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PlaylistSourcePanel, SourcedPlaylistEdit } from '../source-controls';
import type { PlaylistAttributes } from '../types';

jest.mock( '@wordpress/block-editor', () => ( {
	useBlockProps: ( props: Record< string, unknown > = {} ) => props,
	InspectorControls: ( { children }: { children: React.ReactNode } ) => (
		<div data-testid="inspector-controls">{ children }</div>
	),
} ) );

// The display settings have their own tests with the playlist edit component.
jest.mock( '../inspector-controls', () => ( {
	PlaylistSettingsPanels: () => <div data-testid="settings-panels" />,
	PlaylistStylesControls: () => <div data-testid="styles-controls" />,
} ) );

/**
 * Attributes of a playlist block, with overrides.
 *
 * @param overrides - Attribute overrides.
 * @return Attributes.
 */
function attributes( overrides: Partial< PlaylistAttributes > = {} ) {
	return { videos: [], showPlaylistTitle: true, ...overrides } as PlaylistAttributes;
}

afterEach( () => {
	delete window.videopressChannelEditor;
} );

describe( 'PlaylistSourcePanel', () => {
	it( 'defaults to the block’s own videos and switches the source', async () => {
		const setAttributes = jest.fn();
		render( <PlaylistSourcePanel attributes={ attributes() } setAttributes={ setAttributes } /> );

		// Collapsed until the block shows another playlist.
		expect( screen.queryByRole( 'combobox', { name: 'Videos' } ) ).not.toBeInTheDocument();
		await userEvent.click( screen.getByRole( 'button', { name: 'Source' } ) );
		const select = screen.getByRole( 'combobox', { name: 'Videos' } );
		expect( select ).toHaveValue( 'own' );
		expect( screen.queryByRole( 'textbox', { name: 'Playlist ID' } ) ).not.toBeInTheDocument();

		await userEvent.selectOptions( select, 'index' );
		expect( setAttributes ).toHaveBeenCalledWith( { source: 'index' } );
	} );

	it( 'picks the playlist to show for the index source', async () => {
		window.videopressChannelEditor = { playlists: [ { key: 'mc', title: 'Molten Core' } ] };
		const setAttributes = jest.fn();
		render(
			<PlaylistSourcePanel
				attributes={ attributes( { source: 'index' } ) }
				setAttributes={ setAttributes }
			/>
		);

		await userEvent.selectOptions( screen.getByRole( 'combobox', { name: 'Playlist' } ), 'mc' );
		expect( setAttributes ).toHaveBeenCalledWith( { sourcePlaylistId: 'mc' } );
	} );
} );

describe( 'SourcedPlaylistEdit', () => {
	it( 'shows a placeholder with the display settings', () => {
		render(
			<SourcedPlaylistEdit
				attributes={ attributes( { source: 'index' } ) }
				setAttributes={ jest.fn() }
			/>
		);

		expect(
			screen.getAllByText( 'Shows a playlist published on this site.' ).length
		).toBeGreaterThan( 0 );
		expect( screen.getByTestId( 'settings-panels' ) ).toBeInTheDocument();
		expect( screen.getByTestId( 'styles-controls' ) ).toBeInTheDocument();
	} );
} );
