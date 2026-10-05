import { fireEvent, render, screen } from '@testing-library/react';
import FilmstripTrack, { tileStyle } from '../filmstrip-track';

const storyboard = {
	url: 'https://example.com/storyboard.jpg',
	tile_width: 160,
	tile_height: 90,
	tiles: 15,
	columns: 10,
	rows: 10,
	interval_ms: 1000,
};

it( 'uses physical sprite rows and original timestamps for each crop', () => {
	expect( tileStyle( storyboard, 11000, 160 ) ).toEqual( {
		inlineSize: 160,
		backgroundImage: 'url("https://example.com/storyboard.jpg")',
		backgroundSize: '1600px 900px',
		backgroundPosition: '-160px -103px',
	} );
} );

it( 'replaces a failed sprite with the neutral track', () => {
	render(
		<FilmstripTrack
			filmstrip={ { status: 'storyboard', storyboard } }
			trackWidth={ 1000 }
			durationMs={ 15000 }
		/>
	);
	fireEvent.error( screen.getByAltText( '' ) );
	expect( screen.queryByAltText( '' ) ).not.toBeInTheDocument();
} );
