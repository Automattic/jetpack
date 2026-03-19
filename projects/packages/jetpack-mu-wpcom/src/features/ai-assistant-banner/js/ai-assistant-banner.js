import { wpcomTrackEvent } from '../../../common/tracks';

document.addEventListener( 'DOMContentLoaded', () => {
	const banner = document.getElementById( 'wpcom-ai-assistant-banner' );

	if ( ! banner ) {
		return;
	}

	wpcomTrackEvent( 'jetpack_ai_assistant_banner_impression' );

	const ctaBtn = banner.querySelector( '.button-secondary' );
	ctaBtn?.addEventListener( 'click', () => {
		wpcomTrackEvent( 'jetpack_ai_assistant_banner_cta_click' );
	} );

	const dismissBtn = banner.querySelector( '.notice-dismiss' );
	dismissBtn?.addEventListener( 'click', () => {
		wpcomTrackEvent( 'jetpack_ai_assistant_banner_dismiss' );

		const body = new FormData();
		body.append( 'action', 'dismiss_ai_assistant_banner' );
		body.append( 'nonce', banner.dataset.nonce );
		fetch( window.ajaxurl, { method: 'POST', body } );

		banner.style.display = 'none';
	} );
} );
