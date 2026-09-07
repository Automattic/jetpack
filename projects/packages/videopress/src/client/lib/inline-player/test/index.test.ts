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

	it( 'gives every embed of one video its own element when the bundle reuses ids', () => {
		// Behave like the bundle: adopt any element already named after the GUID, then wrap it the way video.js does.
		factory.mockImplementation( ( guid: string, parent: HTMLElement ) => {
			const id = `videopress-player-${ guid }`;
			let video = document.getElementById( id );
			if ( ! video ) {
				video = document.createElement( 'video' );
				video.id = id;
				parent.appendChild( video );
			}
			const root = document.createElement( 'div' );
			root.className = 'video-js';
			root.id = id;
			video.replaceWith( root );
			video.id = `${ id }_html5_api`;
			root.appendChild( video );
		} );
		const embeds = [
			placeholder( 'abcDEF12' ),
			placeholder( 'abcDEF12' ),
			placeholder( 'abcDEF12' ),
		];

		expect( mountInlinePlayers() ).toBe( 3 );

		embeds.forEach( el => {
			const roots = el.querySelectorAll< HTMLElement >( 'div.video-js' );
			expect( roots ).toHaveLength( 1 );
			expect( el.querySelector( 'video' )?.id ).toBe( `${ roots[ 0 ].id }_html5_api` );
		} );
		const ids = Array.from( document.querySelectorAll( '[id^="videopress-player-"]' ) ).map(
			el => el.id
		);
		expect( new Set( ids ).size ).toBe( ids.length );
	} );

	it( 'does nothing without the player bundle', () => {
		delete window.videopress;
		placeholder( 'abcDEF12' );

		expect( mountInlinePlayers() ).toBe( 0 );
	} );
} );
