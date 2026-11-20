import { render, screen } from '@testing-library/react';
import {
	PlaylistStatusBadge,
	PlaylistThumbnail,
	playlistFields,
	playlistStatusLabels,
	playlistTitle,
	videoCountLabel,
} from '../fields';
import type { PlaylistItem } from '../../../types/playlists';
import type { ReactNode } from 'react';

jest.mock( '@wordpress/route', () => ( {
	Link: ( {
		to,
		children,
		className,
	}: {
		to: string;
		children: ReactNode;
		className?: string;
	} ) => (
		<a href={ to } className={ className }>
			{ children }
		</a>
	),
} ) );
jest.mock( '../../../hooks/use-video-live-metadata', () => ( {
	useVideoLiveMetadata: ( guid?: string ) => ( guid ? { poster: `${ guid }.jpg` } : {} ),
} ) );

const ITEM = {
	key: 'trip',
	title: 'Trip',
	description: 'Summer',
	videos: [ { guid: 'aaaaaaa1', durationMs: 61000 } ],
	videoCount: 1,
	durationMs: 61000,
	updated: '2026-11-03T12:00:00+00:00',
	status: 'draft',
	post: { id: 7, title: 'Travel', type: 'page', typeLabel: 'Page', editUrl: 'post.php?post=7' },
} as unknown as PlaylistItem;

const field = ( id: string ) => playlistFields.find( f => f.id === id )!;

describe( 'playlist fields', () => {
	it( 'labels titles, counts and statuses', () => {
		expect( playlistTitle( { title: '  ' } ) ).toBe( 'Untitled playlist' );
		expect( playlistTitle( { title: 'Trip' } ) ).toBe( 'Trip' );
		expect( videoCountLabel( 1 ) ).toBe( '1 video' );
		expect( videoCountLabel( 3 ) ).toBe( '3 videos' );
		expect( playlistStatusLabels().publish ).toBe( 'Published' );
	} );

	it( 'shows the first poster, the count and a draft badge on the thumbnail', () => {
		render( <PlaylistThumbnail item={ ITEM } /> );

		expect( screen.getByRole( 'link' ) ).toHaveAttribute( 'href', '/playlists/trip' );
		// The poster is decorative ( empty alt ), so it is only reachable as a presentation image.
		expect( screen.getByRole( 'presentation' ) ).toHaveAttribute( 'src', 'aaaaaaa1.jpg' );
		expect( screen.getByText( '1 video' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Draft' ) ).toBeInTheDocument();
	} );

	it( 'renders the badge, title, duration and post fields', () => {
		const { rerender } = render( <PlaylistStatusBadge item={ { status: 'publish' } } /> );
		expect( screen.getByText( 'Published' ) ).toHaveClass( 'is-publish' );

		const renderField = ( id: string ) => {
			const Render = field( id ).render as ( props: { item: PlaylistItem } ) => ReactNode;
			rerender( <Render item={ ITEM } /> );
		};
		renderField( 'title' );
		expect( screen.getByRole( 'link', { name: 'Trip' } ) ).toHaveAttribute(
			'href',
			'/playlists/trip'
		);
		renderField( 'description' );
		expect( screen.getByText( 'Summer' ) ).toBeInTheDocument();
		renderField( 'post' );
		expect( screen.getByRole( 'link', { name: 'Travel' } ) ).toHaveAttribute(
			'href',
			'post.php?post=7'
		);
		renderField( 'duration' );
		expect( screen.getByText( /01:01|1:01/ ) ).toBeInTheDocument();
		rerender(
			<>
				{ ( field( 'duration' ).render as ( p: { item: PlaylistItem } ) => string )( {
					item: { ...ITEM, durationMs: 0 },
				} ) }
			</>
		);
		expect( screen.getByText( '—' ) ).toBeInTheDocument();
	} );

	it( 'reads sortable values and only filters by status', () => {
		const value = ( id: string ) =>
			( field( id ).getValue as ( p: { item: PlaylistItem } ) => unknown )( { item: ITEM } );
		expect( value( 'title' ) ).toBe( 'Trip' );
		expect( value( 'videoCount' ) ).toBe( 1 );
		expect( value( 'status' ) ).toBe( 'draft' );
		expect( value( 'updated' ) ).toBe( ITEM.updated );
		expect( playlistFields.filter( f => f.filterBy !== false ).map( f => f.id ) ).toEqual( [
			'thumbnail',
			'status',
		] );
	} );
} );
