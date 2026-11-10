import { route as playlistRoute } from '../../playlist/route';
import { route as playlistsRoute } from '../route';

describe( 'playlists routes', () => {
	it( 'need no loaders or redirects', () => {
		expect( playlistsRoute ).toEqual( {} );
		expect( playlistRoute ).toEqual( {} );
	} );
} );
