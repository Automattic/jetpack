import { translate } from './i18n';
import { Facebook, Mail, WordPress } from './images';
import type { UserInfo, VerbumComments } from './types';

export const serviceData = {
	wordpress: {
		cookieName: 'wpc_wpc',
		name: 'WordPress.com',
		popup: ',height=980,width=500',
		icon: WordPress,
		class: 'wordpress-login',
	},
	facebook: {
		cookieName: 'wpc_fbc',
		name: 'Facebook',
		popup: ',height=650,width=750',
		icon: Facebook,
		class: 'facebook-login',
	},
	mail: {
		name: translate( 'Email' ),
		icon: Mail,
		class: 'mail-login',
	},
};

export const canWeAccessCookies = () => {
	// Is a WordPress cookie already set and can we read it?
	if ( document.cookie.includes( 'wpc_' ) ) {
		return true;
	}

	// Can we set a cookie and read our own cookie?
	document.cookie = 'verbum_test=1; SameSite=None; Secure';
	if ( document.cookie.includes( 'verbum_test' ) ) {
		return true;
	}

	return false;
};

/**
 * Uses the current bundle's size and the time it took to download and execute to estimate connection speed.
 */
export function isFastConnection() {
	// Hardcoding the size of the bundle.
	const bytes = 30000;
	const bytesPerMs = bytes / VerbumComments.fullyLoadedTime;

	/**
	 * This number is extremely inaccurate to measure connection speed.
	 * Because it contains execution time and the file we're using to measure to really small and has a lot of overhead.
	 * But it's excellent to measure what we want, how long it takes to download and execute JS.
	 */
	const bytesPerSecond = bytesPerMs * 1000;

	// this 15000 came from testing. It's the average of a fast connection.
	return bytesPerSecond > 15000;
}

/**
 * Get how many times the user saw the subscription modal.
 *
 * @param {number} uid - The user ID associated with the subscription modal.
 * @returns {number} - The number of times the user saw the subscription modal.
 */
export function getSubscriptionModalViewCount( uid: number ) {
	const cookieName = 'verbum_subscription_modal_counter_' + uid;
	const cookieValue = document.cookie
		.split( '; ' )
		.find( row => row.startsWith( `${ cookieName }=` ) )
		?.split( '=' )[ 1 ];
	return cookieValue ? parseInt( cookieValue ) : 0;
}

/**
 * Set the view count for the subscription modal in a cookie.
 *
 * @param {number} count - The view count to be set.
 * @param {number} uid - The user ID associated with the subscription modal.
 * @returns {void}
 */
export function setSubscriptionModalViewCount( count: number, uid: number ) {
	const cookieName = 'verbum_subscription_modal_counter_' + uid;
	document.cookie = `${ cookieName }=${ count }; SameSite=None; Secure; path=/`;
}
/**
 * We checked if the subscribe to blog is enabled, if the user is not already subscribed,
 * and if the user already view this modal > 5 times.
 *
 * @param {boolean} alreadySubscribed - boolean
 * @param {number} uid - The user ID associated with the subscription modal.
 * @returns {string} - The string that will be used to determine if the modal should be shown.
 */
export function shouldShowSubscriptionModal( alreadySubscribed: boolean, uid: number ) {
	const { subscribeToBlog } = VerbumComments;

	if ( ! canWeAccessCookies() ) {
		return 'hidden_cookies_disabled';
	}
	if ( ! subscribeToBlog ) {
		return 'hidden_subscribe_not_enabled';
	}
	if ( alreadySubscribed ) {
		return 'hidden_already_subscribed';
	}

	// Check if the user already saw the modal 5 times.
	const modalViewCounter = getSubscriptionModalViewCount( uid );
	if ( modalViewCounter > 5 ) {
		return 'hidden_views_limit';
	}

	return 'showed';
}

/**
 * Wraps a textarea with a setter that calls onChange when the value changes.
 *
 * @param {HTMLTextAreaElement} textarea - the textarea to wrap.
 * @param {event} onChange - the callback to call when .value is set.
 * @returns {object} the textarea with a reactive .value setter.
 */
export function makeReactiveTextArea(
	textarea: HTMLTextAreaElement,
	onChange: ( value: string ) => void
) {
	return {
		type: textarea.type,
		parentNode: textarea.parentNode,
		nextSibling: textarea.nextSibling,
		style: textarea.style,
		set value( value: string ) {
			textarea.value = value;
			onChange( value );
		},
		get value(): string {
			return textarea.value;
		},
	};
}

/**
 * Check to see if the editor content is empty.
 * Used by the textarea and editor components.
 *
 * @param {string} html - The contents of the comment textarea.
 * @returns {boolean} indicating if the editor content is empty.
 */
export function isEmptyEditor( html: string ) {
	const parser = new DOMParser();
	const document = parser.parseFromString( html, 'text/html' );
	return document.documentElement.textContent.trim() === '' && ! document.querySelector( 'img' );
}

/**
 * Retrieve domain for user cookie.
 */
export const addWordPressDomain = window.location.hostname.endsWith( '.wordpress.com' )
	? ' Domain=.wordpress.com'
	: '';

/**
 * Set the user info in the cookie.
 *
 * @param {UserInfo} userData - the user info to set.
 */
export const setUserInfoCookie = ( userData: UserInfo ) => {
	let cookieName: string;
	const { service } = userData;

	if ( service === 'wordpress' ) {
		cookieName = 'wpc_wpc';
	} else if ( service === 'facebook' ) {
		cookieName = 'wpc_fbc';
	} else if ( service === 'guest' ) {
		cookieName = 'wpc_guest';
	}

	const cookieData = new URLSearchParams( {
		...userData,
		...( userData?.avatar && {
			avatar: encodeURIComponent( userData.avatar ),
		} ),
		...( userData?.email && { email: encodeURIComponent( userData.email ) } ),
		...( userData?.logout_url && {
			logout_url: encodeURIComponent( userData.logout_url ),
		} ),
		...( userData?.uid && { uid: userData.uid.toString() } ),
		...( userData?.url && { url: encodeURIComponent( userData.url ) } ),
	} ).toString();

	document.cookie = `${ cookieName }=${ cookieData }; path=/; SameSite=None; Secure=True;${ addWordPressDomain }`;
};

/**
 * Get the user info from the cookie.
 *
 * @returns {UserInfo} the user info.
 */
export const getUserInfoCookie = () => {
	let userData: UserInfo = { service: 'guest' };
	const cookies = document.cookie.split( '; ' );

	for ( let i = 0; i < cookies.length; i++ ) {
		const cookie = cookies[ i ].trim();
		if ( cookie.startsWith( 'wpc_' ) ) {
			const service = cookie.slice( 0, 7 );

			let serviceName = 'guest';
			if ( service === 'wpc_wpc' ) {
				serviceName = 'wordpress';
			} else if ( service === 'wpc_fbc' ) {
				serviceName = 'facebook';
			}

			const data = cookie.slice( 8 );
			userData = data && {
				service: serviceName,
				...Object.fromEntries( new URLSearchParams( decodeURIComponent( data ) ) ),
			};

			if ( serviceName === 'wordpress' ) {
				const avatarUrl = new URL( userData.avatar );
				userData.avatar = avatarUrl.origin + avatarUrl.pathname + '?s=64';
			}
		}
	}
	return userData;
};

export const hasSubscriptionOptionsVisible = () =>
	VerbumComments.subscribeToComment || VerbumComments.subscribeToBlog;

export const isAuthRequired = () =>
	VerbumComments.requireNameEmail || VerbumComments.commentRegistration;
