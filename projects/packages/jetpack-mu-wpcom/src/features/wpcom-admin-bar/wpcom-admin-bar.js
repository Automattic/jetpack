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

	const freeDomainUpsell = document.querySelector( '#wp-admin-bar-free-domain-upsell a' );
	if ( freeDomainUpsell ) {
		const source = window.wpcomAdminBarUpsellSource || 'wp_admin';
		const props = {
			upsell_id: 'omnibar-free-domain',
			source,
		};
		if ( window.wpcomAdminBarFreeDomainUpsellSource ) {
			props.upsell_source = window.wpcomAdminBarFreeDomainUpsellSource;
		}
		wpcomTrackEvent( 'wpcom_omnibar_upsell_impression', props );
		freeDomainUpsell.addEventListener( 'click', () => {
			wpcomTrackEvent( 'wpcom_omnibar_upsell_click', props );
		} );
	}
} );
