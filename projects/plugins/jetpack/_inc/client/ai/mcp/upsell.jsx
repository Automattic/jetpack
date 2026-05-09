/**
 * MCP upsell card — shown when the current site does not have an MCP-capable plan.
 *
 * Routes through `useProductCheckoutWorkflow` so the destination is correct
 * regardless of host: WPCOM Simple, WoA, Pressable, and self-hosted all
 * land on `wordpress.com/checkout/{siteSuffix}/jetpack_ai_yearly` with a
 * return URL back to this admin page. The previous implementation hardcoded
 * `wordpress.com/plans/<host>`, which 403'd for non-.com sites (AIINT-404).
 *
 * Visual layout mirrors Activity Log's `UpsellCallout` (copy on the left,
 * illustration on the right; column-reverse on mobile).
 */

import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
import analytics from 'lib/analytics';
import illustrationUrl from '../../../../images/products/product-jetpack-ai.svg';
import './style.scss';

const PRODUCT_SLUG = 'jetpack_ai_yearly';
const UPSELL_SOURCE = 'jetpack-ai-mcp-upsell';

/**
 * MCP upsell card.
 *
 * @return {object} Component markup.
 */
export default function McpUpsell() {
	const { run, hasCheckoutStarted } = useProductCheckoutWorkflow( {
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

	const onClickUpgrade = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_mcp_upsell_cta_click', {
			product_slug: PRODUCT_SLUG,
		} );
		run();
	}, [ run ] );

	return (
		<div className="jetpack-ai-mcp__upsell-callout">
			<div className="jetpack-ai-mcp__upsell-callout-content">
				<h2 className="jetpack-ai-mcp__upsell-callout-title">
					{ __( 'Your dream site is just a prompt away', 'jetpack' ) }
				</h2>
				<p className="jetpack-ai-mcp__upsell-callout-description">
					{ __(
						'Get AI-powered assistance to help you build, edit, and redesign your site with ease.',
						'jetpack'
					) }
				</p>
				<p className="jetpack-ai-mcp__upsell-callout-description">
					{ __( 'Upgrade your plan to give external AI agents access to your site.', 'jetpack' ) }
				</p>
				<Button
					variant="primary"
					onClick={ onClickUpgrade }
					isBusy={ hasCheckoutStarted }
					disabled={ hasCheckoutStarted }
				>
					{ __( 'Upgrade plan', 'jetpack' ) }
				</Button>
			</div>
			<img
				className="jetpack-ai-mcp__upsell-callout-image"
				src={ illustrationUrl }
				alt=""
				role="presentation"
			/>
		</div>
	);
}
