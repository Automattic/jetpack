// Order matters: Edge and Opera also claim Chrome, and Chrome also claims Safari.
const BROWSERS: [ RegExp, string ][] = [
	[ /\bEdg(e|A|iOS)?\//, 'Edge' ],
	[ /\bOPR\//, 'Opera' ],
	[ /\b(Firefox|FxiOS)\//, 'Firefox' ],
	[ /\bHeadlessChrome\//, 'Headless Chrome' ],
	[ /\b(Chrome|CriOS)\//, 'Chrome' ],
	[ /\bVersion\/[\d.]+.*\bSafari\//, 'Safari' ],
];

// iOS before macOS: iPhone user agents say "like Mac OS X".
const SYSTEMS: [ RegExp, string ][] = [
	[ /\b(iPhone|iPad|iPod)\b/, 'iOS' ],
	[ /\bAndroid\b/, 'Android' ],
	[ /\bWindows\b/, 'Windows' ],
	[ /\b(Macintosh|Mac OS X)\b/, 'macOS' ],
	[ /\bCrOS\b/, 'ChromeOS' ],
	[ /\bLinux\b/, 'Linux' ],
];

const find = ( list: [ RegExp, string ][], userAgent: string ) =>
	list.find( ( [ pattern ] ) => pattern.test( userAgent ) )?.[ 1 ];

/**
 * A short name for the client behind a user agent, such as "Firefox · macOS" or "curl".
 *
 * @param userAgent - The User-Agent header.
 * @return The browser and system, or the product name for other clients.
 */
export function summarizeUserAgent( userAgent: string ): string {
	const browser = find( BROWSERS, userAgent );
	if ( browser ) {
		const system = find( SYSTEMS, userAgent );
		return system ? `${ browser } · ${ system }` : browser;
	}

	// Scripts and bots: "curl/8.14.1" → "curl".
	return userAgent.split( /[\s/;(]/ )[ 0 ] || userAgent;
}
