import { wpcomTrackEvent } from '../../../common/tracks';
import { recordDismissal } from './dismiss.ts';
import { openHelpCenterWithMessage } from './help-center.ts';
import { trackOncePerSession } from './track-once.ts';

interface ExpiryFrontendBannerData {
	metaKey: string;
	state: string;
	daysRemaining: number;
	productSlug: string;
}

declare global {
	interface Window {
		wpcomExpiryFrontendBanner?: ExpiryFrontendBannerData;
	}
}

document.addEventListener( 'DOMContentLoaded', () => {
	const banner = document.getElementById( 'wpcom-expiry-frontend-banner' );
	const data = window.wpcomExpiryFrontendBanner;
	if ( ! banner || ! data ) {
		return;
	}

	const trackProps = {
		state: data.state,
		days_remaining: data.daysRemaining,
		product_slug: data.productSlug,
		surface: 'frontend',
	};

	trackOncePerSession(
		`${ data.metaKey }_frontend_impression_fired`,
		'jetpack_expiry_banner_impression',
		trackProps
	);

	const cta = banner.querySelector< HTMLAnchorElement >( '.wpcom-expiry-frontend-banner__cta' );
	cta?.addEventListener( 'click', ( e: Event ) => {
		const supportMessage = cta.dataset.supportMessage;
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

	const dismissBtn = banner.querySelector( '.wpcom-expiry-frontend-banner__dismiss' );
	dismissBtn?.addEventListener( 'click', async () => {
		banner.hidden = true;
		document.body.classList.remove( 'has-wpcom-expiry-banner' );
		try {
			await recordDismissal( data.metaKey );
			wpcomTrackEvent( 'jetpack_expiry_banner_dismiss', trackProps );
		} catch ( err ) {
			// Re-show so a failed write is visible now rather than as a banner
			// that comes back on the next load.
			banner.hidden = false;
			document.body.classList.add( 'has-wpcom-expiry-banner' );
			wpcomTrackEvent( 'jetpack_expiry_banner_dismiss_failed', {
				...trackProps,
				error_message: err instanceof Error ? err.message : String( err ),
			} );
			// eslint-disable-next-line no-console
			console.error( 'Failed to record expiry banner dismiss', err );
		}
	} );
} );
