import { wpcomTrackEvent } from '../../common/tracks';

import './wpcom-admin-bar.scss';

document.addEventListener( 'DOMContentLoaded', () => {
	const planBadge = document.querySelector( '#wp-admin-bar-site-plan-badge a' );
	if ( planBadge ) {
		planBadge.addEventListener( 'click', () => {
			wpcomTrackEvent( 'wpcom_adminbar_plan_clicked' );
		} );
	}

	const commandPalette = document.querySelector( '#wp-admin-bar-command-palette a' );
	if ( commandPalette ) {
		commandPalette.addEventListener( 'click', () => {
			wpcomTrackEvent( 'wpcom_adminbar_command_palette_clicked' );
		} );
	}

	const freeDomainUpsell = document.querySelector( '#wp-admin-bar-wpcom-free-domain-upsell a' );
	if ( freeDomainUpsell ) {
		wpcomTrackEvent( 'wpcom_omnibar_upsell_impression', {
			upsell_id: 'omnibar-free-domain',
			surface: 'wp-admin',
		} );
		freeDomainUpsell.addEventListener( 'click', () => {
			wpcomTrackEvent( 'wpcom_omnibar_upsell_click', {
				upsell_id: 'omnibar-free-domain',
				surface: 'wp-admin',
			} );
		} );
	}
} );
