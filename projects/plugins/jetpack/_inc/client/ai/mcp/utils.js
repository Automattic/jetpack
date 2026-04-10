/**
 * MCP utility functions.
 *
 * Ported from client/me/mcp/utils.js in wp-calypso.
 * Provides helpers for reading and merging MCP ability data from user settings.
 */

/**
 * Get account-level MCP abilities from user settings.
 *
 * @param {object} userSettings - The user settings object (mcp_abilities response body)
 * @return {Record<string, Object>} Account-level abilities keyed by tool ID
 */
export function getAccountMcpAbilities( userSettings ) {
	if ( userSettings?.account ) {
		return userSettings.account;
	}
	const mcpData = userSettings?.mcp_abilities;
	if ( mcpData?.account ) {
		return mcpData.account;
	}
	if ( mcpData ) {
		return mcpData;
	}
	return {};
}

/**
 * Get the set of tool IDs that are relevant in a site context.
 *
 * @param {object} userSettings - The user settings object (mcp_abilities response body).
 * @return {Set<string>} Set of tool IDs available in site context.
 */
export function getSiteContextToolIds( userSettings ) {
	const siteTools = userSettings?.mcp_abilities?.site || {};
	return new Set( Object.keys( siteTools ) );
}

/**
 * Get site-level ability overrides for a specific site.
 *
 * @param {object} userSettings - The user settings object (mcp_abilities response body).
 * @param {number} siteId       - The blog ID of the site.
 * @return {Record<string, boolean>} Site-level ability overrides keyed by tool ID.
 */
export function getSiteMcpAbilities( userSettings, siteId ) {
	const mcpSites = userSettings?.mcp_abilities?.sites || [];
	const siteEntry = mcpSites.find( site => site.blog_id === parseInt( siteId ) );
	return siteEntry?.abilities || {};
}

/**
 * Merge account-level abilities with site-level overrides.
 *
 * @param {Record<string, Object>}  accountAbilities - Account-level tool definitions.
 * @param {Record<string, boolean>} siteAbilities    - Site-level enabled overrides by tool ID.
 * @return {Record<string, Object>} Merged abilities with site overrides applied.
 */
export function mergeSiteMcpAbilities( accountAbilities, siteAbilities ) {
	return Object.fromEntries(
		Object.entries( accountAbilities ).map( ( [ toolId, tool ] ) => [
			toolId,
			{
				...tool,
				enabled: toolId in siteAbilities ? siteAbilities[ toolId ] : tool.enabled,
			},
		] )
	);
}

/**
 * Check if site-level MCP is enabled for a specific site.
 *
 * @param {object} userSettings - The user settings object (mcp_abilities response body).
 * @param {number} siteId       - The blog ID of the site.
 * @return {boolean} Whether site-level MCP access is enabled.
 */
export function getSiteLevelEnabled( userSettings, siteId ) {
	const mcpAbilities = userSettings?.mcp_abilities;
	const mcpSites = mcpAbilities?.sites || [];
	const siteEntry = mcpSites.find( site => site.blog_id === parseInt( siteId ) );
	if ( siteEntry ) {
		return siteEntry.site_level_enabled === true;
	}
	return mcpAbilities?.site_level_enabled_default === true;
}
