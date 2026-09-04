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

	const adminBar = document.querySelector( '#wpadminbar' );
	if ( ! adminBar ) {
		return;
	}

	/**
	 * Track clicks on any admin bar item, using the ID of the closest admin bar
	 * node (minus the `wp-admin-bar-` prefix) as the event property.
	 */
	adminBar.addEventListener( 'click', event => {
		const target = event.target.closest?.( 'a, button' );
		if ( ! target ) {
			return;
		}

		const node = target.closest( 'li[id^="wp-admin-bar-"]' );
		if ( ! node ) {
			return;
		}

		wpcomTrackEvent( 'wpcom_omnibar_node_click', {
			node_id: node.id.replace( /^wp-admin-bar-/, '' ),
		} );
	} );
} );
