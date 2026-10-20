/**
 * MCP Read tools view.
 *
 * Lists read-only tools grouped by display group, with per-tool and
 * per-group toggles. A page-level "Enable all" toggle sits at the top.
 * Individual tool toggles are collapsed behind a per-group chevron.
 */

import {
	Card,
	CardBody,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { isWriteTool } from './categories';
import { getOverridesToMatch } from './group-intents';
import { groupToolsByGroup } from './groups';
import McpGroupCard, { McpToolSections } from './mcp-group-card';
import McpToolbar from './mcp-toolbar';
import { recordMcpTracksEvent } from './tracks';
import {
	getAccountMcpAbilities,
	getGroupDescriptors,
	getSiteContextToolIds,
	getSiteLevelEnabled,
	getSiteMcpAbilities,
	mergeSiteMcpAbilities,
} from './utils';

/**
 * MCP Read tools view.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.mcpAbilities  - Full mcp_abilities object from the API.
 * @param {number}   props.blogId        - Current site's blog ID.
 * @param {Set}      props.savingToolIds - Set of toolIds currently being saved.
 * @param {Function} props.onUpdate      - Called with partial mcp_abilities update.
 * @return {object} Component markup.
 */
export default function McpRead( { mcpAbilities, blogId, savingToolIds, onUpdate } ) {
	const accountAbilities = getAccountMcpAbilities( mcpAbilities ?? {} );
	const siteContextToolIds = getSiteContextToolIds( mcpAbilities ?? {} );
	const siteAbilities = getSiteMcpAbilities( mcpAbilities ?? {}, blogId );
	const siteAccountAbilities = siteContextToolIds.size
		? Object.fromEntries(
				Object.entries( accountAbilities ).filter( ( [ id ] ) => siteContextToolIds.has( id ) )
			)
		: accountAbilities;
	const isMcpEnabled = getSiteLevelEnabled( mcpAbilities ?? {}, blogId );
	const mergedAbilities = mergeSiteMcpAbilities(
		siteAccountAbilities,
		siteAbilities,
		isMcpEnabled
	);

	const allTools = Object.entries( mergedAbilities ).filter( ( [ , t ] ) => t.visible !== false );
	const readTools = allTools.filter( ( [ id, t ] ) => ! isWriteTool( id, t ) );

	const groupDescriptors = getGroupDescriptors( mcpAbilities ?? {} );
	const groups = groupToolsByGroup( readTools, groupDescriptors );

	const handleToolChange = useCallback(
		( toolId, enabled ) => {
			recordMcpTracksEvent( 'jetpack_mcp_allowlist_updated', {
				ability_name: toolId,
				enabled,
				view: 'read',
			} );
			onUpdate( {
				sites: [
					{
						blog_id: blogId,
						abilities: { [ toolId ]: enabled },
					},
				],
			} );
		},
		[ blogId, onUpdate ]
	);

	const pageAllEnabled = readTools.length > 0 && readTools.every( ( [ , t ] ) => t.enabled );
	const isSavingAny = readTools.some( ( [ id ] ) => savingToolIds.has( id ) );

	const handlePageToggle = useCallback(
		enabled => {
			const overrides = getOverridesToMatch( readTools, enabled );
			if ( ! overrides ) {
				return;
			}
			recordMcpTracksEvent( 'jetpack_mcp_allowlist_updated', {
				enabled,
				view: 'read',
				scope: 'page',
			} );
			onUpdate( {
				sites: [
					{
						blog_id: blogId,
						abilities: overrides,
					},
				],
			} );
		},
		[ blogId, readTools, onUpdate ]
	);

	const handleGroupEnableAll = useCallback(
		( enabled, { name: groupName, tools: groupTools } ) => {
			const overrides = getOverridesToMatch( groupTools, enabled );
			if ( ! overrides ) {
				return;
			}
			recordMcpTracksEvent( 'jetpack_mcp_allowlist_updated', {
				enabled,
				view: 'read',
				scope: 'group',
				group: groupName ?? 'other',
			} );
			onUpdate( {
				sites: [
					{
						blog_id: blogId,
						abilities: overrides,
					},
				],
			} );
		},
		[ blogId, onUpdate ]
	);

	return (
		<Stack direction="column" gap="lg">
			<McpToolbar
				allEnabled={ pageAllEnabled }
				isDisabled={ isSavingAny || readTools.length === 0 }
				onEnableAll={ handlePageToggle }
			/>

			{ groups.length > 0 ? (
				<Stack direction="column" gap="lg">
					{ groups.map( ( { group: descriptor, label, tools: groupTools } ) => (
						<McpGroupCard
							key={ descriptor?.name ?? '__other__' }
							label={ label }
							description={ descriptor?.description }
							allEnabled={ groupTools.every( ( [ , t ] ) => t.enabled ) }
							isSaving={ groupTools.some( ( [ id ] ) => savingToolIds.has( id ) ) }
							group={ { name: descriptor?.name ?? null, tools: groupTools } }
							onEnableAll={ handleGroupEnableAll }
						>
							<McpToolSections
								tools={ groupTools }
								savingToolIds={ savingToolIds }
								onToolChange={ handleToolChange }
							/>
						</McpGroupCard>
					) ) }
				</Stack>
			) : (
				<Card>
					<CardBody>
						<Text variant="muted">{ __( 'No read tools available.', 'jetpack' ) }</Text>
					</CardBody>
				</Card>
			) }
		</Stack>
	);
}
