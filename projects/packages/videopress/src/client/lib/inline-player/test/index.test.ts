import { mountInlinePlayers, parsePlaceholderOptions } from '../index';

const placeholder = ( guid: string, options?: string ) => {
	const el = document.createElement( 'div' );
	el.className = 'jetpack-videopress-player__inline';
	el.dataset.videopressGuid = guid;
	if ( options !== undefined ) {
		el.dataset.videopressOptions = options;
	}
	document.body.appendChild( el );
	return el;
};

describe( 'parsePlaceholderOptions', () => {
	it( 'returns the parsed object', () => {
		expect( parsePlaceholderOptions( '{"muted":true,"preloadContent":"none"}' ) ).toEqual( {
			muted: true,
			preloadContent: 'none',
		} );
	} );

	it( 'tolerates missing, malformed, and non-object values', () => {
		expect( parsePlaceholderOptions( undefined ) ).toEqual( {} );
		expect( parsePlaceholderOptions( 'not json' ) ).toEqual( {} );
		expect( parsePlaceholderOptions( '[1,2]' ) ).toEqual( {} );
	} );
} );

describe( 'mountInlinePlayers', () => {
	let factory: jest.Mock;

	beforeEach( () => {
		document.body.innerHTML = '';
		factory = jest.fn();
		window.videopress = factory;
	} );

	afterEach( () => {
		delete window.videopress;
	} );

	it( 'mounts one player per placeholder with its options', () => {
		const first = placeholder( 'abcDEF12', '{"muted":true}' );
		const second = placeholder( 'ghiJKL34' );

		expect( mountInlinePlayers() ).toBe( 2 );

		expect( factory ).toHaveBeenCalledTimes( 2 );
		expect( factory ).toHaveBeenCalledWith(
			'abcDEF12',
			first,
			expect.objectContaining( { fill: true, muted: true } )
		);
		expect( factory ).toHaveBeenCalledWith(
			'ghiJKL34',
			second,
			expect.objectContaining( { fill: true } )
		);
	} );

	it( 'never mounts the same placeholder twice', () => {
		placeholder( 'abcDEF12' );

		expect( mountInlinePlayers() ).toBe( 1 );
		expect( mountInlinePlayers() ).toBe( 0 );
		expect( factory ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'does nothing without the player bundle', () => {
		delete window.videopress;
		placeholder( 'abcDEF12' );

		expect( mountInlinePlayers() ).toBe( 0 );
	} );
} );
