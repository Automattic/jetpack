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
		// slow-a is page-a held for 2.6 s, near-a for 3.7 s and slower-a for 5 s; request them with the
		// trailing slash, or the directory redirect pays the delay twice.
		testServer = new TestServer(
			{
				'page-a': path.join( dataDirectory, 'page-a' ),
				'slow-a': path.join( dataDirectory, 'page-a' ),
				'near-a': path.join( dataDirectory, 'page-a' ),
				'slower-a': path.join( dataDirectory, 'page-a' ),
			},
			{ 'slow-a': 2600, 'near-a': 3700, 'slower-a': 5000 }
		);
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

	// Limits are scaled down from the defaults of 60 s for the load and 30 s for the checks.
	const limits = { loadTimeout: 4000, checkTimeout: 3000 };

	/**
	 * Load a page with a status check that answers after a delay, or never.
	 *
	 * @param {object}      page       - Playwright page hosting the generator bundle.
	 * @param {string}      url        - Page to load.
	 * @param {number|null} checkDelay - Milliseconds before the status check answers; null never answers.
	 * @return {Promise<{outcome: string, elapsed: number}>} How the load ended and how long it took.
	 */
	const loadWithSlowCheck = ( page, url, checkDelay ) =>
		page.evaluate(
			async ( { pageUrl, delay, options } ) => {
				const realFetch = window.fetch;
				window.fetch = ( fetchUrl, init ) =>
					new Promise( ( resolve, reject ) => {
						init?.signal?.addEventListener( 'abort', () =>
							reject( new DOMException( 'aborted', 'AbortError' ) )
						);
						// The check's own time is the delay, so answer it from the page's undelayed copy.
						const quickUrl = String( fetchUrl ).replace( /\/(slow|near|slower)-a/, '/page-a' );
						if ( delay !== null ) {
							setTimeout( () => realFetch( quickUrl, init ).then( resolve, reject ), delay );
						}
					} );
				const iframeInterface = new CriticalCSSGenerator.BrowserInterfaceIframe( {
					...options,
					verifyPage: ( _url, innerWindow, innerDocument ) =>
						!! innerDocument.querySelector( 'meta[name="testing-page"]' ),
				} );
				const started = Date.now();
				const outcome = await Promise.race( [
					iframeInterface.loadPage( pageUrl ).then(
						() => 'resolved',
						error => error.message
					),
					new Promise( resolve => setTimeout( () => resolve( 'still waiting' ), 9000 ) ),
				] );
				return { outcome, elapsed: Date.now() - started };
			},
			{ pageUrl: url, delay: checkDelay, options: limits }
		);

	it( 'resolves when the load and its check each finish within their own limits', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		// Load 2.6 s of 4 s, then a check of 2 s of 3 s: more than the load limit together.
		const result = await loadWithSlowCheck( page, testServer.getUrl() + '/slow-a/', 2000 );

		expect( result.outcome ).toBe( 'resolved' );
		await page.close();
	} );

	it( 'resolves a load close to its limit followed by a quick check', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		// Load 3.7 s of 4 s, then a check of 0.5 s: more than the load limit together.
		const result = await loadWithSlowCheck( page, testServer.getUrl() + '/near-a/', 500 );

		expect( result.outcome ).toBe( 'resolved' );
		await page.close();
	} );

	it( 'ends a page whose status check never answers by the sum of both limits', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		const result = await loadWithSlowCheck(
			page,
			path.join( testServer.getUrl(), 'page-a' ),
			null
		);

		expect( result.outcome ).toMatch( /^Timeout while reading/ );
		expect( result.elapsed ).toBeGreaterThanOrEqual( limits.checkTimeout );
		expect( result.elapsed ).toBeLessThan( limits.loadTimeout + limits.checkTimeout );
		await page.close();
	} );

	it( 'fails a load that exceeds its limit', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		const result = await loadWithSlowCheck( page, testServer.getUrl() + '/slower-a/', 0 );

		expect( result.outcome ).toMatch( /^Timeout while reading/ );
		expect( result.elapsed ).toBeGreaterThanOrEqual( limits.loadTimeout );
		expect( result.elapsed ).toBeLessThan( limits.loadTimeout + 1000 );
		await page.close();
	} );

	it.each( [
		[ 'while the page is loading', 'slower-a', false ],
		[ 'while its status check is waiting', 'page-a', true ],
	] )(
		'ends a page load when the caller cancels generation %s',
		async ( _stage, pagePath, hangCheck ) => {
			const page = await browser.newPage();
			await page.goto( testServer.getUrl() );

			const innerUrl = path.join( testServer.getUrl(), pagePath );

			const result = await page.evaluate(
				async ( { url, hang } ) => {
					if ( hang ) {
						window.fetch = () => new Promise( () => {} );
					}
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
				},
				{ url: innerUrl, hang: hangCheck }
			);

			expect( result.outcome ).toMatch( /Generation was cancelled/ );
			expect( result.elapsed ).toBeLessThan( 4000 );

			await page.close();
		}
	);

	it( 'does not reuse a page it loaded before the caller cancelled generation', async () => {
		const page = await browser.newPage();
		await page.goto( testServer.getUrl() );

		const innerUrl = path.join( testServer.getUrl(), 'page-a' );

		const result = await page.evaluate( async url => {
			const controller = new AbortController();
			const iframeInterface = new CriticalCSSGenerator.BrowserInterfaceIframe( {
				verifyPage: () => true,
				signal: controller.signal,
			} );
			await iframeInterface.loadPage( url );
			controller.abort();
			return iframeInterface.loadPage( url ).then(
				() => 'resolved',
				error => error.message
			);
		}, innerUrl );

		expect( result ).toMatch( /Generation was cancelled/ );

		await page.close();
	} );
} );
