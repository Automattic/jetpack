import { wpcomTrackEvent } from '../../common/tracks';

document.addEventListener( 'DOMContentLoaded', () => {
	const fiverrCtaRow = document.querySelector( '.wpcom-fiverr-cta' );
	const siteIconSectionRow = document.querySelector( '.site-icon-section' );

	if ( fiverrCtaRow && siteIconSectionRow ) {
		siteIconSectionRow?.parentNode?.insertBefore( fiverrCtaRow, siteIconSectionRow.nextSibling );
	}

	const fiverCta = document.querySelector( '.wpcom-fiverr-cta-button' );
	if ( fiverCta ) {
		fiverCta.addEventListener( 'click', e => {
			e.preventDefault();

			wpcomTrackEvent( 'wp_admin_site_icon_fiverr_logo_maker_cta_click', {
				cta_name: 'wp_admin_site_icon_fiverr_logo_maker',
			} );

			window.open( 'https://wp.me/logo-maker/?utm_campaign=general_settings', '_blank' );
		} );
	}
} );
