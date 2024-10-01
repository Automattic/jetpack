const path = require( 'path' );
const { chromium } = require( 'playwright' );
const { generateCriticalCSS, BrowserInterfaceIframe } = require( '../../build/browser.js' );
const { dataDirectory } = require( '../lib/data-directory.js' );
const TestServer = require( '../lib/test-server.js' );

let testServer = null;
let browser;

describe( 'Iframe interface', () => {
	// Start test server to serve wrapped content.
	beforeAll( async () => {
		testServer = new TestServer( {
			'page-a': path.join( dataDirectory, 'page-a' ),
		} );
		await testServer.start();

		browser = await chromium.launch();
	} );

	// Kill test server.
	afterAll( async () => {
		if ( testServer ) {
			await testServer.stop();
			testServer = null;
		}
		if ( browser ) {
			await browser.close();
		}
	} );

	it( 'Successfully generates via iframes', async () => {
		const page = await browser.newPage();
		page.on( 'console', msg => process.stderr.write( msg.text() + '\n\n' ) );
		await page.goto( testServer.getUrl() );

		const innerUrl = path.join( testServer.getUrl(), 'page-a' );

		const [ css, warnings ] = await page.evaluate( url => {
			return generateCriticalCSS( {
				urls: [ url ],
				viewports: [ { width: 640, height: 480 } ],
				browserInterface: new BrowserInterfaceIframe( {
					verifyPage: ( _url, innerWindow, innerDocument ) => {
						return !! innerDocument.querySelector( 'meta[name="testing-page"]' );
					},
				} ),
			} );
		}, innerUrl );

		expect( warnings ).toHaveLength( 0 );
		expect( css ).toContain( 'div.top' );

		await page.close();
	} );

	// eslint-disable-next-line jest/expect-expect
	it( 'Allows scripts if not explicitly turned off', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		const innerUrl = path.join( testServer.getUrl(), 'page-a' );

		// Will throw an error if the inner page does not contain
		// 'script-created-content'; a string appended to page-a by a script.
		await page.evaluate( async url => {
			const iframeInterface = new BrowserInterfaceIframe( {
				verifyPage: ( _url, innerWindow, innerDocument ) => {
					return innerDocument.documentElement.innerHTML.includes( 'script-created-content' );
				},
			} );

			await iframeInterface.loadPage( url );
		}, innerUrl );

		await page.close();
	} );

	// eslint-disable-next-line jest/expect-expect
	it( 'Blocks scripts if turned off', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		const innerUrl = path.join( testServer.getUrl(), 'page-a' );

		// Will throw an error if the inner page contains
		// 'script-created-content'; a string appended to page-a by a script.
		await page.evaluate( async url => {
			const iframeInterface = new BrowserInterfaceIframe( {
				verifyPage: ( _url, innerWindow, innerDocument ) => {
					return ! innerDocument.documentElement.innerHTML.includes( 'script-created-content' );
				},
				allowScripts: false,
			} );

			await iframeInterface.loadPage( url );
		}, innerUrl );

		await page.close();
	} );

	it( 'Can successfully generate using an iframe with JavaScript off', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		const innerUrl = path.join( testServer.getUrl(), 'page-a' );

		const [ css, warnings ] = await page.evaluate( url => {
			return generateCriticalCSS( {
				urls: [ url ],
				viewports: [ { width: 640, height: 480 } ],
				browserInterface: new BrowserInterfaceIframe( {
					verifyPage: ( _url, innerWindow, innerDocument ) => {
						return !! innerDocument.querySelector( 'meta[name="testing-page"]' );
					},
					allowScripts: false,
				} ),
			} );
		}, innerUrl );

		expect( warnings ).toHaveLength( 0 );
		expect( css ).toContain( 'div.top' );

		await page.close();
	} );

	it( 'Throws an error if a successRatio is not met', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		await expect( async () => {
			await page.evaluate( () => {
				return generateCriticalCSS( {
					urls: [ 'about:blank', 'about:blank' ],
					viewports: [ { width: 640, height: 480 } ],
					browserInterface: new BrowserInterfaceIframe( {
						verifyPage: () => false,
					} ),
					successRatio: 0.5,
				} );
			} );
		} ).rejects.toThrow( /Insufficient pages loaded/ );

		await page.close();
	} );

	it( 'Does not throw an error if successRatio is met', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		const innerUrl = path.join( testServer.getUrl(), 'page-a' );

		const [ css, warnings ] = await page.evaluate( url => {
			return generateCriticalCSS( {
				urls: [ 'about:blank', url ],
				viewports: [ { width: 640, height: 480 } ],
				browserInterface: new BrowserInterfaceIframe( {
					verifyPage: ( _url, innerWindow, innerDocument ) => {
						return !! innerDocument.querySelector( 'meta[name="testing-page"]' );
					},
				} ),
				successRatio: 0.5,
			} );
		}, innerUrl );

		expect( warnings ).toHaveLength( 0 );
		expect( css ).toContain( 'div.top' );

		await page.close();
	} );

	it( 'Does not load more pages than the maxPages specifies', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		const pageA = path.join( testServer.getUrl(), 'page-a' );
		const pageB = path.join( testServer.getUrl(), 'page-b' );

		const result = await page.evaluate(
			async ( { pA, pB } ) => {
				const pagesVerified = [];
				const criticalCSSResult = await generateCriticalCSS( {
					urls: [ 'about:blank', pA, pB, 'about:blank' ],
					viewports: [ { width: 640, height: 480 } ],
					browserInterface: new BrowserInterfaceIframe( {
						verifyPage: ( url, innerWindow, innerDocument ) => {
							pagesVerified.push( url );
							return !! innerDocument.querySelector( 'meta[name="testing-page"]' );
						},
					} ),
					successRatio: 0.25,
					maxPages: 1,
				} );

				return {
					css: criticalCSSResult[ 0 ],
					warnings: criticalCSSResult[ 1 ],
					pagesVerified,
				};
			},
			{ pA: pageA, pB: pageB }
		);

		expect( result.pagesVerified ).not.toContain( pageB );
		expect( result.warnings ).toHaveLength( 0 );
		expect( result.css ).toContain( 'div.top' );

		await page.close();
	} );
} );
