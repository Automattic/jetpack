import { wpcomTrackEvent } from '../../common/tracks';

import './wpcom-admin-bar.scss';

// Core and WordPress.com top-level nodes
const TRACKED_TOP_LEVEL_NODE_IDS = new Set( [
	// Core
	'menu-toggle',
	'wp-logo',
	'my-sites',
	'site-name',
	'site-editor',
	'customize',
	'updates',
	'command-palette',
	'comments',
	'new-content',
	'edit',
	'view',
	'preview',
	'archive',
	'my-account',
	'search',
	'recovery-mode',

	// WordPress.com
	'cart',
	'reader',
	'notes',
	'help-center',
	'agents-manager',
	'agents-manager-ai-chat',
	'stats',
] );

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
	 * Track clicks on items under allowlisted top-level nodes, using the ID of the closest
	 * admin bar node (minus the `wp-admin-bar-` prefix) as the event property.
	 */
	adminBar.addEventListener( 'click', event => {
		const target = event.target.closest?.( 'a, button, .ab-item' );
		if ( ! target ) {
			return;
		}

		const node = target.closest( 'li[id^="wp-admin-bar-"]' );
		if ( ! node ) {
			return;
		}

		const topLevelNode = node.closest( '.ab-top-menu > li' );
		if (
			! topLevelNode ||
			! TRACKED_TOP_LEVEL_NODE_IDS.has( topLevelNode.id.replace( /^wp-admin-bar-/, '' ) )
		) {
			return;
		}

		wpcomTrackEvent( 'wpcom_omnibar_node_click', {
			node_id: node.id.replace( /^wp-admin-bar-/, '' ),
		} );
	} );
} );
