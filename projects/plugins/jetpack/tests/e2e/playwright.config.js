const { E2E_DEBUG, HEADLESS, SLOWMO } = process.env;

let recordVideo;

if ( HEADLESS !== 'false' && ! E2E_DEBUG ) {
	recordVideo = {
		dir: 'output/videos',
		size: { width: 800, height: 600 },
	};
}

module.exports = {
	pwBrowserOptions: {
		headless: HEADLESS !== 'false' && ! E2E_DEBUG,
		slowMo: parseInt( SLOWMO, 10 ) || 0,
		devtools: HEADLESS === 'false',
	},
	pwContextOptions: {
		recordVideo,
		viewport: {
			width: 1280,
			height: 1024,
		},
		storageState: 'config/storage.json',
		userAgent:
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_2) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/90.0.4392.0 Safari/537.36 wp-e2e-tests',
	},
};
