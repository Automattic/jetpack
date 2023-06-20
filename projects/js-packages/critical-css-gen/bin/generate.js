/**
 *
 */
async function main() {
	const playwright = await import( 'playwright' );
	const { generateCriticalCSS, BrowserInterfacePlaywright } = await import( '../lib/index' );

	const urls = process.argv.slice( 2 );

	if ( urls.length === 0 ) {
		console.log( 'Usage: node bin/generate.js [url1] [url2] ...' );
	}

	console.log( 'Loading pages: ' );
	console.log( urls );

	const browser = await playwright.chromium.launch();
	const context = await browser.newContext();

	console.log( 'Generating Critical CSS...' );

	const [ css, warnings ] = await generateCriticalCSS( {
		urls,
		viewports: [
			{ width: 414, height: 896 },
			{ width: 1200, height: 800 },
			{ width: 1920, height: 1080 },
		],
		browserInterface: new BrowserInterfacePlaywright( context, urls ),
	} );

	if ( warnings.length ) {
		console.log( '\n\nwarnings => ' );
		console.log( warnings );
	}

	console.log( 'css => ' );
	console.log( css );
}

main()
	.catch( err => {
		console.error( err );
		process.exit( 1 );
	} )
	.then( () => process.exit( 0 ) );
