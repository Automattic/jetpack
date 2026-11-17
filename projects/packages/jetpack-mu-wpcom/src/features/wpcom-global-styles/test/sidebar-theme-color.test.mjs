import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toOpaqueHex } from '../sidebar-theme-color.js';

// `ThemeProvider` throws on a seed that isn't an opaque color, which would unmount the notice.
describe( 'toOpaqueHex', () => {
	for ( const [ input, expected ] of [
		[ '#1E1E1E', '#1e1e1e' ],
		[ ' #abc ', '#aabbcc' ],
		[ 'rgb(30, 30, 30)', '#1e1e1e' ],
		[ 'rgb(226 111 86)', '#e26f56' ],
		[ 'rgba(10, 20, 30, 1)', '#0a141e' ],
		[ 'rgb(1 2 3 / 100%)', '#010203' ],
		[ 'rgba(0, 0, 0, 0)', null ],
		[ 'rgb(1 2 3 / 50%)', null ],
		[ 'transparent', null ],
		[ '', null ],
		[ undefined, null ],
	] ) {
		it( `converts ${ JSON.stringify( input ) } to ${ expected }`, () => {
			assert.equal( toOpaqueHex( input ), expected );
		} );
	}
} );
