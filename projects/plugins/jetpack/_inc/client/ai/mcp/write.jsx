/**
 * MCP Write tools view.
 *
 * Lists write tools (readonly === false) grouped by display group, with
 * per-tool and per-group toggles. A page-level "Enable all" toggle sits at
 * the top. Individual tool toggles are collapsed behind a per-group chevron.
 */

import {
	Card,
	CardBody,
	SearchControl,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import { getGroupDomId } from './anchors';
import { isWriteTool } from './categories';
import { getOverridesToMatch } from './group-intents';
import { groupToolsByGroup } from './groups';
import McpGroupCard, { McpToolSections } from './mcp-group-card';
import McpToolbar from './mcp-toolbar';
import RemoteAbilitiesSection from './remote-abilities-section';
import { recordMcpTracksEvent } from './tracks';
import useToolSearch from './use-tool-search';
import {
	getAccountMcpAbilities,
	getGroupDescriptors,
	getSiteContextToolIds,
	getSiteLevelEnabled,
	getSiteMcpAbilities,
	mergeSiteMcpAbilities,
} from './utils';

/**
 * MCP Write tools view.
 *
 * @param {object}   props                   - Component props.
 * @param {object}   props.mcpAbilities      - Full mcp_abilities object from the API.
 * @param {number}   props.blogId            - Current site's blog ID.
 * @param {Set}      props.savingToolIds     - Set of toolIds currently being saved.
 * @param {Function} props.onUpdate          - Called with partial mcp_abilities update.
 * @param {object}   [props.remoteAbilities] - Published-abilities state; omit to hide that section.
 * @param {string}   [props.anchor]          - Tool id from the URL hash, if any.
 * @return {object} Component markup.
 */
export default function McpWrite( {
	mcpAbilities,
	blogId,
	savingToolIds,
	onUpdate,
	anchor,
	remoteAbilities = null,
} ) {
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
	const writeTools = allTools.filter( ( [ id, t ] ) => isWriteTool( id, t ) );

	const groupDescriptors = getGroupDescriptors( mcpAbilities ?? {} );
	const { query, setQuery, isSearching, isVisible } = useToolSearch();
	const groups = groupToolsByGroup( writeTools, groupDescriptors );

	const visibleGroups = groups
		.map( g => ( { ...g, visibleTools: g.tools.filter( isVisible ) } ) )
		.filter( g => g.visibleTools.length > 0 );

	const handleToolChange = useCallback(
		( toolId, enabled ) => {
			recordMcpTracksEvent( 'jetpack_mcp_allowlist_updated', {
				ability_name: toolId,
				enabled,
				view: 'write',
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

	const pageAllEnabled = writeTools.length > 0 && writeTools.every( ( [ , t ] ) => t.enabled );
	const isSavingAny = writeTools.some( ( [ id ] ) => savingToolIds.has( id ) );

	const handlePageToggle = useCallback(
		enabled => {
			const overrides = getOverridesToMatch( writeTools, enabled );
			if ( ! overrides ) {
				return;
			}
			recordMcpTracksEvent( 'jetpack_mcp_allowlist_updated', {
				enabled,
				view: 'write',
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
		[ blogId, writeTools, onUpdate ]
	);

	const handleGroupEnableAll = useCallback(
		( enabled, { name: groupName, tools: groupTools } ) => {
			const overrides = getOverridesToMatch( groupTools, enabled );
			if ( ! overrides ) {
				return;
			}
			recordMcpTracksEvent( 'jetpack_mcp_allowlist_updated', {
				enabled,
				view: 'write',
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
		<Stack direction="column" gap="md">
			<McpToolbar
				allEnabled={ pageAllEnabled }
				isDisabled={ isSavingAny || writeTools.length === 0 }
				onEnableAll={ handlePageToggle }
			>
				<SearchControl
					size="compact"
					label={ __( 'Search tools', 'jetpack' ) }
					value={ query }
					onChange={ setQuery }
				/>
			</McpToolbar>

			{ visibleGroups.length > 0 ? (
				<Stack direction="column" gap="md">
					{ visibleGroups.map(
						( { group: descriptor, label, tools: groupTools, visibleTools } ) => (
							<McpGroupCard
								key={ descriptor?.name ?? '__other__' }
								id={ getGroupDomId( descriptor?.name ) }
								forceOpen={ isSearching }
								anchorToolId={ groupTools.some( ( [ id ] ) => id === anchor ) ? anchor : null }
								label={ label }
								description={ descriptor?.description }
								allEnabled={ groupTools.every( ( [ , t ] ) => t.enabled ) }
								isSaving={ groupTools.some( ( [ id ] ) => savingToolIds.has( id ) ) }
								group={ { name: descriptor?.name ?? null, tools: groupTools } }
								onEnableAll={ handleGroupEnableAll }
							>
								<McpToolSections
									tools={ visibleTools }
									view="mcp/write"
									savingToolIds={ savingToolIds }
									onToolChange={ handleToolChange }
								/>
							</McpGroupCard>
						)
					) }
				</Stack>
			) : (
				<Card>
					<CardBody>
						<Text variant="muted">
							{ isSearching
								? __( 'No tools match your search.', 'jetpack' )
								: __( 'No write tools are available for this site.', 'jetpack' ) }
						</Text>
					</CardBody>
				</Card>
			) }

			{ remoteAbilities && (
				<RemoteAbilitiesSection
					view="write"
					mcpAbilities={ mcpAbilities }
					blogId={ blogId }
					remoteAbilities={ remoteAbilities }
					defaultEnabled={ pageAllEnabled }
					query={ query }
					anchor={ anchor }
					savingToolIds={ savingToolIds }
					onUpdate={ onUpdate }
				/>
			) }
		</Stack>
	);
}
