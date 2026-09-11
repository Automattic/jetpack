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

	// The help entry point, so the "sees it -> clicks it" step of the funnel is measured in
	// wp-admin as well as the omnibar. The label's presence marks the treatment; ExPlat holds
	// the assignment itself, so it is not repeated here.
	const helpEntryPoint = document.querySelector( '#wp-admin-bar-agents-manager > a' );
	if ( helpEntryPoint ) {
		const props = {
			has_label: !! helpEntryPoint.querySelector( '.agents-manager-ai-chat-label' ),
		};
		wpcomTrackEvent( 'wpcom_adminbar_help_impression', props );
		helpEntryPoint.addEventListener( 'click', () => {
			wpcomTrackEvent( 'wpcom_adminbar_help_clicked', props );
		} );
	}
} );
