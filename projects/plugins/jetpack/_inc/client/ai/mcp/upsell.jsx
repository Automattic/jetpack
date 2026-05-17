/**
 * MCP upsell card — shown when the current site does not have an MCP-capable plan.
 *
 * The CTA destination is read from `jetpackAiSettings.upgradeUrl`, which is
 * built server-side via `Redirect::get_url( 'jetpack-ai-upgrade-url-for-jetpack-sites' )`
 * so the target can be changed via the Jetpack redirect service without
 * shipping a code change. The previous implementation hardcoded
 * `wordpress.com/plans/<host>`, which 403'd for non-.com sites (AIINT-404).
 *
 * Visual layout mirrors Activity Log's `UpsellCallout` (copy on the left,
 * illustration on the right on viewports wider than 600px; stacks
 * vertically below that with the copy on top and the illustration below).
 */

import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect } from 'react';
import analytics from 'lib/analytics';
import illustrationUrl from './upsell-illustration.svg';
import './style.scss';

const UPSELL_SOURCE = 'jetpack-ai-mcp-upsell';

const { upgradeUrl } = window?.jetpackAiSettings ?? {};

/**
 * MCP upsell card.
 *
 * @return {object} Component markup.
 */
export default function McpUpsell() {
	// Fire once when the upsell first renders. The parent in main.jsx only
	// mounts <McpUpsell> when the site lacks MCP access, so component
	// lifecycle is the right place to record the impression — no extra
	// gating needed here.
	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_mcp_upsell_viewed', {
			source: UPSELL_SOURCE,
		} );
	}, [] );

	const onClickUpgrade = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_mcp_upsell_cta_click', {
			source: UPSELL_SOURCE,
		} );
	}, [] );

	return (
		<div className="jetpack-ai-mcp__upsell-callout">
			<div className="jetpack-ai-mcp__upsell-callout-content">
				<h2 className="jetpack-ai-mcp__upsell-callout-title">
					{ __( 'Connect AI agents to your site', 'jetpack' ) }
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
				<Button variant="primary" href={ upgradeUrl } onClick={ onClickUpgrade }>
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
