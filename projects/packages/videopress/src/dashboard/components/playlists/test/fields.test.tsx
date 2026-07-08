import { render, screen } from '@testing-library/react';
import { playlistFields } from '../fields';
import type { Playlist } from '../../../types/playlist';
import type { ComponentType } from 'react';

// ArtworkField needs react-query and global-notices providers that this
// mapping-focused test doesn't exercise; stub it so the fields module can
// be imported and rendered without them.
jest.mock( '../artwork-field', () => ( { __esModule: true, default: () => null } ) );

const makePlaylist = ( overrides: Partial< Playlist > = {} ): Playlist => ( {
	id: 1,
	name: 'My playlist',
	description: '',
	count: 2,
	artworkId: null,
	order: [],
	...overrides,
} );

const getField = ( id: string ) => {
	const field = playlistFields.find( candidate => candidate.id === id );
	if ( ! field ) {
		throw new Error( `missing field: ${ id }` );
	}
	return field;
};

describe( 'playlistFields — video count', () => {
	it.each( [
		[ 1, '1 video' ],
		[ 3, '3 videos' ],
		[ 0, '0 videos' ],
	] )( 'renders a count of %d as "%s"', ( count, expected ) => {
		const RenderCount = getField( 'count' ).render as ComponentType< { item: Playlist } >;
		render(
			<div data-testid="count-cell">
				<RenderCount item={ makePlaylist( { count } ) } />
			</div>
		);
		expect( screen.getByTestId( 'count-cell' ) ).toHaveTextContent( expected );
	} );
} );
