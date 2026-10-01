const path = require( 'path' );
const csstree = require( 'css-tree' );
const { chromium } = require( 'playwright' );
const dedupe = require( '../../build/deduplicate-css.js' );
const { deduplicateCss } = dedupe;
const { minifyCss } = require( '../../build/minify-css.js' );
const { generateCriticalCSS, BrowserInterfacePlaywright } = require( '../../build/playwright.js' );
const { dataDirectory } = require( '../lib/data-directory.js' );
const mockFetch = require( '../lib/mock-fetch.js' );
const TestServer = require( '../lib/test-server.js' );

let testServer = null;

let testPageUrls;
let browser;

class MockedFetchInterface extends BrowserInterfacePlaywright {
	fetch( url, options ) {
		return mockFetch( url, options );
	}
}

const testPages = {};

/**
 * Run a batch of CSS generation test runs, verify the results contain (and do not contain) specific substrings.
 * Verifies no warnings get generated.
 *
 * @param {Object[]} testSets - Sets of tests to run, and strings the result should / should not contain.
 */
async function runTestSet( testSets ) {
	for ( const { urls, viewports, shouldContain, shouldNotContain, shouldMatch } of testSets ) {
		const urlsToGenerateFor = urls || Object.values( testPageUrls );
		const [ css, warnings ] = await generateCriticalCSS( {
			urls: urlsToGenerateFor,
			viewports: viewports || [ { width: 640, height: 480 } ],
			browserInterface: new MockedFetchInterface( browser, urlsToGenerateFor ),
		} );

		expect( warnings ).toHaveLength( 0 );

		for ( const should of shouldContain || [] ) {
			expect( css ).toContain( should );
		}

		for ( const shouldNot of shouldNotContain || [] ) {
			expect( css ).not.toContain( shouldNot );
		}

		for ( const regexp of shouldMatch || [] ) {
			expect( css ).toMatch( regexp );
		}
	}
}

describe( 'Generate Critical CSS', () => {
	// Open test pages in tabs ready for tests.
	beforeAll( async () => {
		testServer = new TestServer( {
			'page-a': path.resolve( dataDirectory, 'page-a' ),
		} );
		await testServer.start();

		testPageUrls = {
			pageA: testServer.getUrl() + '/page-a/',
		};

		browser = await chromium.launch();

		for ( const url of Object.values( testPageUrls ) ) {
			testPages[ url ] = await browser.newPage();
			await testPages[ url ].goto( url );
		}
	} );

	// Clean up test pages.
	afterAll( async () => {
		for ( const page of Object.values( testPages ) ) {
			await page.close();
		}
		if ( browser ) {
			await browser.close();
		}
		if ( testServer ) {
			await testServer.stop();
		}
	} );

	describe( 'Inclusions and Exclusions', () => {
		it.each( [
			[ 'ordinary rules', '', '' ],
			[ 'layer block', '', '@layer base{div.top{margin:0}}' ],
			[ 'layer statement', '@layer reset,base;', '' ],
			[ 'container', '', '@container (min-width:400px){div.top{gap:1px}}' ],
			[ 'empty container', '', '@container (min-width:400px){.unused-x{gap:1px}}' ],
			[ 'property', '', "@property --x{syntax:'<length>';inherits:false;initial-value:0}" ],
			[ 'page', '', '@page{margin:1cm}' ],
			[ 'vendor viewport', '@-ms-viewport{width:device-width}', '' ],
			[ 'vendor document', '', '@-moz-document url-prefix(){div.top{color:red}}' ],
			[ 'counter-style', '', '@counter-style x{system:cyclic;symbols:"-"}' ],
			[ 'namespace', '@namespace svg url(http://www.w3.org/2000/svg);', '' ],
			[ 'scope', '', '@scope (div.top){div.top{color:blue}}' ],
			[ 'starting-style', '', '@starting-style{div.top{opacity:0}}' ],
			[ 'nested at-rule', '', 'div.top{color:red;@media (min-width:1px){color:blue}}' ],
			[ 'nested rule', '', 'div.top{color:red;.top{color:blue}}' ],
			[ 'stray brace', '', '}.top{color:green}' ],
			[ 'pruned keyframes', '', '@keyframes spin{from{opacity:0}to{opacity:1}}' ],
			[ 'pruned print media', '', '@media print{div.top{color:#000}}' ],
			[ 'escaped import', '@\\69mport url(x.css);', '' ],
			[ 'pruned import and charset', '@charset "utf-8";@import url(x.css);', '' ],
		] )(
			'Deduplicates overlapping sources containing %s after pruning',
			async ( _name, prefix, suffix ) => {
				const shared =
					prefix +
					'@font-face{font-family:Fixture;src:url(/fixture.woff2)}' +
					'@custom-media --small (width<700px);' +
					'div.top{color:red;background:white;font-family:Fixture}@media screen{div.top{padding:8px}}' +
					'@supports(display:grid){div.top{display:grid}}' +
					suffix;
				class CombinedInterface extends MockedFetchInterface {
					async getCssIncludes( url ) {
						return {
							[ '/combined.css' + new URL( url ).search ]: {
								media: _name === 'escaped import' ? '' : 'all',
							},
						};
					}
					async getInternalStyles() {
						return '';
					}
					async fetch( url ) {
						const page = new URL( url ).searchParams.get( 'copy' );
						return { ok: true, text: async () => shared + `.unused-${ page }{color:blue}` };
					}
				}
				const urls = Array.from( { length: 10 }, ( _, i ) => testPageUrls.pageA + '?copy=' + i );
				const generate = pages =>
					generateCriticalCSS( {
						urls: pages,
						viewports: [ { width: 640, height: 480 } ],
						browserInterface: new CombinedInterface( browser, pages ),
					} );
				const [ single, singleWarnings ] = await generate( urls.slice( 0, 1 ) );
				const [ combined, warnings ] = await generate( urls );
				expect( singleWarnings ).toHaveLength( 0 );
				expect( warnings ).toHaveLength( 0 );
				expect( single ).toContain( 'div.top' );
				expect( combined ).toBe( single );
				expect( combined ).not.toContain( '.unused-' );
				expect( combined ).not.toContain( 'x.css' );
			}
		);

		it( 'Preserves the cascade across overrides, conditional contexts and layer registration', async () => {
			const css =
				'@layer alpha{.top{color:red}}@layer beta{.top{color:blue}}' +
				'@layer alpha{.top{color:red}}' +
				'.top{background:red}.top{background:blue}.top{background:red}' +
				'@media(min-width:700px){.top{padding:8px}}' +
				'@media(min-width:700px){.top{padding:16px}}' +
				'@media(min-width:700px){.top{padding:8px}}' +
				'@media(max-width:699px){.top{padding:16px}}';
			const deduplicated = deduplicateCss( css );
			expect( deduplicated.length ).toBeLessThan( css.length );
			expect( deduplicated ).toContain( '@layer alpha;' );

			const page = await browser.newPage();
			try {
				await page.setContent( '<style></style><div class="top">Test</div>' );
				for ( const width of [ 640, 1200 ] ) {
					await page.setViewportSize( { width, height: 800 } );
					const measure = styles =>
						page.evaluate( text => {
							document.querySelector( 'style' ).textContent = text;
							const computed = getComputedStyle( document.querySelector( '.top' ) );
							return [ computed.color, computed.backgroundColor, computed.padding ];
						}, styles );
					for ( const input of [
						css,
						'@media(min-width:700px){.top{padding:8px}}@media(max-width:699px){.top{padding:8px}}',
						'@media(min-width:700px){@layer alpha{.top{color:red}}}@layer beta{.top{color:blue}}@layer alpha{.top{color:red}}',
						'@layer alpha{.top{color:red}}@layer alpha{.top{color:green}}@layer alpha{.top{color:red}}',
						'@layer{.top{color:red!important}}@layer{.top{color:blue!important}}@layer{.top{color:red!important}}',
						'.top{@layer alpha{color:red}}.top{@layer beta{color:blue}}.top{@layer alpha{color:red}}',
						'@layer a\\,b{.top{color:red}}@layer b;@layer c{.top{color:blue}}@layer b{.top{color:green}}',
						'@namespace svg url(http://www.w3.org/2000/svg);@namespace svg url(http://www.w3.org/2000/svg);.top{color:red}',
					] ) {
						const original = await measure( input );
						await expect( measure( deduplicateCss( input ) ) ).resolves.toEqual( original );
					}
				}
			} finally {
				await page.close();
			}
		} );

		it( 'Preserves the valid namespace header in its original order', () => {
			const namespaceHeader =
				'@namespace svg url(http://www.w3.org/2000/svg);@namespace svg url(urn:other);@namespace svg url(http://www.w3.org/2000/svg);';
			expect( deduplicateCss( namespaceHeader + '.top{color:red}' ) ).toBe(
				namespaceHeader + '.top{color:red}'
			);
		} );

		it( 'Handles long layer names and conditional preludes without repeating context keys per rule', () => {
			const rules = Array.from( { length: 5000 }, ( _, i ) => `.x${ i }{color:red}` ).join( '' );
			for ( const context of [
				'@layer L' + 'x'.repeat( 16400 ),
				'@media (' + 'x'.repeat( 16000 ) + ')',
			] ) {
				const [ input ] = minifyCss( `${ context }{${ rules }}` );
				const start = performance.now();
				const output = deduplicateCss( input );
				expect( performance.now() - start ).toBeLessThan( 3000 );
				expect( output.match( /\.x\d+\{/g ) ).toHaveLength( 5000 );
			}
			const dotted = '@layer ' + Array( 25000 ).fill( 'x' ).join( '.' );
			expect( deduplicateCss( `${ dotted }{.top{color:red}}` ) ).toContain( '.top{color:red}' );
		} );

		it( 'Does not register names from invalid layer block preludes', () => {
			for ( const prelude of [ 'a,,b', ',a', '1' ] ) {
				const css = `@layer ${ prelude }{.top{color:red}}`;
				expect( deduplicateCss( css ) ).toBe( csstree.generate( csstree.parse( css ) ) );
			}
		} );

		it( 'Falls back to the minified join and reports a deduplication failure', async () => {
			const spy = jest.spyOn( dedupe, 'deduplicateCss' ).mockImplementation( () => {
				throw new Error( 'Parser failure' );
			} );
			try {
				const [ css, warnings ] = await generateCriticalCSS( {
					urls: [ testPageUrls.pageA ],
					viewports: [ { width: 640, height: 480 } ],
					browserInterface: new MockedFetchInterface( browser, [ testPageUrls.pageA ] ),
				} );
				expect( css ).toContain( 'div.top' );
				expect( warnings.map( error => error.message ) ).toContain( 'Parser failure' );
			} finally {
				spy.mockRestore();
			}
		} );

		// eslint-disable-next-line jest/expect-expect
		it( 'Excludes elements below the fold', async () => {
			await runTestSet( [
				{
					viewports: [ { width: 640, height: 480 } ],
					shouldContain: [ 'div.top' ],
					shouldNotContain: [ 'div.four_eighty', 'div.six_hundred', 'div.seven_sixty_eight' ],
				},

				{
					viewports: [ { width: 800, height: 600 } ],
					shouldContain: [ 'div.top', 'div.four_eighty' ],
					shouldNotContain: [ 'div.eight_hundred', 'div.seven_sixty_eight' ],
				},
			] );
		} );

		// eslint-disable-next-line jest/expect-expect
		it( 'Excludes irrelevant media queries', async () => {
			await runTestSet( [
				{
					shouldContain: [ '@media screen', '@media all' ],
					shouldNotContain: [ '@media print', '@media not screen' ],
				},
			] );
		} );

		// eslint-disable-next-line jest/expect-expect
		it( 'Excludes Critical CSS from a <link media="print"> tag', async () => {
			await runTestSet( [
				{
					shouldNotContain: [ 'sir_not_appearing_in_this_film' ],
				},
			] );
		} );

		// eslint-disable-next-line jest/expect-expect
		it( 'Includes implicit @media rules inherited from <link> tags', async () => {
			await runTestSet( [
				{
					shouldMatch: [ /@media\s+\(\s*min-width:\s*50px\s*\)\s*{\s*@media\s+screen\s*{/ ],
				},
			] );
		} );

		// eslint-disable-next-line jest/expect-expect
		it( 'Can manage complex implicit @media rules inherited from <link> tags', async () => {
			await runTestSet( [
				{
					shouldContain: [
						'@media only screen and (max-device-width:480px) and (orientation:landscape){div.complex_media_rules{',
					],
				},
			] );
		} );
	} );
} );
