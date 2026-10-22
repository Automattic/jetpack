/**
 * Anchors for the MCP Read and Write views. The hash is the router, so a tool
 * anchor goes in the path: `#/mcp/read/<anchor>`. Anchors may contain a slash.
 */

/**
 * Split a hash path into its view and an optional trailing anchor.
 *
 * @param {string}   path        - Hash path without the leading `#/`.
 * @param {string[]} views       - Known view keys.
 * @param {string[]} anchorViews - Views that accept a trailing anchor.
 * @return {{view: string|null, anchor: string|null}} The matched view and anchor.
 */
export function splitViewAnchor( path, views, anchorViews ) {
	if ( views.includes( path ) ) {
		return { view: path, anchor: null };
	}
	const view = anchorViews.find( v => path.startsWith( `${ v }/` ) ) ?? null;
	const anchor = view ? path.slice( view.length + 1 ) : '';
	return { view, anchor: anchor || null };
}

export const getToolDomId = toolId => `jetpack-ai-mcp-tool-${ toolId }`;

export const getGroupDomId = groupName => `jetpack-ai-mcp-group-${ groupName ?? 'other' }`;
