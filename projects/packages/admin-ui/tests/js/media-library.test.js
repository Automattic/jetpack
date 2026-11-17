// jsdom has no fetch to spy on.
global.fetch ??= () => Promise.reject( new Error( 'Not mocked' ) );

const MEDIA_VIEWS = '<script src="/media-views.js" id="media-views-js"></script>';
const TEMPLATES =
	'<script type="text/html" id="tmpl-media-modal"><div class="media-modal"></div></script>';

let loadMediaLibrary;
let failing;

const respondWith = ( html, status = 200 ) =>
	jest.spyOn( global, 'fetch' ).mockResolvedValue( {
		ok: status === 200,
		status,
		json: () => Promise.resolve( status === 200 ? { success: true, data: { html } } : {} ),
	} );

beforeEach( () => {
	document.head.innerHTML = '';
	document.body.innerHTML = '';
	delete window.wp;
	window.ajaxurl = '/wp-admin/admin-ajax.php';
	window.mediaLibraryTestOrder = [];
	failing = new Set();
	jest.isolateModules( () => {
		( { loadMediaLibrary } = require( '../../src/media-library' ) );
	} );
	// jsdom doesn't download scripts: "run" media-views and report the load once it is added.
	const append = document.head.append.bind( document.head );
	jest.spyOn( document.head, 'append' ).mockImplementation( node => {
		append( node );
		const url = node.src || node.href;
		if ( url ) {
			setTimeout( () => {
				if ( failing.has( node.getAttribute( 'src' ) ) ) {
					node.dispatchEvent( new Event( 'error' ) );
					return;
				}
				if ( node.id === 'media-views-js' ) {
					window.wp = { media: () => {} };
				}
				node.dispatchEvent( new Event( 'load' ) );
			} );
		}
	} );
} );

afterEach( () => {
	jest.restoreAllMocks();
} );

describe( 'loadMediaLibrary', () => {
	it( 'runs an inline script only after the scripts printed before it have loaded', async () => {
		respondWith(
			`${ MEDIA_VIEWS }<script>window.mediaLibraryTestOrder.push( typeof window.wp?.media );</script>${ TEMPLATES }`
		);

		await loadMediaLibrary();

		expect( window.mediaLibraryTestOrder ).toEqual( [ 'function' ] );
		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
		expect( String( global.fetch.mock.calls[ 0 ][ 0 ] ) ).toBe(
			'http://localhost/wp-admin/admin-ajax.php?action=jetpack_media_library'
		);
	} );

	it( 'skips what the page already has, and fetches nothing once the library is ready', async () => {
		document.head.innerHTML = '<script id="jquery-core-js"></script>';
		respondWith(
			`<script src="/jquery.js" id="jquery-core-js"></script>${ MEDIA_VIEWS }${ TEMPLATES }`
		);

		await Promise.all( [ loadMediaLibrary(), loadMediaLibrary() ] );
		await loadMediaLibrary();

		expect( document.querySelectorAll( '#jquery-core-js' ) ).toHaveLength( 1 );
		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'rejects when a script fails to load, and loads it on the next call', async () => {
		failing.add( '/media-views.js' );
		respondWith( `${ MEDIA_VIEWS }${ TEMPLATES }` );

		await expect( loadMediaLibrary() ).rejects.toThrow( 'could not load /media-views.js' );

		failing.clear();
		await expect( loadMediaLibrary() ).resolves.toBeUndefined();
		expect( document.querySelectorAll( '#media-views-js' ) ).toHaveLength( 1 );
	} );

	it.each( [
		[ 'the endpoint fails', 403, `${ MEDIA_VIEWS }${ TEMPLATES }`, 'HTTP 403' ],
		[ 'the scripts leave wp.media undefined', 200, TEMPLATES, 'wp.media is not defined' ],
	] )( 'rejects when %s', async ( _, status, html, message ) => {
		respondWith( html, status );

		await expect( loadMediaLibrary() ).rejects.toThrow( message );
	} );
} );
