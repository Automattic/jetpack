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

	// The defaults: 60 s for the page load, then 30 s for the status checks after it.
	const limits = { loadTimeout: 60000, checkTimeout: 30000 };

	/**
	 * Hold the page-a document until the returned function is called.
	 *
	 * @param {object} page - Playwright page hosting the generator bundle.
	 * @return {Promise<Function>} Releases the held document.
	 */
	async function holdPageA( page ) {
		let release;
		const held = new Promise( resolve => ( release = resolve ) );
		await page.route( '**/page-a/', async route => {
			await held;
			await route.continue();
		} );
		return release;
	}

	/**
	 * Start a load on a paused clock, with its document and status check released by hand.
	 *
	 * @param {object} page - Playwright page hosting the generator bundle.
	 * @return {Promise<Function>} Releases the held page document.
	 */
	async function startHeldLoad( page ) {
		const releaseDocument = await holdPageA( page );
		await page.clock.install();
		await page.goto( testServer.getUrl() );
		// The installed clock still ticks with real time until it is paused.
		await page.clock.pauseAt( Date.now() + 1000 );
		await page.evaluate(
			( { url, options } ) => {
				const realFetch = window.fetch;
				window.answerCheck = null;
				window.fetch = ( fetchUrl, init ) =>
					new Promise( ( resolve, reject ) => {
						window.answerCheck = () => realFetch( fetchUrl, init ).then( resolve, reject );
					} );
				window.outcome = 'still waiting';
				new CriticalCSSGenerator.BrowserInterfaceIframe( {
					...options,
					verifyPage: ( _url, _w, innerDocument ) =>
						!! innerDocument.querySelector( 'meta[name="testing-page"]' ),
				} )
					.loadPage( url )
					.then(
						() => ( window.outcome = 'resolved' ),
						error => ( window.outcome = error.message )
					);
			},
			{ url: testServer.getUrl() + '/page-a/', options: limits }
		);
		return releaseDocument;
	}

	const readOutcome = page => page.evaluate( () => window.outcome );
	const checkStarted = page =>
		page.waitForFunction( () => window.answerCheck, null, { polling: 50 } );

	it( 'gives the status check its own limit after a load that used most of the load limit', async () => {
		const page = await browser.newPage();
		const releaseDocument = await startHeldLoad( page );

		await page.clock.runFor( limits.loadTimeout - 1 );
		releaseDocument();
		await checkStarted( page );
		await page.clock.runFor( limits.checkTimeout - 1 );
		await expect( readOutcome( page ) ).resolves.toBe( 'still waiting' );

		await page.evaluate( () => window.answerCheck() );
		await page.waitForFunction( () => window.outcome !== 'still waiting', null, { polling: 50 } );
		await expect( readOutcome( page ) ).resolves.toBe( 'resolved' );
		await page.close();
	} );

	it( 'ends a page whose status check never answers at the check limit', async () => {
		const page = await browser.newPage();
		const releaseDocument = await startHeldLoad( page );
		releaseDocument();
		await checkStarted( page );

		await page.clock.runFor( limits.checkTimeout - 1 );
		await expect( readOutcome( page ) ).resolves.toBe( 'still waiting' );
		await page.clock.runFor( 1 );
		await expect( readOutcome( page ) ).resolves.toMatch( /^Timeout while reading/ );
		await page.close();
	} );

	it( 'fails a load that exceeds its limit', async () => {
		const page = await browser.newPage();
		await startHeldLoad( page );

		await page.clock.runFor( limits.loadTimeout - 1 );
		await expect( readOutcome( page ) ).resolves.toBe( 'still waiting' );
		await page.clock.runFor( 1 );
		await expect( readOutcome( page ) ).resolves.toMatch( /^Timeout while reading/ );
		await page.close();
	} );

	it.each( [
		[ 'while the page is loading', true ],
		[ 'while its status check is waiting', false ],
	] )( 'ends a page load when the caller cancels generation %s', async ( _stage, holdDocument ) => {
		const page = await browser.newPage();
		if ( holdDocument ) {
			await holdPageA( page );
		}
		await page.goto( testServer.getUrl() );

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
				setTimeout( () => controller.abort(), 50 );
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
			{ url: testServer.getUrl() + '/page-a/', hang: ! holdDocument }
		);

		expect( result.outcome ).toMatch( /Generation was cancelled/ );
		expect( result.elapsed ).toBeLessThan( 4000 );

		await page.close();
	} );

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
