/* global CriticalCSSGenerator */
const puppeteer = require( 'puppeteer' );

const path = require( 'path' );
const TestServer = require( '../lib/test-server' );
const { dataDirectory } = require( '../lib/data-directory' );

let testServer = null;
let browser;

describe( 'Iframe interface', () => {
	// Start test server to serve wrapped content.
	beforeAll( async () => {
		testServer = new TestServer( {
			'page-a': path.join( dataDirectory, 'page-a' ),
		} );
		await testServer.start();

		browser = await puppeteer.launch();
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
			return CriticalCSSGenerator.generateCriticalCSS( {
				urls: [ url ],
				viewports: [ { width: 640, height: 480 } ],
				browserInterface: new CriticalCSSGenerator.BrowserInterfaceIframe( {
					verifyPage: ( url, innerWindow, innerDocument ) => {
						return !! innerDocument.querySelector( 'meta[name="testing-page"]' );
					},
				} ),
			} );
		}, innerUrl );

		expect( warnings ).toHaveLength( 0 );
		expect( css ).toContain( 'div.top' );

		await page.close();
	} );

	it( 'Allows scripts if not explicitly turned off', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		const innerUrl = path.join( testServer.getUrl(), 'page-a' );

		// Will throw an error if the inner page does not contain
		// 'script-created-content'; a string appended to page-a by a script.
		await page.evaluate( async url => {
			const iframeInterface = new CriticalCSSGenerator.BrowserInterfaceIframe( {
				verifyPage: ( url, innerWindow, innerDocument ) => {
					return innerDocument.documentElement.innerHTML.includes( 'script-created-content' );
				},
			} );

			await iframeInterface.loadPage( url );
		}, innerUrl );

		await page.close();
	} );

	it( 'Blocks scripts if turned off', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		const innerUrl = path.join( testServer.getUrl(), 'page-a' );

		// Will throw an error if the inner page contains
		// 'script-created-content'; a string appended to page-a by a script.
		await page.evaluate( async url => {
			const iframeInterface = new CriticalCSSGenerator.BrowserInterfaceIframe( {
				verifyPage: ( url, innerWindow, innerDocument ) => {
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
			return CriticalCSSGenerator.generateCriticalCSS( {
				urls: [ url ],
				viewports: [ { width: 640, height: 480 } ],
				browserInterface: new CriticalCSSGenerator.BrowserInterfaceIframe( {
					verifyPage: ( url, innerWindow, innerDocument ) => {
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

		const innerUrl = path.join( testServer.getUrl(), 'page-a' );

		await expect( async () => {
			await page.evaluate( () => {
				return CriticalCSSGenerator.generateCriticalCSS( {
					urls: [ 'about:blank', 'about:blank' ],
					viewports: [ { width: 640, height: 480 } ],
					browserInterface: new CriticalCSSGenerator.BrowserInterfaceIframe( {
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
			return CriticalCSSGenerator.generateCriticalCSS( {
				urls: [ 'about:blank', url ],
				viewports: [ { width: 640, height: 480 } ],
				browserInterface: new CriticalCSSGenerator.BrowserInterfaceIframe( {
					verifyPage: ( url, innerWindow, innerDocument ) => {
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

		const [ css, warnings, pages ] = await page.evaluate(
			async ( pageA, pageB ) => {
				let pagesVerified = [];
				const result = await CriticalCSSGenerator.generateCriticalCSS( {
					urls: [ 'about:blank', pageA, pageB, 'about:blank' ],
					viewports: [ { width: 640, height: 480 } ],
					browserInterface: new CriticalCSSGenerator.BrowserInterfaceIframe( {
						verifyPage: ( url, innerWindow, innerDocument ) => {
							pagesVerified.push( url );
							return !! innerDocument.querySelector( 'meta[name="testing-page"]' );
						},
					} ),
					successRatio: 0.25,
					maxPages: 1,
				} );

				return [ ...result, pagesVerified ];
			},
			pageA,
			pageB
		);

		expect( pages ).not.toContain( pageB );
		expect( warnings ).toHaveLength( 0 );
		expect( css ).toContain( 'div.top' );

		await page.close();
	} );
} );
