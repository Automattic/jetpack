/**
 * Internal dependencies
 */
import { COOKIE_NAME } from './constants';

/**
 * Session Manager for WooCommerce Analytics
 *
 */
export default class SessionManager {
	constructor() {
		this.sessionId = null;
		this.landingPage = null;
		this.isEngaged = false;
		this.isNewSession = false;
		this.isInitialized = false;
	}

	/**
	 * Initialize the session manager
	 */
	init = () => {
		if ( this.isInitialized ) {
			return;
		}

		this.loadOrCreateSession();
		this.isInitialized = true;
	};

	/**
	 * Load existing session or create new one
	 */
	loadOrCreateSession() {
		const cookie = this.getSessionCookie();

		if ( cookie && cookie.sessionId ) {
			// Load existing session
			this.sessionId = cookie.sessionId;
			this.landingPage = cookie.landingPage || null;
			this.isEngaged = cookie.isEngaged || false;
			this.isNewSession = false;
		} else {
			this.createNewSession();
		}
	}

	/**
	 * Create a new session
	 */
	createNewSession() {
		this.isNewSession = true;

		const sessionData = {
			sessionId: this.generateRandomToken( 16 ),
			landingPage: JSON.stringify( window.wcAnalytics?.breadcrumbs || [] ),
			expires: this.getSessionExpirationTime(),
		};

		if ( this.setSessionCookie( sessionData ) ) {
			// Only set session data if cookie was set successfully
			this.sessionId = sessionData.sessionId;
			this.landingPage = sessionData.landingPage;
			this.isEngaged = false;
		}
	}

	/**
	 * Get session cookie data
	 * Matches PHP implementation: get_session_cookie()
	 *
	 * @return {object|null} Session cookie data
	 */
	getSessionCookie() {
		const rawCookie = this.getCookie( COOKIE_NAME );
		if ( ! rawCookie ) {
			return null;
		}
		try {
			return JSON.parse( decodeURIComponent( rawCookie ) );
		} catch ( _error ) {
			// eslint-disable-next-line no-console
			console.error( 'Error parsing session cookie', _error );
			return null;
		}
	}

	/**
	 * Get cookie value by name
	 * @param {string} name - Cookie name
	 * @return {string|null} Cookie value
	 */
	getCookie( name ) {
		const value = `; ${ document.cookie }`;
		const parts = value.split( `; ${ name }=` );
		if ( parts.length === 2 ) {
			return parts.pop().split( ';' ).shift();
		}
		return null;
	}

	/**
	 * Set session cookie
	 *
	 * @param {object} sessionData - Session data
	 *
	 * @return {boolean} Whether the cookie was set successfully
	 */
	setSessionCookie( sessionData ) {
		const encoded = encodeURIComponent( JSON.stringify( sessionData ) );
		const expires = sessionData.expires || this.getSessionExpirationTime();

		document.cookie = `${ COOKIE_NAME }=${ encoded }; expires=${ expires }; path=/; secure; samesite=strict`;

		const isCookieSet = this.getCookie( COOKIE_NAME ) === encoded;
		return isCookieSet;
	}

	/**
	 * Generate session expiration time
	 * 30 minutes from now or at midnight UTC, whichever comes first
	 *
	 * @return {string} Session expiration time
	 */
	getSessionExpirationTime() {
		const thirtyMinutesFromNow = Date.now() + 30 * 60 * 1000;
		const midnightUTC = new Date();
		midnightUTC.setUTCDate( midnightUTC.getUTCDate() + 1 );
		midnightUTC.setUTCHours( 0, 0, 0, 0 );

		const expirationTime = Math.min( thirtyMinutesFromNow, midnightUTC.getTime() );
		return new Date( expirationTime ).toUTCString();
	}

	/**
	 * Generate random token
	 *
	 * @param {number} randomBytesLength - Length of random bytes
	 * @return {string} Random token
	 */
	generateRandomToken( randomBytesLength ) {
		let randomBytes = [];

		if ( window.crypto && window.crypto.getRandomValues ) {
			randomBytes = new Uint8Array( randomBytesLength );
			window.crypto.getRandomValues( randomBytes );
		} else {
			for ( let i = 0; i < randomBytesLength; ++i ) {
				randomBytes[ i ] = Math.floor( Math.random() * 256 );
			}
		}

		return btoa( String.fromCharCode.apply( String, randomBytes ) );
	}

	/**
	 * Set engaged and update session cookie
	 */
	setEngaged() {
		if ( this.isEngaged ) {
			// Engagement already recorded
			return;
		}

		const sessionData = this.getSessionCookie();
		if ( sessionData && sessionData.sessionId ) {
			sessionData.isEngaged = true;
			this.setSessionCookie( sessionData );
		}

		this.isEngaged = true;
	}
}
