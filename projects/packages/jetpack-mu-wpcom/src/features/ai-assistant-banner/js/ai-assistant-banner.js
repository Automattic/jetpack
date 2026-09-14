import { wpcomTrackEvent } from '../../../common/tracks';

document.addEventListener( 'DOMContentLoaded', () => {
	const banner = document.getElementById( 'wpcom-ai-assistant-banner' );

	if ( ! banner ) {
		return;
	}

	// Shared context props, computed server-side. Defensive fallback so the
	// events still fire prop-less if the global is ever absent.
	const trackProps = window.wpcomAiAssistantBanner?.trackProps || {};

	wpcomTrackEvent( 'jetpack_ai_assistant_banner_impression', trackProps );

	const ctaBtn = banner.querySelector( '.button-secondary' );
	ctaBtn?.addEventListener( 'click', () => {
		wpcomTrackEvent( 'jetpack_ai_assistant_banner_cta_click', trackProps );
	} );

	const attachDismissHandler = btn => {
		btn.addEventListener( 'click', () => {
			wpcomTrackEvent( 'jetpack_ai_assistant_banner_dismiss', trackProps );

			const body = new FormData();
			body.append( 'action', 'dismiss_ai_assistant_banner' );
			body.append( 'nonce', banner.dataset.nonce );
			fetch( window.ajaxurl, { method: 'POST', body } );
		} );
	};

	const dismissBtn = banner.querySelector( '.notice-dismiss' );
	if ( dismissBtn ) {
		attachDismissHandler( dismissBtn );
	} else {
		// WP core injects the dismiss button dynamically via common.js;
		// watch for it if it hasn't appeared yet.
		const observer = new MutationObserver( () => {
			const btn = banner.querySelector( '.notice-dismiss' );
			if ( btn ) {
				observer.disconnect();
				attachDismissHandler( btn );
			}
		} );
		observer.observe( banner, { childList: true, subtree: true } );
	}
} );
