import { renderHook, act } from '@testing-library/react';
import useInlinePlayer, { getInlinePlayerConfig } from '../index';
import type { PlayerApi, PlayerHandle, PlayerStatus } from '../../../../lib/inline-player/loader';
import type { RefObject } from 'react';

const CONFIG = {
	script: 'https://v0.wordpress.com/js/videojs/videopress.js?ver=1',
	style: 'https://v0.wordpress.com/js/videojs/videopress.css?ver=1',
};

type FakePlayer = {
	handle: PlayerHandle;
	api: PlayerApi;
	setStatus: ( status: PlayerStatus ) => void;
	tick: ( seconds: number ) => void;
};

const createFakePlayer = (): FakePlayer => {
	const statusListeners: Array< ( o: PlayerStatus, n: PlayerStatus ) => void > = [];
	const timeListeners: Array< ( s: number ) => void > = [];
	let status: PlayerStatus = 'loading';
	const api: PlayerApi = {
		controls: {
			play: jest.fn( () => Promise.resolve() ),
			pause: jest.fn( () => Promise.resolve() ),
			seek: jest.fn( () => Promise.resolve() ),
		},
		status: {
			onPlayerStatusChanged: jest.fn( cb => statusListeners.push( cb ) ),
			onTimeUpdate: jest.fn( cb => timeListeners.push( cb ) ),
		},
	};
	return {
		api,
		handle: { api, destroy: jest.fn() },
		setStatus: next => {
			const previous = status;
			status = next;
			statusListeners.forEach( cb => cb( previous, next ) );
		},
		tick: seconds => timeListeners.forEach( cb => cb( seconds ) ),
	};
};

let factory: jest.Mock;
let players: FakePlayer[];
let container: HTMLDivElement;
let containerRef: RefObject< HTMLElement >;

beforeEach( () => {
	document.body.innerHTML = '';
	document.head.innerHTML = '';
	players = [];
	factory = jest.fn( () => {
		const player = createFakePlayer();
		players.push( player );
		return player.handle;
	} );
	window.videopress = factory;
	container = document.createElement( 'div' );
	document.body.appendChild( container );
	containerRef = { current: container };
} );

afterEach( () => {
	delete window.videopress;
	delete ( window as { videoPressEditorState?: unknown } ).videoPressEditorState;
} );

const flush = async () => {
	await act( async () => {
		await Promise.resolve();
		await Promise.resolve();
	} );
};

describe( 'getInlinePlayerConfig', () => {
	it( 'returns the editor state config only when it names a bundle', () => {
		expect( getInlinePlayerConfig() ).toBeNull();
		window.videoPressEditorState = { inlinePlayer: null } as never;
		expect( getInlinePlayerConfig() ).toBeNull();
		window.videoPressEditorState = { inlinePlayer: CONFIG } as never;
		expect( getInlinePlayerConfig() ).toEqual( CONFIG );
	} );
} );

describe( 'useInlinePlayer', () => {
	it( 'mounts the player into the container with the given options', async () => {
		const { result } = renderHook( () =>
			useInlinePlayer( containerRef, {
				guid: 'abcDEF12',
				options: { muted: true, chrome: 'v2' },
				config: CONFIG,
			} )
		);
		await flush();

		expect( factory ).toHaveBeenCalledWith(
			'abcDEF12',
			container,
			expect.objectContaining( { fill: true, muted: true, chrome: 'v2' } )
		);
		expect( result.current.isLoaded ).toBe( false );

		act( () => players[ 0 ].setStatus( 'ready' ) );
		expect( result.current.isLoaded ).toBe( true );
		expect( result.current.playerIsReady ).toBe( false );

		act( () => players[ 0 ].setStatus( 'playing' ) );
		expect( result.current.playerIsReady ).toBe( true );
		expect( players[ 0 ].api.controls.pause ).not.toHaveBeenCalled();
	} );

	it( 'does nothing without a GUID or a bundle config', async () => {
		renderHook( () => useInlinePlayer( containerRef, { options: {}, config: CONFIG } ) );
		renderHook( () => useInlinePlayer( containerRef, { guid: 'abcDEF12', options: {} } ) );
		await flush();

		expect( factory ).not.toHaveBeenCalled();
	} );

	it( 'parks a preview-on-hover player at its start after the first play and keeps it in the loop', async () => {
		const { result } = renderHook( () =>
			useInlinePlayer( containerRef, {
				guid: 'abcDEF12',
				options: {},
				config: CONFIG,
				initialTimePosition: 4000,
				previewOnHover: { atTime: 4000, duration: 2000 },
			} )
		);
		await flush();
		const player = players[ 0 ];

		act( () => player.setStatus( 'playing' ) );

		expect( player.api.controls.pause ).toHaveBeenCalledTimes( 1 );
		expect( player.api.controls.seek ).toHaveBeenCalledWith( 4000 );
		expect( result.current.playerIsReady ).toBe( true );

		( player.api.controls.seek as jest.Mock ).mockClear();
		act( () => player.tick( 5 ) );
		expect( player.api.controls.seek ).not.toHaveBeenCalled();
		act( () => player.tick( 6.5 ) );
		expect( player.api.controls.seek ).toHaveBeenCalledWith( 4000 );
	} );

	it( 'plays and pauses the preview on hover once the player is ready', async () => {
		const wrapper = document.createElement( 'div' );
		document.body.appendChild( wrapper );
		renderHook( () =>
			useInlinePlayer( containerRef, {
				guid: 'abcDEF12',
				options: {},
				config: CONFIG,
				wrapperElement: wrapper,
				previewOnHover: { atTime: 0, duration: 1000 },
			} )
		);
		await flush();
		const player = players[ 0 ];

		act( () => wrapper.dispatchEvent( new Event( 'mouseenter' ) ) );
		expect( player.api.controls.play ).not.toHaveBeenCalled();

		act( () => player.setStatus( 'playing' ) );
		act( () => wrapper.dispatchEvent( new Event( 'mouseenter' ) ) );
		expect( player.api.controls.play ).toHaveBeenCalledTimes( 1 );
		act( () => wrapper.dispatchEvent( new Event( 'mouseleave' ) ) );
		// One pause parked the player after its first play, the other came from the hover leaving.
		expect( player.api.controls.pause ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'destroys the player when the options change and on unmount', async () => {
		const { rerender, unmount } = renderHook(
			( { muted }: { muted: boolean } ) =>
				useInlinePlayer( containerRef, {
					guid: 'abcDEF12',
					options: { muted },
					config: CONFIG,
				} ),
			{ initialProps: { muted: false } }
		);
		await flush();
		expect( factory ).toHaveBeenCalledTimes( 1 );

		rerender( { muted: true } );
		await flush();
		expect( players[ 0 ].handle.destroy ).toHaveBeenCalledTimes( 1 );
		expect( factory ).toHaveBeenCalledTimes( 2 );
		expect( factory ).toHaveBeenLastCalledWith(
			'abcDEF12',
			container,
			expect.objectContaining( { muted: true } )
		);

		unmount();
		expect( players[ 1 ].handle.destroy ).toHaveBeenCalledTimes( 1 );
	} );

	// Behave like the bundle: adopt any element already named after the GUID, then wrap it the way video.js does.
	const adoptingFactory = ( guid: string, parent: HTMLElement ) => {
		const id = `videopress-player-${ guid }`;
		// eslint-disable-next-line testing-library/no-node-access -- mimics the bundle's own lookup.
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
		return { api: null, destroy: jest.fn() };
	};

	it( 'keeps two blocks of the same video apart when they wait on the same download', async () => {
		delete window.videopress;
		window.jetpackVideoPressInlinePlayer = CONFIG;
		const second = document.createElement( 'div' );
		document.body.appendChild( second );
		const secondRef = { current: second };

		renderHook( () =>
			useInlinePlayer( containerRef, { guid: 'abcDEF12', options: {}, config: CONFIG } )
		);
		renderHook( () =>
			useInlinePlayer( secondRef, { guid: 'abcDEF12', options: {}, config: CONFIG } )
		);
		const adopting = jest.fn( adoptingFactory );
		window.videopress = adopting;
		// eslint-disable-next-line testing-library/no-node-access -- the loader injects the bundle tag itself.
		const bundleTag = document.querySelector( 'script[src*="videopress.js"]' );
		bundleTag?.dispatchEvent( new Event( 'load' ) );
		await flush();

		/* eslint-disable testing-library/no-node-access -- the players mount imperatively into plain containers. */
		expect( container.querySelectorAll( 'div.video-js' ) ).toHaveLength( 1 );
		expect( second.querySelectorAll( 'div.video-js' ) ).toHaveLength( 1 );
		expect( container.querySelector( 'div.video-js' )?.id ).not.toBe(
			second.querySelector( 'div.video-js' )?.id
		);
		/* eslint-enable testing-library/no-node-access */
		delete window.jetpackVideoPressInlinePlayer;
	} );

	it( 'keeps two players of the same video apart', async () => {
		factory.mockImplementation( ( guid: string, parent: HTMLElement ) => {
			const id = `videopress-player-${ guid }`;
			// eslint-disable-next-line testing-library/no-node-access -- mimics the bundle's own lookup.
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
			return { api: null, destroy: jest.fn() };
		} );
		const second = document.createElement( 'div' );
		document.body.appendChild( second );
		const secondRef = { current: second };

		renderHook( () =>
			useInlinePlayer( containerRef, { guid: 'abcDEF12', options: {}, config: CONFIG } )
		);
		await flush();
		renderHook( () =>
			useInlinePlayer( secondRef, { guid: 'abcDEF12', options: {}, config: CONFIG } )
		);
		await flush();

		/* eslint-disable testing-library/no-node-access -- the players mount imperatively into plain containers. */
		expect( container.querySelectorAll( 'div.video-js' ) ).toHaveLength( 1 );
		expect( second.querySelectorAll( 'div.video-js' ) ).toHaveLength( 1 );
		expect( container.querySelector( 'div.video-js' )?.id ).not.toBe(
			second.querySelector( 'div.video-js' )?.id
		);
		/* eslint-enable testing-library/no-node-access */
	} );
} );
