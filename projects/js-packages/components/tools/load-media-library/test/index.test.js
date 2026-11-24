import { jest } from '@jest/globals';

// jsdom has no fetch to spy on.
global.fetch ??= () => Promise.reject( new Error( 'Not mocked' ) );

const MEDIA_VIEWS = '<script src="/media-views.js" id="media-views-js"></script>';
const TEMPLATES =
	'<script type="text/html" id="tmpl-media-modal"><div class="media-modal"></div></script>';

let loadMediaLibrary;
let failing;
let runs;

// Each dashboard bundles its own copy of the module.
const freshCopy = async () => {
	let copy;
	await jest.isolateModulesAsync( async () => {
		( { loadMediaLibrary: copy } = await import( '../index.ts' ) );
	} );
	return copy;
};

const respondWith = ( html, status = 200, success = true ) =>
	jest.spyOn( global, 'fetch' ).mockResolvedValue( {
		ok: status === 200,
		status,
		json: () => Promise.resolve( status === 200 ? { success, data: { html } } : {} ),
	} );

beforeEach( async () => {
	document.head.innerHTML = '';
	document.body.innerHTML = '';
	delete window.wp;
	delete window[ Symbol.for( 'jetpack.media-library' ) ];
	window.ajaxurl = '/wp-admin/admin-ajax.php';
	window.mediaLibraryTestOrder = [];
	failing = new Set();
	runs = {};
	loadMediaLibrary = await freshCopy();
	// jsdom doesn't download scripts: "run" media-views and report the load once it is added.
	const append = document.head.append.bind( document.head );
	jest.spyOn( document.head, 'append' ).mockImplementation( node => {
		append( node );
		const url = node.src || node.href;
		if ( url ) {
			runs[ node.id ] = ( runs[ node.id ] ?? 0 ) + 1;
			setTimeout( () => {
				if ( failing.has( node.getAttribute( 'src' ) || node.getAttribute( 'href' ) ) ) {
					node.dispatchEvent( new Event( 'error' ) );
					return;
				}
				if ( node.id === 'media-views-js' ) {
					window.wp = { media: Object.assign( () => {}, { view: { MediaFrame: {} } } ) };
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
	} );

	const CONCATENATED =
		'<link rel="stylesheet" href="/wp-admin/load-styles.php?c=0&amp;load%5Bchunk_0%5D=dashicons,buttons" />' +
		'<script src="/wp-admin/load-scripts.php?c=0&amp;load%5Bchunk_0%5D=jquery-core,unders&amp;load%5Bchunk_1%5D=core,backbone"></script>';

	it.each( [
		[
			'the handle list',
			'{"scripts":["jquery-core","utils"],"styles":["common"]}',
			'jquery-core,utils',
			'common',
		],
		[
			'load-scripts.php when it lists none',
			null,
			'jquery-core,underscore,backbone',
			'dashicons,buttons',
		],
	] )(
		'tells the endpoint which handles the page loaded, from %s, since concatenated tags carry no id',
		async ( _, list, scripts, styles ) => {
			document.head.innerHTML =
				CONCATENATED +
				( list
					? `<script type="application/json" id="jetpack-page-handles">${ list }</script>`
					: '' );
			respondWith( `${ MEDIA_VIEWS }${ TEMPLATES }` );

			await loadMediaLibrary();

			const [ url, { body } ] = global.fetch.mock.calls[ 0 ];
			expect( Object.fromEntries( new URL( String( url ) ).searchParams ) ).toEqual( {
				action: 'jetpack_media_library',
			} );
			expect( Object.fromEntries( body ) ).toEqual( { scripts, styles } );
		}
	);

	it( 'skips what the page already has, and fetches nothing once the library is ready', async () => {
		document.head.innerHTML = '<script id="jquery-core-js"></script>';
		respondWith(
			`<script src="/jquery.js" id="jquery-core-js"></script>${ MEDIA_VIEWS }${ TEMPLATES }`
		);

		await loadMediaLibrary();
		await loadMediaLibrary();

		expect( document.querySelectorAll( '#jquery-core-js' ) ).toHaveLength( 1 );
		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
	} );

	it( "keeps the page's jQuery when the page loaded it with no id", async () => {
		const pageJQuery = () => {};
		window.jQuery = pageJQuery;
		respondWith(
			`<script src="/jquery.js" id="jquery-core-js"></script>${ MEDIA_VIEWS }${ TEMPLATES }`
		);

		await loadMediaLibrary();

		expect( runs[ 'jquery-core-js' ] ).toBeUndefined();
		delete window.jQuery;
	} );

	it( 'shares one load between dashboards that bundle their own copy', async () => {
		respondWith( `${ MEDIA_VIEWS }${ TEMPLATES }` );

		const otherCopy = await freshCopy();
		await Promise.all( [ loadMediaLibrary(), otherCopy() ] );

		expect( global.fetch ).toHaveBeenCalledTimes( 1 );
		expect( runs[ 'media-views-js' ] ).toBe( 1 );
	} );

	it( 'rejects when a script fails to load, and runs every script again on the next call', async () => {
		failing.add( '/media-views.js' );
		respondWith( `<script src="/utils.js" id="utils-js"></script>${ MEDIA_VIEWS }${ TEMPLATES }` );

		await expect( loadMediaLibrary() ).rejects.toThrow( 'could not load /media-views.js' );

		failing.clear();
		await expect( loadMediaLibrary() ).resolves.toBeUndefined();
		expect( runs ).toEqual( { 'utils-js': 2, 'media-views-js': 2 } );
		expect( document.querySelectorAll( '#utils-js' ) ).toHaveLength( 1 );
	} );

	it( 'loads the library even when a stylesheet fails', async () => {
		failing.add( '/media-views.css' );
		respondWith(
			`<link rel="stylesheet" id="media-views-css" href="/media-views.css" />${ MEDIA_VIEWS }${ TEMPLATES }`
		);

		await expect( loadMediaLibrary() ).resolves.toBeUndefined();
	} );

	it.each( [
		[ 'the endpoint fails', 403, true, `${ MEDIA_VIEWS }${ TEMPLATES }`, 'HTTP 403' ],
		[ 'the endpoint reports failure', 200, false, '', 'HTTP 200' ],
		[ 'the scripts leave wp.media undefined', 200, true, TEMPLATES, 'wp.media is not defined' ],
	] )( 'rejects when %s', async ( _, status, success, html, message ) => {
		respondWith( html, status, success );

		await expect( loadMediaLibrary() ).rejects.toThrow( message );
	} );

	it( 'refuses an ajaxurl on another origin, whose scripts would run on this page', async () => {
		respondWith( `${ MEDIA_VIEWS }${ TEMPLATES }` );
		window.ajaxurl = 'https://example.com/wp-admin/admin-ajax.php';

		await expect( loadMediaLibrary() ).rejects.toThrow( 'another origin' );
		expect( global.fetch ).not.toHaveBeenCalled();
	} );
} );
