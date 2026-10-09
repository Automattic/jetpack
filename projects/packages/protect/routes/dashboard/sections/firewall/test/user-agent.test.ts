import { summarizeUserAgent } from '../user-agent';

describe( 'summarizeUserAgent', () => {
	it.each( [
		[
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:157.0) Gecko/20100101 Firefox/157.0',
			'Firefox · macOS',
		],
		[
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36 Edg/140.0.0.0',
			'Edge · Windows',
		],
		[
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/148.0.7778.96 Safari/537.36',
			'Headless Chrome · macOS',
		],
		[
			'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Mobile Safari/537.36',
			'Chrome · Android',
		],
		[
			'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
			'Safari · iOS',
		],
		[ 'curl/8.14.1', 'curl' ],
		[ 'python-requests/2.32.3', 'python-requests' ],
	] )( '%s', ( userAgent, expected ) => {
		expect( summarizeUserAgent( userAgent ) ).toBe( expected );
	} );
} );
