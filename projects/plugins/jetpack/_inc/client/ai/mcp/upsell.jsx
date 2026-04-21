/**
 * MCP upsell card — shown when the current site does not have an MCP-capable plan.
 */

import { UpsellBanner } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

const { upgradeUrl } = window?.jetpackAiSettings ?? {};

/**
 * MCP upsell card.
 *
 * @return {object} Component markup.
 */
export default function McpUpsell() {
	return (
		<UpsellBanner
			title={ __( 'Your dream site is just a prompt away', 'jetpack' ) }
			description={ __(
				'Get AI-powered assistance to help you build, edit, and redesign your site with ease.<br/>Available on the WordPress.com Business and Commerce plans.',
				'jetpack'
			) }
			primaryCtaLabel={ __( 'Upgrade plan', 'jetpack' ) }
			primaryCtaURL={ upgradeUrl }
		/>
	);
}
