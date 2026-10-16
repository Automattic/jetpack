import apiFetch from '@wordpress/api-fetch';
import { wpcomTrackEvent } from '../../../common/tracks';

/**
 * Whether MCP access is on for this site, read from the same endpoint as the Jetpack AI Hub.
 *
 * @param {object} api        - Endpoint from the server.
 * @param {string} api.path   - REST path.
 * @param {string} api.format - 'wpcom' for the native endpoint, 'jetpack' for Jetpack's proxy.
 * @return {Promise<boolean>} True when MCP access is on, or when the site has no MCP access to set up.
 */
const isMcpEnabled = async ( { path, format } ) => {
	const data = await apiFetch( { path } );

	if ( format === 'wpcom' ) {
		return data?.has_mcp_plan === false || data?.site_level_enabled === true;
	}

	return (
		data?.has_mcp_access === false || data?.mcp_abilities?.sites?.[ 0 ]?.site_level_enabled === true
	);
};

document.addEventListener( 'DOMContentLoaded', () => {
	const banner = document.getElementById( 'wpcom-ai-assistant-banner' );

	if ( ! banner ) {
		return;
	}

	// Shared context props, computed server-side. Defensive fallback so the
	// events still fire prop-less if the global is ever absent.
	const trackProps = window.wpcomAiAssistantBanner?.trackProps || {};
	const mcpSettingsApi = window.wpcomAiAssistantBanner?.mcpSettingsApi;

	// The server hides the banner when the WordPress Agent is already on. Show it only
	// while MCP access is still off, and keep it hidden if the check fails.
	if ( banner.hidden ) {
		if ( mcpSettingsApi?.path ) {
			isMcpEnabled( mcpSettingsApi )
				.then( enabled => {
					if ( ! enabled ) {
						banner.hidden = false;
						wpcomTrackEvent( 'jetpack_ai_assistant_banner_impression', trackProps );
					}
				} )
				.catch( () => {} );
		}
	} else {
		wpcomTrackEvent( 'jetpack_ai_assistant_banner_impression', trackProps );
	}

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
