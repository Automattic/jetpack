/**
 * Small stand-ins for the Calypso helper libraries the dashboard used.
 */
import config from './config';

const VERSION_TOKENS: Record< string, number > = {
	dev: -6,
	alpha: -5,
	a: -5,
	beta: -4,
	b: -4,
	RC: -3,
	rc: -3,
	'#': -2,
	p: 1,
	pl: 1,
};

/**
 * PHP-style version_compare, as `calypso/lib/version-compare`.
 *
 * @param v1       - First version.
 * @param v2       - Second version.
 * @param operator - Comparison operator; when omitted, returns -1, 0 or 1.
 * @return Comparison result.
 */
export function versionCompare( v1: string, v2: string, operator?: string ): boolean | number {
	const prep = ( v: string ) => {
		const s = ( '' + v )
			.replace( /[_\-+]/g, '.' )
			.replace( /([^.\d]+)/g, '.$1.' )
			.replace( /\.{2,}/g, '.' );
		return s.length ? s.split( '.' ) : [ '-8' ];
	};
	const num = ( part: string ) => {
		if ( ! part ) {
			return 0;
		}
		return isNaN( Number( part ) ) ? ( VERSION_TOKENS[ part ] ?? -7 ) : parseInt( part, 10 );
	};
	const a = prep( v1 );
	const b = prep( v2 );
	let compare = 0;
	for ( let i = 0; i < Math.max( a.length, b.length ) && compare === 0; i++ ) {
		const x = num( a[ i ] );
		const y = num( b[ i ] );
		compare = Math.sign( x - y );
	}
	switch ( operator ) {
		case '>':
		case 'gt':
			return compare > 0;
		case '>=':
		case 'ge':
			return compare >= 0;
		case '<=':
		case 'le':
			return compare <= 0;
		case '==':
		case '=':
		case 'eq':
			return compare === 0;
		case '<>':
		case '!=':
		case 'ne':
			return compare !== 0;
		case '<':
		case 'lt':
			return compare < 0;
		default:
			return compare;
	}
}

export const capitalize = ( s: string ) => ( s ? s.charAt( 0 ).toUpperCase() + s.slice( 1 ) : s );

/**
 * Convert `#rgb` or `#rrggbb(aa)` to channel values, as `@automattic/onboarding` does.
 *
 * @param hex - Hex colour.
 * @return Channels.
 */
export function hexToRgb( hex: string ) {
	const rgbHex = hex
		.replace(
			/^#?([a-f\d])([a-f\d])([a-f\d])([a-f\d])?$/i,
			( _m, r, g, b, a ) => '#' + r + r + g + g + b + b + ( a ? a + a : '' )
		)
		.substring( 1 )
		.match( /.{2}/g );

	if ( rgbHex?.length !== 3 && rgbHex?.length !== 4 ) {
		throw new Error( 'Unexpected RGB hex value' );
	}

	const [ r, g, b, a ] = rgbHex.map( x => parseInt( x, 16 ) );
	return { r, g, b, a };
}

/**
 * Split a URL into parts, as `@automattic/calypso-url`.
 *
 * @param url - URL.
 * @return URL parts.
 */
export function getUrlParts( url: string ) {
	const parsed = new URL( url, 'http://__domain__.invalid' );
	const isRelative = parsed.hostname === '__domain__.invalid';
	return {
		protocol: isRelative ? '' : parsed.protocol,
		host: isRelative ? '' : parsed.host,
		hostname: isRelative ? '' : parsed.hostname,
		port: isRelative ? '' : parsed.port,
		origin: isRelative ? '' : parsed.origin,
		pathname: parsed.pathname,
		hash: parsed.hash,
		search: parsed.search,
		searchParams: parsed.searchParams,
	};
}

/**
 * Pass an external image through Photon so it is served over HTTPS, as `@automattic/calypso-url`.
 *
 * @param url - Image URL.
 * @return Safe URL, or null.
 */
export function safeImageUrl( url: string ): string | null {
	if ( typeof url !== 'string' ) {
		return null;
	}
	if ( /^(data|blob):/.test( url ) ) {
		return url;
	}
	let parsed: URL;
	try {
		parsed = new URL( url, window.location.href );
	} catch {
		return null;
	}
	if ( /(^[is]\d\.wp\.com|(^|\.)wordpress\.com|(^|\.)gravatar\.com)$/.test( parsed.hostname ) ) {
		return parsed.href.replace( /^http:/, 'https:' );
	}
	if ( parsed.search ) {
		return null;
	}
	const ssl = parsed.protocol === 'https:' ? '?ssl=1' : '';
	return `https://i0.wp.com/${ parsed.host }${ parsed.pathname }${ ssl }`;
}

/**
 * Resize an image through Photon, as `calypso/lib/resize-image-url`.
 *
 * @param imageUrl - Image URL.
 * @param resize   - Width, or Photon size params.
 * @param height   - Height.
 * @return Resized URL.
 */
export function resizeImageUrl(
	imageUrl: string,
	resize: number | Record< string, string | number >,
	height?: number | null
): string {
	if ( typeof imageUrl !== 'string' || ! /^https?:/.test( imageUrl ) ) {
		return imageUrl;
	}
	const safe = safeImageUrl( imageUrl );
	if ( ! safe ) {
		return imageUrl;
	}
	const url = new URL( safe );
	[ 'w', 'h', 'resize', 'fit', 's' ].forEach( p => url.searchParams.delete( p ) );
	const scale = window.devicePixelRatio > 1 ? 2 : 1;
	let params: Record< string, string | number > =
		typeof resize === 'number' ? { w: resize } : resize;
	if ( typeof resize === 'number' && height ) {
		params = { fit: `${ resize },${ height }` };
	}
	for ( const [ key, value ] of Object.entries( params ) ) {
		url.searchParams.set(
			key,
			key === 'fit' || key === 'resize'
				? String( value )
						.split( ',' )
						.map( v => Number( v ) * scale )
						.join( ',' )
				: String( Number( value ) * scale )
		);
	}
	return url.href;
}

export const CALYPSO_CONTACT = 'https://wordpress.com/help/contact';

/**
 * Load a script tag, as `@automattic/load-script`.
 *
 * @param src - Script URL.
 * @return Promise resolving once loaded.
 */
export function loadScript( src: string ): Promise< void > {
	return new Promise( ( resolve, reject ) => {
		const script = document.createElement( 'script' );
		script.src = src;
		script.async = true;
		script.onload = () => resolve();
		script.onerror = () => reject( new Error( `Failed to load script "${ src }"` ) );
		document.head.appendChild( script );
	} );
}

/**
 * The Calypso-style locale slug (`pt-br`), from the boot config.
 *
 * @return Locale slug.
 */
export function getLocaleSlug(): string {
	return config( 'initial_state' )?.currentUser?.user?.localeSlug || 'en';
}

export const useLocale = getLocaleSlug;

const MAG16 = [
	'ar',
	'de',
	'es',
	'fr',
	'he',
	'id',
	'it',
	'ja',
	'ko',
	'nl',
	'pt-br',
	'ru',
	'sv',
	'tr',
	'zh-cn',
	'zh-tw',
];

/**
 * Point a wordpress.com or automattic.com URL at the user's language, a subset of `@automattic/i18n-utils`.
 *
 * @param fullUrl - URL.
 * @return Localized URL.
 */
export function localizeUrl( fullUrl: string ): string {
	const locale = getLocaleSlug();
	if ( locale === 'en' || ! MAG16.includes( locale ) ) {
		return fullUrl;
	}
	try {
		const url = new URL( fullUrl );
		if ( url.hostname === 'wordpress.com' && ! url.pathname.startsWith( `/${ locale }/` ) ) {
			url.pathname = `/${ locale }${ url.pathname }`;
			return url.href;
		}
	} catch {
		// Not an absolute URL: leave it alone.
	}
	return fullUrl;
}

export const useLocalizeUrl = () => localizeUrl;

/**
 * The browser's IANA timezone.
 *
 * @return Timezone, or null.
 */
export function guessTimezone(): string | null {
	try {
		return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
	} catch {
		return null;
	}
}

/**
 * No-op `debug` factory.
 *
 * @return Logger that does nothing.
 */
/* eslint-disable @typescript-eslint/no-unused-vars -- No-ops keep the signatures they stand in for. */
export const debugFactory =
	( ..._namespace: unknown[] ) =>
	( ..._args: unknown[] ) => {};

export const captureException = ( _error?: unknown ) => {};
/* eslint-enable @typescript-eslint/no-unused-vars */
export const getMobileDeviceInfo = () => null as { version?: string } | null;
export const isWpMobileApp = () => false;
export const isWcMobileApp = () => false;
export const getHotjarSiteSettings = () => ( {} );
export const mayWeLoadHotJarScript = () => false;
