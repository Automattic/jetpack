/**
 * MCP Read tools view.
 *
 * Lists read-only tools grouped by display group, with per-tool and
 * per-group toggles. A page-level "Enable all" toggle sits at the top.
 * Individual tool toggles are collapsed behind a per-group chevron.
 */

import {
	Button,
	Card,
	CardBody,
	ToggleControl,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { Fragment, useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { Stack } from '@wordpress/ui';
import analytics from 'lib/analytics';
import { isWriteTool } from './categories';
import { getOverridesToMatch } from './group-intents';
import { groupToolsByGroup, groupToolsBySubCategory } from './groups';
import {
	getAccountMcpAbilities,
	getGroupDescriptors,
	getSiteContextToolIds,
	getSiteLevelEnabled,
	getSiteMcpAbilities,
	mergeSiteMcpAbilities,
} from './utils';

/**
 * A single tool toggle row.
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.toolId        - Tool identifier.
 * @param {object}   props.tool          - Tool descriptor from the API.
 * @param {Set}      props.savingToolIds - Set of toolIds currently being saved.
 * @param {Function} props.onToggle      - Called with (toolId, enabled).
 * @return {object} Component markup.
 */
function ToolToggle( { toolId, tool, savingToolIds, onToggle } ) {
	const handleChange = useCallback( checked => onToggle( toolId, checked ), [ toolId, onToggle ] );
	return (
		<ToggleControl
			__nextHasNoMarginBottom
			checked={ tool.enabled }
			disabled={ savingToolIds.has( toolId ) }
			label={ tool.title }
			help={ tool.description }
			onChange={ handleChange }
		/>
	);
}

const LABEL_SHOW_OPERATIONS = __( 'Show operations', 'jetpack' );
const LABEL_HIDE_OPERATIONS = __( 'Hide operations', 'jetpack' );

/**
 * Collapsible card for one display group.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.descriptor    - Group descriptor from the API, or null for "Other".
 * @param {string}   props.label         - Display label for the group.
 * @param {Array}    props.groupTools    - Tool entries for this group.
 * @param {Set}      props.savingToolIds - Set of toolIds currently being saved.
 * @param {Function} props.onToolChange  - Called with (toolId, enabled).
 * @param {Function} props.onEnableAll   - Called with (groupName|null, groupTools, enabled).
 * @return {object} Component markup.
 */
function GroupCard( { descriptor, label, groupTools, savingToolIds, onToolChange, onEnableAll } ) {
	const allGroupEnabled = groupTools.every( ( [ , t ] ) => t.enabled );
	const [ isOpen, setIsOpen ] = useState( false );

	const handleToggle = useCallback(
		checked => onEnableAll( descriptor?.name ?? null, groupTools, checked ),
		[ descriptor, groupTools, onEnableAll ]
	);
	const handleChevron = useCallback( () => setIsOpen( open => ! open ), [] );

	return (
		<Card>
			<CardBody>
				<div className="jetpack-ai-mcp__group-header">
					<Stack direction="column" gap="xs" className="jetpack-ai-mcp__group-info">
						<Text weight={ 600 } size={ 14 }>
							{ label }
						</Text>
						{ descriptor?.description && (
							<Text variant="muted" size={ 12 }>
								{ descriptor.description }
							</Text>
						) }
					</Stack>
					<div className="jetpack-ai-mcp__group-toggle">
						<ToggleControl
							__nextHasNoMarginBottom
							checked={ allGroupEnabled }
							disabled={ groupTools.some( ( [ id ] ) => savingToolIds.has( id ) ) }
							label={ __( 'Enable all', 'jetpack' ) }
							onChange={ handleToggle }
						/>
					</div>
					<Button
						className="jetpack-ai-mcp__group-chevron"
						icon={ isOpen ? chevronUp : chevronDown }
						label={ isOpen ? LABEL_HIDE_OPERATIONS : LABEL_SHOW_OPERATIONS }
						aria-expanded={ isOpen }
						onClick={ handleChevron }
					/>
				</div>
				{ isOpen &&
					groupToolsBySubCategory( groupTools ).map(
						( { subCategory, tools: subTools }, subIndex ) => (
							<Fragment key={ subCategory ?? '__ungrouped__' }>
								{ subIndex > 0 && <div className="jetpack-ai-mcp__sub-divider" /> }
								<div
									className={
										subIndex === 0 ? 'jetpack-ai-mcp__group-body' : 'jetpack-ai-mcp__sub-group-body'
									}
								>
									<Stack direction="column" gap="md">
										{ subTools.map( ( [ toolId, tool ] ) => (
											<ToolToggle
												key={ toolId }
												toolId={ toolId }
												tool={ tool }
												savingToolIds={ savingToolIds }
												onToggle={ onToolChange }
											/>
										) ) }
									</Stack>
								</div>
							</Fragment>
						)
					) }
			</CardBody>
		</Card>
	);
}

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
			analytics.tracks.recordEvent( 'jetpack_mcp_allowlist_updated', {
				tool_id: toolId,
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
			analytics.tracks.recordEvent( 'jetpack_mcp_allowlist_updated', {
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
		( groupName, groupTools, enabled ) => {
			const overrides = getOverridesToMatch( groupTools, enabled );
			if ( ! overrides ) {
				return;
			}
			analytics.tracks.recordEvent( 'jetpack_mcp_allowlist_updated', {
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
		<Stack direction="column" gap="md">
			<Card>
				<CardBody>
					<Stack direction="column" gap="md">
						<Text as="p" variant="muted">
							{ __( 'Turn individual tools on or off. Changes save automatically.', 'jetpack' ) }
						</Text>
						<ToggleControl
							__nextHasNoMarginBottom
							checked={ pageAllEnabled }
							disabled={ isSavingAny || readTools.length === 0 }
							label={ __( 'Enable all', 'jetpack' ) }
							onChange={ handlePageToggle }
						/>
					</Stack>
				</CardBody>
			</Card>

			{ groups.length > 0 ? (
				<Stack direction="column" gap="sm">
					{ groups.map( ( { group: descriptor, label, tools: groupTools } ) => (
						<GroupCard
							key={ descriptor?.name ?? '__other__' }
							descriptor={ descriptor }
							label={ label }
							groupTools={ groupTools }
							savingToolIds={ savingToolIds }
							onToolChange={ handleToolChange }
							onEnableAll={ handleGroupEnableAll }
						/>
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
