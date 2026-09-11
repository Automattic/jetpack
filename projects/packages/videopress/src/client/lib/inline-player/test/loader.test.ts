type LoaderModule = typeof import('../loader');

let loader: LoaderModule;
const loadLoader = () => {
	jest.resetModules();
	// eslint-disable-next-line @typescript-eslint/no-require-imports
	loader = require( '../loader' ) as LoaderModule;
};

const CONFIG = {
	script: 'https://v0.wordpress.com/js/videojs/videopress.js?ver=1.0.0',
	style: 'https://v0.wordpress.com/js/videojs/videopress.css?ver=1.0.0',
};

beforeEach( () => {
	document.body.innerHTML = '';
	document.head.innerHTML = '';
	delete window.videopress;
	delete window.jetpackVideoPressInlinePlayer;
	loadLoader();
} );

const frameDocument = () => {
	const iframe = document.createElement( 'iframe' );
	document.body.appendChild( iframe );
	return iframe.contentDocument as Document;
};

const bundleTag = ( doc: Document ) =>
	Array.from( doc.scripts ).find( s => s.src.startsWith( CONFIG.script.split( '?' )[ 0 ] ) );

describe( 'ensurePlayer', () => {
	it( 'loads the bundle into the given document and resolves that window’s factory', async () => {
		const doc = frameDocument();
		const factory = jest.fn();

		const promise = loader.ensurePlayer( doc, CONFIG );

		expect( bundleTag( doc ) ).toBeDefined();
		expect( bundleTag( document ) ).toBeUndefined();
		expect( doc.querySelector( `link[href="${ CONFIG.style }"]` ) ).not.toBeNull();

		( doc.defaultView as Window ).videopress = factory;
		bundleTag( doc )?.dispatchEvent( new Event( 'load' ) );
		await expect( promise ).resolves.toBe( factory );
	} );

	it( 'loads once per document', () => {
		const doc = frameDocument();

		loader.ensurePlayer( document, CONFIG );
		loader.ensurePlayer( document, CONFIG );
		loader.ensurePlayer( doc, CONFIG );

		expect( document.querySelectorAll( 'script' ) ).toHaveLength( 1 );
		expect( doc.querySelectorAll( 'script' ) ).toHaveLength( 1 );
	} );

	it( 'defaults to the page and the config PHP printed', async () => {
		window.jetpackVideoPressInlinePlayer = CONFIG;
		const factory = jest.fn();
		window.videopress = factory;

		await expect( loader.ensurePlayer() ).resolves.toBe( factory );
	} );
} );

describe( 'releasePlayerId', () => {
	it( 'renames the earlier holder in the container’s own document', () => {
		const doc = frameDocument();
		doc.body.innerHTML =
			'<div id="first"><div class="video-js" id="videopress-player-abcDEF12"><video id="videopress-player-abcDEF12_html5_api"></video></div></div><div id="second"></div>';
		document.body.insertAdjacentHTML( 'beforeend', '<div id="videopress-player-abcDEF12"></div>' );

		loader.releasePlayerId( 'abcDEF12', doc.getElementById( 'second' ) as HTMLElement );

		expect( doc.querySelector( '#first div.video-js' )?.id ).toBe( 'videopress-player-abcDEF12-2' );
		expect( doc.querySelector( '#first video' )?.id ).toBe(
			'videopress-player-abcDEF12-2_html5_api'
		);
		// The page’s own element is another document’s business.
		expect( document.getElementById( 'videopress-player-abcDEF12' ) ).not.toBeNull();
	} );

	it( 'leaves an element already inside the container alone', () => {
		document.body.innerHTML =
			'<div id="mine"><video id="videopress-player-abcDEF12"></video></div>';

		loader.releasePlayerId( 'abcDEF12', document.getElementById( 'mine' ) as HTMLElement );

		expect( document.querySelector( '#mine video' )?.id ).toBe( 'videopress-player-abcDEF12' );
	} );
} );
