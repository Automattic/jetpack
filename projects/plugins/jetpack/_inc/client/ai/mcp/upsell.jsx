/**
 * MCP upsell card — shown when the current site does not have an MCP-capable plan.
 *
 * Routes through `useProductCheckoutWorkflow` so the destination is correct
 * regardless of host: WPCOM Simple, WoA, Pressable, and self-hosted all
 * land on `wordpress.com/checkout/{siteSuffix}/jetpack_ai_yearly` with a
 * return URL back to this admin page. The previous implementation hardcoded
 * `wordpress.com/plans/<host>`, which 403'd for non-.com sites (AIINT-404).
 */

import { UpsellBanner } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
import analytics from 'lib/analytics';

const PRODUCT_SLUG = 'jetpack_ai_yearly';
const UPSELL_SOURCE = 'jetpack-ai-mcp-upsell';

/**
 * MCP upsell card.
 *
 * @return {object} Component markup.
 */
export default function McpUpsell() {
	const { run } = useProductCheckoutWorkflow( {
		productSlug: PRODUCT_SLUG,
		redirectUrl: typeof window !== 'undefined' ? window.location.href : '',
		from: UPSELL_SOURCE,
	} );

	// Fire once when the upsell first renders. The parent in main.jsx only
	// mounts <McpUpsell> when the site lacks MCP access, so component
	// lifecycle is the right place to record the impression — no extra
	// gating needed here.
	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_mcp_upsell_viewed', {
			product_slug: PRODUCT_SLUG,
		} );
	}, [] );

	const onClickUpgrade = useCallback(
		event => {
			analytics.tracks.recordEvent( 'jetpack_mcp_upsell_cta_click', {
				product_slug: PRODUCT_SLUG,
			} );
			run( event );
		},
		[ run ]
	);

	return (
		<UpsellBanner
			title={ __( 'Your dream site is just a prompt away', 'jetpack' ) }
			description={ __(
				'Get AI-powered assistance to help you build, edit, and redesign your site with ease. Upgrade your plan to give external AI agents access to your site.',
				'jetpack'
			) }
			primaryCtaLabel={ __( 'Upgrade plan', 'jetpack' ) }
			// `run` calls `event.preventDefault()` then navigates to the
			// checkout URL itself, so the `#` href is only ever a no-op
			// fallback. UpsellBanner requires `primaryCtaURL` to render the
			// button, hence the placeholder.
			primaryCtaURL="#"
			primaryCtaOnClick={ onClickUpgrade }
		/>
	);
}
