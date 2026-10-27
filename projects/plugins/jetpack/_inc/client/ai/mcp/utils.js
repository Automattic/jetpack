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
	// Support both flat format (userSettings.site) and nested (userSettings.mcp_abilities.site).
	const siteTools = userSettings?.site || userSettings?.mcp_abilities?.site || {};
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
	// Support both flat format (userSettings.sites) and nested (userSettings.mcp_abilities.sites).
	const mcpSites = userSettings?.sites || userSettings?.mcp_abilities?.sites || [];
	const siteEntry = mcpSites.find( site => site.blog_id === parseInt( siteId ) );
	return siteEntry?.abilities || {};
}

/**
 * Get the remote-ability allowlist for a site.
 *
 * @param {object}        userSettings - The mcp_abilities object.
 * @param {string|number} siteId       - The site ID.
 * @return {Record<string, boolean>} Group and ability keys mapped to enabled.
 */
export function getSiteRemoteGroups( userSettings, siteId ) {
	const mcpSites = userSettings?.sites || [];
	const siteEntry = mcpSites.find( site => site.blog_id === parseInt( siteId ) );
	return siteEntry?.remote_groups || {};
}

/**
 * The allowlist group key of a remote ability: `{read|write|destructive}:{namespace}`.
 * Matches the server: destructive wins over readonly, and only a strict readonly is Read.
 *
 * @param {string} name          - Ability name, e.g. `jetpack-boost/get-modules`.
 * @param {object} [annotations] - Published annotations (readonly, destructive).
 * @return {string} Group key.
 */
export function getRemoteAbilityGroupKey( name, annotations = {} ) {
	const namespace = String( name ).split( '/' )[ 0 ].toLowerCase();
	if ( annotations?.destructive === true ) {
		return `destructive:${ namespace }`;
	}
	if ( annotations?.readonly === true ) {
		return `read:${ namespace }`;
	}
	return `write:${ namespace }`;
}

/**
 * The view an ability belongs on: anything that is not a strict read is Write.
 *
 * @param {string} name          - Ability name.
 * @param {object} [annotations] - Published annotations.
 * @return {'read'|'write'} View key.
 */
export function getRemoteAbilityCategory( name, annotations = {} ) {
	return getRemoteAbilityGroupKey( name, annotations ).startsWith( 'read:' ) ? 'read' : 'write';
}

/**
 * The ability-level allowlist key: `{group}/{ability}`. It wins over the group key.
 *
 * @param {string} name          - Ability name.
 * @param {object} [annotations] - Published annotations.
 * @return {string} Ability-level key.
 */
export function getRemoteAbilityKey( name, annotations = {} ) {
	const namespace = String( name ).split( '/' )[ 0 ];
	return `${ getRemoteAbilityGroupKey( name, annotations ) }${ String( name ).slice(
		namespace.length
	) }`.toLowerCase();
}

/**
 * Whether a remote ability is enabled: the ability-level key when saved, else the group
 * key, else the default.
 *
 * @param {Record<string, boolean>} savedGroups      - Saved allowlist.
 * @param {string}                  name             - Ability name.
 * @param {object}                  [annotations]    - Published annotations.
 * @param {boolean}                 [defaultEnabled] - State when neither key is saved.
 * @return {boolean} True when enabled.
 */
export function isRemoteAbilityEnabled(
	savedGroups,
	name,
	annotations = {},
	defaultEnabled = false
) {
	return (
		savedGroups[ getRemoteAbilityKey( name, annotations ) ] ??
		savedGroups[ getRemoteAbilityGroupKey( name, annotations ) ] ??
		defaultEnabled
	);
}

/**
 * Merge account-level abilities with site-level overrides.
 *
 * @param {Record<string, Object>}  accountAbilities - Account-level tool definitions.
 * @param {Record<string, boolean>} siteAbilities    - Explicit per-site overrides by tool ID (only tools the user has explicitly set).
 * @param {boolean|null}            defaultEnabled   - Fallback enabled state for tools not in siteAbilities (typically site_level_enabled). When null, falls back to the account-level tool.enabled value.
 * @return {Record<string, Object>} Merged abilities with site overrides applied.
 */
export function mergeSiteMcpAbilities( accountAbilities, siteAbilities, defaultEnabled = null ) {
	return Object.fromEntries(
		Object.entries( accountAbilities ).map( ( [ toolId, tool ] ) => [
			toolId,
			{
				...tool,
				enabled:
					toolId in siteAbilities ? siteAbilities[ toolId ] : ( defaultEnabled ?? tool.enabled ),
			},
		] )
	);
}

/**
 * Get the ordered display-group descriptors for the settings UI's middle
 * grouping layer, sorted by their `order` field. A group defaults to a STRAP
 * facade, but some facades are merged into another group (e.g. Create Site
 * into Site).
 *
 * @param {object} mcpAbilities - The mcp_abilities response object.
 * @return {Array<{name: string, label: string, description: string, order: number}>} Group descriptors sorted by order.
 */
export function getGroupDescriptors( mcpAbilities ) {
	const groups = mcpAbilities?.groups ?? [];
	return [ ...groups ].sort( ( a, b ) => a.order - b.order );
}

/**
 * Get the account-level group "enable all" intents.
 * Keys are `read`, `write`, or a compound slug like `"write:site"`.
 *
 * @param {object} mcpAbilities - The mcp_abilities response object.
 * @return {Record<string, boolean>} Map of intent keys to enabled state.
 */
export function getGroupIntents( mcpAbilities ) {
	return mcpAbilities?.group_intents ?? {};
}

/**
 * Check if site-level MCP is enabled for a specific site.
 *
 * @param {object} userSettings - The user settings object (mcp_abilities response body).
 * @param {number} siteId       - The blog ID of the site.
 * @return {boolean} Whether site-level MCP access is enabled.
 */
export function getSiteLevelEnabled( userSettings, siteId ) {
	// Support both flat format (userSettings.sites) and nested (userSettings.mcp_abilities.sites).
	const mcpSites = userSettings?.sites || userSettings?.mcp_abilities?.sites || [];
	const siteEntry = mcpSites.find( site => site.blog_id === parseInt( siteId ) );
	if ( siteEntry ) {
		return siteEntry.site_level_enabled === true;
	}
	return (
		( userSettings?.site_level_enabled_default ??
			userSettings?.mcp_abilities?.site_level_enabled_default ) === true
	);
}
