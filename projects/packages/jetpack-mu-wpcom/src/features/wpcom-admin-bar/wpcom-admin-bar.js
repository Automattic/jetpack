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

	// Measured, not inferred from the markup: the label is hidden on narrow viewports and
	// the block editor hides the whole item, so neither is an impression of the label.
	const helpEntryPoint = document.querySelector( '#wp-admin-bar-help-center' );
	if ( helpEntryPoint && helpEntryPoint.getClientRects().length ) {
		const entryLabel = helpEntryPoint.querySelector( '.help-center-entry-label' );
		wpcomTrackEvent( 'wpcom_adminbar_help_impression', {
			has_label: !! entryLabel && entryLabel.getClientRects().length > 0,
		} );
	}
} );
