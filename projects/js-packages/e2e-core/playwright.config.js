const { E2E_DEBUG, HEADLESS, SLOWMO } = process.env;
const config = require( 'config' );

let recordVideo;

if ( HEADLESS !== 'false' && ! E2E_DEBUG ) {
	recordVideo = {
		dir: config.get( 'dirs.videos' ),
		size: { width: 800, height: 600 },
	};
}

module.exports = {
	pwBrowserOptions: {
		channel: '', // Leave blank for 'chromium'. For stock browsers: 'chrome', 'msedge'. See https://playwright.dev/docs/browsers/
		headless: HEADLESS !== 'false' && ! E2E_DEBUG,
		slowMo: parseInt( SLOWMO, 10 ) || 0,
		devtools: HEADLESS === 'false',
		timeout: 20000,
	},
	pwContextOptions: {
		recordVideo,
		viewport: {
			width: 1280,
			height: 1024,
		},
		storageState: config.get( 'temp.storage' ),
		userAgent:
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_2) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/90.0.4392.0 Safari/537.36 wp-e2e-tests',
	},
};
