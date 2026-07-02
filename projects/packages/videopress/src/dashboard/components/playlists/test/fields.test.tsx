import { render, screen } from '@testing-library/react';
import { playlistFields, playlistTypeLabel, PLAYLIST_TYPE_LABELS } from '../fields';
import type { Playlist, PlaylistType } from '../../../types/playlist';
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
	type: 'collection',
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

describe( 'playlistTypeLabel', () => {
	it.each( [
		[ 'collection', 'Collection' ],
		[ 'series', 'Series' ],
		[ 'course', 'Course' ],
		[ 'season', 'Season' ],
	] as [ PlaylistType, string ][] )( 'maps %s to %s', ( type, label ) => {
		expect( playlistTypeLabel( type ) ).toBe( label );
	} );
} );

describe( 'playlistFields — type badge', () => {
	it.each( Object.entries( PLAYLIST_TYPE_LABELS ) as [ PlaylistType, string ][] )(
		'renders the %s badge as %s',
		( type, label ) => {
			const RenderType = getField( 'type' ).render as ComponentType< { item: Playlist } >;
			render( <RenderType item={ makePlaylist( { type } ) } /> );
			expect( screen.getByText( label ) ).toBeInTheDocument();
		}
	);

	it( 'exposes the raw type as the filterable value with one element per type', () => {
		const field = getField( 'type' );
		expect( field.getValue?.( { item: makePlaylist( { type: 'course' } ) } ) ).toBe( 'course' );
		expect( field.elements?.map( element => element.value ) ).toEqual( [
			'collection',
			'series',
			'course',
			'season',
		] );
	} );
} );

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
