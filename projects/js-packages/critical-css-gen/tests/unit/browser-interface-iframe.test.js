/* global CriticalCSSGenerator */
const path = require( 'path' );
const { chromium } = require( 'playwright' );
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
			return CriticalCSSGenerator.generateCriticalCSS( {
				urls: [ url ],
				viewports: [ { width: 640, height: 480 } ],
				browserInterface: new CriticalCSSGenerator.BrowserInterfaceIframe( {
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
			const iframeInterface = new CriticalCSSGenerator.BrowserInterfaceIframe( {
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
			const iframeInterface = new CriticalCSSGenerator.BrowserInterfaceIframe( {
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
			return CriticalCSSGenerator.generateCriticalCSS( {
				urls: [ url ],
				viewports: [ { width: 640, height: 480 } ],
				browserInterface: new CriticalCSSGenerator.BrowserInterfaceIframe( {
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
				const criticalCSSResult = await CriticalCSSGenerator.generateCriticalCSS( {
					urls: [ 'about:blank', pA, pB, 'about:blank' ],
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

	// A status check that never answers used to clear the load timeout and wait without limit.
	it( 'times out a page whose status check never answers', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		const innerUrl = path.join( testServer.getUrl(), 'page-a' );

		const result = await page.evaluate( async url => {
			window.fetch = ( _url, options ) =>
				new Promise( ( _resolve, reject ) =>
					options?.signal?.addEventListener( 'abort', () =>
						reject( new DOMException( 'aborted', 'AbortError' ) )
					)
				);
			const iframeInterface = new CriticalCSSGenerator.BrowserInterfaceIframe( {
				loadTimeout: 1000,
				verifyPage: ( _url, innerWindow, innerDocument ) =>
					!! innerDocument.querySelector( 'meta[name="testing-page"]' ),
			} );
			const started = Date.now();
			const outcome = await Promise.race( [
				iframeInterface.loadPage( url ).then(
					() => 'resolved',
					error => error.message
				),
				new Promise( resolve => setTimeout( () => resolve( 'still waiting' ), 4000 ) ),
			] );
			return { outcome, elapsed: Date.now() - started };
		}, innerUrl );

		expect( result.outcome ).toMatch( /^Timeout while reading/ );
		expect( result.elapsed ).toBeLessThan( 4000 );

		await page.close();
	} );

	it( 'ends a page load when the caller cancels generation', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		const innerUrl = path.join( testServer.getUrl(), 'page-a' );

		const result = await page.evaluate( async url => {
			window.fetch = () => new Promise( () => {} );
			const controller = new AbortController();
			const iframeInterface = new CriticalCSSGenerator.BrowserInterfaceIframe( {
				verifyPage: () => true,
				signal: controller.signal,
			} );
			setTimeout( () => controller.abort(), 500 );
			const started = Date.now();
			const outcome = await Promise.race( [
				iframeInterface.loadPage( url ).then(
					() => 'resolved',
					error => error.message
				),
				new Promise( resolve => setTimeout( () => resolve( 'still waiting' ), 4000 ) ),
			] );
			return { outcome, elapsed: Date.now() - started };
		}, innerUrl );

		expect( result.outcome ).toMatch( /Generation was cancelled/ );
		expect( result.elapsed ).toBeLessThan( 4000 );

		await page.close();
	} );
} );
