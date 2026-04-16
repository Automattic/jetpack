/**
 * MCP upsell card — shown when the current site does not have an MCP-capable plan.
 */

import { Button, Card, CardBody, Icon } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { commentContent, starFilled } from '@wordpress/icons';

const { upgradeUrl } = window?.jetpackAiSettings ?? {};

/**
 * Simple illustration: a browser mockup with a WordPress logo and an AI prompt bar,
 * approximating the Figma design.
 *
 * @return {object} SVG element.
 */
function UpsellIllustration() {
	return (
		<svg
			className="jetpack-ai-mcp-upsell__illustration"
			viewBox="0 0 220 160"
			xmlns="http://www.w3.org/2000/svg"
			aria-hidden="true"
			focusable="false"
		>
			{ /* Dotted background */ }
			<rect width="220" height="160" rx="8" fill="#f0f0f1" />
			<pattern id="dots" x="0" y="0" width="12" height="12" patternUnits="userSpaceOnUse">
				<circle cx="2" cy="2" r="1" fill="#ccc" />
			</pattern>
			<rect width="220" height="160" rx="8" fill="url(#dots)" />

			{ /* Browser window */ }
			<rect x="24" y="20" width="172" height="120" rx="6" fill="white" />
			{ /* Title bar */ }
			<rect x="24" y="20" width="172" height="22" rx="6" fill="#e0e0e0" />
			<rect x="24" y="30" width="172" height="12" fill="#e0e0e0" />
			{ /* Traffic lights */ }
			<circle cx="37" cy="31" r="4" fill="#ff5f57" />
			<circle cx="49" cy="31" r="4" fill="#febc2e" />
			<circle cx="61" cy="31" r="4" fill="#28c840" />

			{ /* WordPress logo (simplified W) */ }
			<circle cx="110" cy="82" r="28" fill="#3858e9" opacity="0.12" />
			<text
				x="110"
				y="89"
				textAnchor="middle"
				fontFamily="Georgia, serif"
				fontSize="28"
				fontWeight="bold"
				fill="#3858e9"
				opacity="0.6"
			>
				W
			</text>

			{ /* AI prompt bar */ }
			<rect x="38" y="118" width="144" height="14" rx="7" fill="#00ba37" opacity="0.2" />
			<rect
				x="38"
				y="118"
				width="144"
				height="14"
				rx="7"
				stroke="#00ba37"
				strokeWidth="1.5"
				fill="white"
			/>
			<circle cx="154" cy="125" r="4" fill="#00ba37" />
			<line x1="153" y1="123" x2="155" y2="123" stroke="white" strokeWidth="1.5" />
			<line x1="154" y1="122" x2="154" y2="128" stroke="white" strokeWidth="1.5" />
		</svg>
	);
}

/**
 * MCP upsell card.
 *
 * @return {object} Component markup.
 */
export default function McpUpsell() {
	return (
		<Card className="jetpack-ai-mcp-upsell">
			<CardBody>
				<div className="jetpack-ai-mcp-upsell__inner">
					<div className="jetpack-ai-mcp-upsell__content">
						<span className="jetpack-ai-mcp-upsell__icon">
							<Icon icon={ commentContent } size={ 32 } />
						</span>
						<h2 className="jetpack-ai-mcp-upsell__title">
							{ __( 'Your dream site is just a prompt away', 'jetpack' ) }
						</h2>
						<p className="jetpack-ai-mcp-upsell__description">
							{ __(
								'Get AI-powered assistance to help you build, edit, and redesign your site with ease.',
								'jetpack'
							) }
						</p>
						<p className="jetpack-ai-mcp-upsell__plan-text">
							{ __( 'Available on the WordPress.com Business and Commerce plans.', 'jetpack' ) }
						</p>
						{ upgradeUrl && (
							<Button
								className="jetpack-ai-mcp-upsell__cta"
								variant="primary"
								href={ upgradeUrl }
								icon={ starFilled }
							>
								{ __( 'Upgrade plan', 'jetpack' ) }
							</Button>
						) }
					</div>
					<UpsellIllustration />
				</div>
			</CardBody>
		</Card>
	);
}
