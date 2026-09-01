/**
 * Connect-account callout for a connected site whose current user has no
 * WordPress.com connection.
 */

import { speak } from '@wordpress/a11y';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
import illustrationUrl from './upsell-illustration.svg';
import './style.scss';

/**
 * Connect-account callout card.
 *
 * @return {object} Component markup.
 */
export default function McpConnectCallout() {
	// Announce like the notice this replaces: the design system does it via speak().
	useEffect( () => {
		speak( __( 'A user connection lets agents securely act on your behalf.', 'jetpack' ) );
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
					{ __( 'A user connection lets agents securely act on your behalf.', 'jetpack' ) }
				</p>
				<Button variant="primary" href="admin.php?page=my-jetpack#/connection">
					{ __( 'Connect your user account', 'jetpack' ) }
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
