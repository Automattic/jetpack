type InlinePlayerModule = typeof import('../index');

// The module caches the bundle promise and the preconnect state; every test starts from a fresh copy.
let mod: InlinePlayerModule;
const loadModule = () => {
	jest.resetModules();
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	mod = require( '../index' ) as InlinePlayerModule;
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

const placeholder = ( guid: string, options?: string, facade = false ) => {
	const el = document.createElement( 'div' );
	el.className = 'jetpack-videopress-player__inline' + ( facade ? ' is-facade' : '' );
	el.dataset.videopressGuid = guid;
	if ( options !== undefined ) {
		el.dataset.videopressOptions = options;
	}
	if ( facade ) {
		el.setAttribute( 'data-videopress-facade', '1' );
		el.innerHTML =
			'<button type="button" class="jetpack-videopress-player__facade"><img class="jetpack-videopress-player__facade-poster" src="https://example.com/p.jpg" alt=""><span class="jetpack-videopress-player__facade-play"></span></button>';
	}
	document.body.appendChild( el );
	return el;
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
		expect( button ).toHaveClass( 'is-loading' );
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
		expect( first ).not.toHaveClass( 'is-facade' );
		// The other facade is untouched and still waits for its own click.
		expect( second.querySelector( '.jetpack-videopress-player__facade' ) ).not.toBeNull();

		( second.querySelector( '.jetpack-videopress-player__facade' ) as HTMLElement ).click();
		await Promise.resolve();
		await Promise.resolve();
		expect( factory ).toHaveBeenCalledTimes( 2 );
		expect( document.scripts ).toHaveLength( 1 );
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
