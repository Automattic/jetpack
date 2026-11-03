jest.mock( '../poster', () => ( { resolvePoster: jest.fn() } ) );

type InlinePlayerModule = typeof import( '../index' );
type PosterModule = typeof import( '../poster' );

// The module caches the bundle promise and the preconnect state; every test starts from a fresh copy.
let mod: InlinePlayerModule;
let resolvePoster: jest.MockedFunction< PosterModule[ 'resolvePoster' ] >;
const loadModule = () => {
	jest.resetModules();
	/* eslint-disable @typescript-eslint/no-require-imports */
	mod = require( '../index' ) as InlinePlayerModule;
	resolvePoster = ( require( '../poster' ) as PosterModule ).resolvePoster as typeof resolvePoster;
	/* eslint-enable @typescript-eslint/no-require-imports */
	resolvePoster.mockResolvedValue( null );
};
const ensurePlayer = ( ...args: Parameters< InlinePlayerModule[ 'ensurePlayer' ] > ) =>
	mod.ensurePlayer( ...args );
const mountInlinePlayers = ( ...args: Parameters< InlinePlayerModule[ 'mountInlinePlayers' ] > ) =>
	mod.mountInlinePlayers( ...args );
const parsePlaceholderOptions = (
	...args: Parameters< InlinePlayerModule[ 'parsePlaceholderOptions' ] >
) => mod.parsePlaceholderOptions( ...args );
const warmConnections = () => mod.warmConnections();

beforeEach( () => {
	document.body.innerHTML = '';
	document.head.innerHTML = '';
	delete window.videopress;
	delete window.jetpackVideoPressInlinePlayer;
	loadModule();
} );

const SCRIPT = 'https://v0.wordpress.com/js/videojs/videopress.js?ver=1.0.0';
const STYLE = 'https://v0.wordpress.com/js/videojs/videopress.css?ver=1.0.0';

const placeholder = ( guid: string, options?: string, facade = false, poster = true ) => {
	const el = document.createElement( 'div' );
	el.className = 'jetpack-videopress-player__inline' + ( facade ? ' is-facade' : '' );
	el.dataset.videopressGuid = guid;
	if ( options !== undefined ) {
		el.dataset.videopressOptions = options;
	}
	if ( facade ) {
		el.setAttribute( 'data-videopress-facade', '1' );
		el.innerHTML =
			'<button type="button" class="jetpack-videopress-player__facade">' +
			( poster
				? '<img class="jetpack-videopress-player__facade-poster" src="https://example.com/p.jpg" alt="">'
				: '' ) +
			'<span class="jetpack-videopress-player__facade-scrim"></span>' +
			'<span class="jetpack-videopress-player__facade-play"></span></button>' +
			'<span class="jetpack-videopress-player__facade-spinner" role="status"><span></span></span>';
	}
	document.body.appendChild( el );
	return el;
};

const facadePoster = ( el: HTMLElement ) =>
	el.querySelector< HTMLImageElement >( '.jetpack-videopress-player__facade-poster' );

const settle = async () => {
	await Promise.resolve();
	await Promise.resolve();
};

const injectedScript = () =>
	Array.from( document.scripts ).find( s =>
		s.src.startsWith( 'https://v0.wordpress.com/js/videojs/videopress.js' )
	);

const finishLoading = async ( factory: jest.Mock ) => {
	window.videopress = factory;
	injectedScript()?.dispatchEvent( new Event( 'load' ) );
	// Let the promise chain settle.
	await Promise.resolve();
	await Promise.resolve();
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
		factory = jest.fn();
		window.videopress = factory;
	} );

	it( 'mounts one player per eager placeholder with its options', () => {
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

	it( 'does nothing without the player bundle or a way to fetch it', () => {
		delete window.videopress;
		placeholder( 'abcDEF12' );

		expect( mountInlinePlayers() ).toBe( 0 );
		expect( injectedScript() ).toBeUndefined();
	} );

	it( 'fetches the bundle for eager placeholders when it is not on the page yet', async () => {
		delete window.videopress;
		window.jetpackVideoPressInlinePlayer = { script: SCRIPT, style: STYLE };
		const el = placeholder( 'abcDEF12' );

		expect( mountInlinePlayers() ).toBe( 0 );
		expect( injectedScript() ).toBeDefined();

		await finishLoading( factory );

		expect( factory ).toHaveBeenCalledWith(
			'abcDEF12',
			el,
			expect.objectContaining( { fill: true } )
		);
	} );

	it( 'leaves facades alone until they are clicked, then autoplays the clicked one', async () => {
		delete window.videopress;
		window.jetpackVideoPressInlinePlayer = { script: SCRIPT, style: STYLE };
		const first = placeholder( 'abcDEF12', '{"muted":true}', true );
		const second = placeholder( 'ghiJKL34', undefined, true );

		expect( mountInlinePlayers() ).toBe( 0 );
		expect( injectedScript() ).toBeUndefined();
		expect( factory ).not.toHaveBeenCalled();

		const button = first.querySelector< HTMLElement >(
			'.jetpack-videopress-player__facade'
		) as HTMLElement;
		button.click();
		// The spinner is CSS-driven by this class, and stays until the player has mounted.
		expect( first ).toHaveClass( 'is-loading' );
		expect( first.querySelector( '.jetpack-videopress-player__facade-spinner' ) ).not.toBeNull();
		expect( injectedScript() ).toBeDefined();
		expect( document.querySelector( `link[rel="stylesheet"][href="${ STYLE }"]` ) ).not.toBeNull();

		await finishLoading( factory );

		expect( factory ).toHaveBeenCalledTimes( 1 );
		expect( factory ).toHaveBeenCalledWith(
			'abcDEF12',
			first,
			expect.objectContaining( { muted: true, autoPlay: true } )
		);
		expect( first.querySelector( '.jetpack-videopress-player__facade' ) ).toBeNull();
		expect( first.querySelector( '.jetpack-videopress-player__facade-spinner' ) ).toBeNull();
		expect( first ).not.toHaveClass( 'is-facade' );
		expect( first ).not.toHaveClass( 'is-loading' );
		// The other facade is untouched and still waits for its own click.
		expect( second.querySelector( '.jetpack-videopress-player__facade' ) ).not.toBeNull();

		( second.querySelector( '.jetpack-videopress-player__facade' ) as HTMLElement ).click();
		await Promise.resolve();
		await Promise.resolve();
		expect( factory ).toHaveBeenCalledTimes( 2 );
		expect( document.scripts ).toHaveLength( 1 );
	} );

	it( 'puts the play button back when the bundle fails to load', async () => {
		delete window.videopress;
		window.jetpackVideoPressInlinePlayer = { script: SCRIPT, style: STYLE };
		const el = placeholder( 'abcDEF12', undefined, true );
		mountInlinePlayers();

		( el.querySelector( '.jetpack-videopress-player__facade' ) as HTMLElement ).click();
		expect( el ).toHaveClass( 'is-loading' );
		injectedScript()?.dispatchEvent( new Event( 'error' ) );
		await settle();

		expect( el ).not.toHaveClass( 'is-loading' );
		expect( el ).toHaveClass( 'is-facade' );
		expect( el.querySelector( '.jetpack-videopress-player__facade-play' ) ).not.toBeNull();
	} );

	it( 'gives a facade without a poster one from the browser, ahead of the play glyph', async () => {
		window.jetpackVideoPressInlinePlayer = { script: SCRIPT, style: STYLE };
		resolvePoster.mockResolvedValue( 'https://example.com/resolved.jpg' );
		const el = placeholder( 'abcDEF12', undefined, true, false );
		const withPoster = placeholder( 'ghiJKL34', undefined, true );

		mountInlinePlayers();
		await settle();

		expect( resolvePoster ).toHaveBeenCalledTimes( 1 );
		expect( resolvePoster ).toHaveBeenCalledWith( 'abcDEF12' );
		const img = facadePoster( el ) as HTMLImageElement;
		expect( img.src ).toBe( 'https://example.com/resolved.jpg' );
		expect( img.alt ).toBe( '' );
		expect( img.nextElementSibling ).toHaveClass( 'jetpack-videopress-player__facade-scrim' );
		expect( injectedScript() ).toBeUndefined();
		// The server-rendered poster is left as it is.
		expect( facadePoster( withPoster )?.src ).toBe( 'https://example.com/p.jpg' );

		// Wiring the page again does not look the poster up twice.
		mountInlinePlayers();
		await settle();
		expect( resolvePoster ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'replaces a server-rendered poster that fails to load', async () => {
		window.jetpackVideoPressInlinePlayer = { script: SCRIPT, style: STYLE };
		resolvePoster.mockResolvedValue( 'https://example.com/resolved.jpg' );
		const el = placeholder( 'abcDEF12', undefined, true );
		mountInlinePlayers();
		expect( resolvePoster ).not.toHaveBeenCalled();

		( facadePoster( el ) as HTMLImageElement ).dispatchEvent( new Event( 'error' ) );
		await settle();

		expect( resolvePoster ).toHaveBeenCalledWith( 'abcDEF12' );
		expect( el.querySelectorAll( '.jetpack-videopress-player__facade-poster' ) ).toHaveLength( 1 );
		expect( facadePoster( el )?.src ).toBe( 'https://example.com/resolved.jpg' );
	} );

	it( 'leaves the facade bare when no poster can be found', async () => {
		window.jetpackVideoPressInlinePlayer = { script: SCRIPT, style: STYLE };
		const el = placeholder( 'abcDEF12', undefined, true, false );
		mountInlinePlayers();
		await settle();

		expect( resolvePoster ).toHaveBeenCalledTimes( 1 );
		expect( facadePoster( el ) ).toBeNull();
		expect( el.querySelector( '.jetpack-videopress-player__facade' ) ).not.toBeNull();
	} );

	it( 'does not add a poster to a facade that was played while the lookup ran', async () => {
		window.jetpackVideoPressInlinePlayer = { script: SCRIPT, style: STYLE };
		let finish: ( src: string ) => void = () => {};
		resolvePoster.mockReturnValue( new Promise( resolve => ( finish = resolve ) ) );
		const el = placeholder( 'abcDEF12', undefined, true, false );
		mountInlinePlayers();

		( el.querySelector( '.jetpack-videopress-player__facade' ) as HTMLElement ).click();
		await finishLoading( factory );
		expect( factory ).toHaveBeenCalledTimes( 1 );

		finish( 'https://example.com/resolved.jpg' );
		await settle();
		expect( el.querySelector( 'img' ) ).toBeNull();
	} );

	it( 'waits for a facade to come near the viewport before looking its poster up', async () => {
		window.jetpackVideoPressInlinePlayer = { script: SCRIPT, style: STYLE };
		resolvePoster.mockResolvedValue( 'https://example.com/resolved.jpg' );
		const observed: HTMLElement[] = [];
		let callback: ( entries: Array< { isIntersecting: boolean } > ) => void = () => {};
		const disconnect = jest.fn();
		class FakeObserver {
			constructor( cb: typeof callback, options: { rootMargin?: string } ) {
				callback = cb;
				expect( options.rootMargin ).toBe( '200px' );
			}
			observe( el: HTMLElement ) {
				observed.push( el );
			}
			disconnect = disconnect;
		}
		window.IntersectionObserver = FakeObserver as unknown as typeof IntersectionObserver;
		try {
			const el = placeholder( 'abcDEF12', undefined, true, false );
			mountInlinePlayers();
			expect( observed ).toEqual( [ el ] );
			expect( resolvePoster ).not.toHaveBeenCalled();

			callback( [ { isIntersecting: false } ] );
			expect( resolvePoster ).not.toHaveBeenCalled();

			callback( [ { isIntersecting: true } ] );
			await settle();
			expect( disconnect ).toHaveBeenCalled();
			expect( facadePoster( el )?.src ).toBe( 'https://example.com/resolved.jpg' );
		} finally {
			delete ( window as { IntersectionObserver?: unknown } ).IntersectionObserver;
		}
	} );

	it( 'warms connections once on the first hover over a facade', () => {
		window.jetpackVideoPressInlinePlayer = { script: SCRIPT, style: STYLE };
		const el = placeholder( 'abcDEF12', undefined, true );
		mountInlinePlayers();

		el.dispatchEvent( new Event( 'pointerenter' ) );
		el.dispatchEvent( new Event( 'focusin' ) );

		const preconnects = Array.from( document.querySelectorAll( 'link[rel="preconnect"]' ) ).map(
			l => l.getAttribute( 'href' )
		);
		expect( preconnects ).toEqual(
			expect.arrayContaining( [
				'https://public-api.wordpress.com',
				'https://videos.files.wordpress.com',
				'https://v0.wordpress.com',
			] )
		);
		expect( preconnects ).toHaveLength( 3 );
	} );
} );

describe( 'ensurePlayer', () => {
	beforeEach( () => {
		window.jetpackVideoPressInlinePlayer = { script: SCRIPT, style: STYLE };
	} );

	it( 'resolves immediately when the bundle already ran', async () => {
		const factory = jest.fn();
		window.videopress = factory;

		await expect( ensurePlayer() ).resolves.toBe( factory );
		expect( injectedScript() ).toBeUndefined();
	} );

	it( 'reuses a bundle tag PHP already printed instead of adding a second one', async () => {
		const existing = document.createElement( 'script' );
		existing.src = SCRIPT;
		document.head.appendChild( existing );
		const factory = jest.fn();

		const pending = ensurePlayer();
		expect( document.scripts ).toHaveLength( 1 );

		window.videopress = factory;
		existing.dispatchEvent( new Event( 'load' ) );
		await expect( pending ).resolves.toBe( factory );
	} );

	it( 'rejects when the bundle fails and allows a retry', async () => {
		const pending = ensurePlayer();
		injectedScript()?.dispatchEvent( new Event( 'error' ) );
		await expect( pending ).rejects.toThrow( 'failed to load' );

		const retry = ensurePlayer();
		expect( retry ).not.toBe( pending );
		retry.catch( () => {} );
	} );

	it( 'rejects without a configured bundle URL', async () => {
		delete window.jetpackVideoPressInlinePlayer;
		await expect( ensurePlayer() ).rejects.toThrow( 'no bundle URL' );
	} );
} );

describe( 'warmConnections', () => {
	it( 'is idempotent', () => {
		warmConnections();
		const before = document.querySelectorAll( 'link[rel="preconnect"]' ).length;
		expect( before ).toBeGreaterThan( 0 );
		warmConnections();
		expect( document.querySelectorAll( 'link[rel="preconnect"]' ) ).toHaveLength( before );
	} );
} );
