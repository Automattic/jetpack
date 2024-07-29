const path = require( 'path' );
const { chromium } = require( 'playwright' );
const {
	generateCriticalCSS,
	BrowserInterfacePlaywright,
} = require( '../../build-node/back-end.js' );
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
