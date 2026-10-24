/**
 * Where each agent installs the WordPress.com connector, for the connect
 * card's buttons (on Overview, or on Settings when there is no Overview).
 *
 * WordPress.com sites go straight to each agent's own directory listing.
 * Self-hosted sites keep the redirect-service sources, which land on the
 * self-hosted setup instructions instead.
 */

import { getRedirectUrl } from '@automattic/jetpack-components';

export const AGENT_CONNECTORS = {
	claude: {
		name: 'Claude', // Product name, not translated.
		url: 'https://claude.ai/directory/wordpress-com',
		selfHostedSlug: 'jetpack-ai-hub-overview-quick-start-claude-self-hosted',
	},
	chatgpt: {
		name: 'ChatGPT', // Product name, not translated.
		url: 'https://chatgpt.com/plugins/wordpress-com?open_in_app',
		selfHostedSlug: 'jetpack-ai-hub-overview-quick-start-chatgpt-self-hosted',
	},
};

/**
 * The install link for an agent's connector on this kind of site.
 *
 * @param {string} agent - 'claude' | 'chatgpt'.
 * @return {string} The URL.
 */
export function getAgentConnectorUrl( agent ) {
	const connector = AGENT_CONNECTORS[ agent ];
	return window?.jetpackAiSettings?.isSelfHosted === true
		? getRedirectUrl( connector.selfHostedSlug )
		: connector.url;
}
