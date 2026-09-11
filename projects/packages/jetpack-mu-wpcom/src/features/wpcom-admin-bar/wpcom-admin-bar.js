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

	// The Help Center entry point's impression, the one funnel step wp-admin never reported.
	// The node's marker class says whether the label was shown; ExPlat holds the assignment.
	const helpEntryPoint = document.querySelector( '#wp-admin-bar-help-center' );
	if ( helpEntryPoint ) {
		wpcomTrackEvent( 'wpcom_adminbar_help_impression', {
			has_label: helpEntryPoint.classList.contains( 'has-help-entry-label' ),
		} );
	}
} );
