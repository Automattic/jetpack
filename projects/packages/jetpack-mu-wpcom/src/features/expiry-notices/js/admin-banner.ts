import apiFetch from '@wordpress/api-fetch';
import { wpcomTrackEvent } from '../../../common/tracks';
import { openHelpCenterWithMessage } from './help-center.ts';

interface ExpiryBannerData {
	metaKey: string;
	state: string;
	daysRemaining: number;
	productSlug: string;
}

declare global {
	interface Window {
		wpcomExpiryBanner?: ExpiryBannerData;
	}
}

// sessionStorage can throw in private browsing / sandboxed iframes.
const safeSessionGet = ( key: string ): string | null => {
	try {
		return sessionStorage.getItem( key );
	} catch {
		return null;
	}
};
const safeSessionSet = ( key: string, value: string ): void => {
	try {
		sessionStorage.setItem( key, value );
	} catch {
		// Storage unavailable; the impression may fire more than once.
	}
};

document.addEventListener( 'DOMContentLoaded', () => {
	const banner = document.getElementById( 'wpcom-expiry-banner' );
	const data = window.wpcomExpiryBanner;
	if ( ! banner || ! data ) {
		return;
	}

	const trackProps = {
		state: data.state,
		days_remaining: data.daysRemaining,
		product_slug: data.productSlug,
	};

	// Fire impression once per browser session — the banner re-renders on
	// every load in the non-dismissible states but we count unique sessions.
	const impressionKey = `${ data.metaKey }_impression_fired`;
	if ( safeSessionGet( impressionKey ) !== '1' ) {
		wpcomTrackEvent( 'jetpack_expiry_banner_impression', trackProps );
		safeSessionSet( impressionKey, '1' );
	}

	const primaryCta = banner.querySelector< HTMLAnchorElement >( '.button-primary' );
	primaryCta?.addEventListener( 'click', ( e: Event ) => {
		const supportMessage = primaryCta.dataset.supportMessage;
		// Only the reverted state asks for support; everything else is a plain link.
		const openedHere = supportMessage ? openHelpCenterWithMessage( supportMessage ) : false;
		if ( openedHere ) {
			e.preventDefault();
		}

		wpcomTrackEvent( 'jetpack_expiry_banner_cta_click', {
			...trackProps,
			cta: supportMessage ? 'support' : 'renew',
		} );
	} );

	const dismissBtn = banner.querySelector( '.wpcom-expiry-banner__dismiss' );
	dismissBtn?.addEventListener( 'click', async ( e: Event ) => {
		e.preventDefault();
		banner.style.display = 'none';

		try {
			await apiFetch( {
				path: '/wp/v2/users/me',
				method: 'POST',
				data: { meta: { [ data.metaKey ]: 1 } },
			} );
			wpcomTrackEvent( 'jetpack_expiry_banner_dismiss', trackProps );
		} catch ( err ) {
			// Re-show the banner so the user can see something went wrong
			// rather than having a silently-reappearing notice on the next load.
			banner.style.display = '';
			wpcomTrackEvent( 'jetpack_expiry_banner_dismiss_failed', {
				...trackProps,
				error_message: err instanceof Error ? err.message : String( err ),
			} );
			// eslint-disable-next-line no-console
			console.error( 'Failed to record expiry banner dismiss', err );
		}
	} );
} );
