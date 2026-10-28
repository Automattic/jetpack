/**
 * Collapsible card shared by the MCP Read and Write views.
 */

import { Button } from '@wordpress/components';
import { Fragment, useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronDown, chevronUp } from '@wordpress/icons';
import { Card, Stack, SwitchControl, Text } from '@wordpress/ui';
import AnchorCopyButton from './anchor-copy-button';
import { getToolDomId } from './anchors';
import { groupToolsBySubCategory } from './groups';

const LABEL_SHOW_OPERATIONS = __( 'Show operations', 'jetpack' );
const LABEL_HIDE_OPERATIONS = __( 'Hide operations', 'jetpack' );

/**
 * A single tool toggle row.
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.toolId        - Tool identifier.
 * @param {object}   props.tool          - Tool descriptor from the API.
 * @param {string}   props.view          - View path for the copy link, e.g. `mcp/read`.
 * @param {Set}      props.savingToolIds - Set of toolIds currently being saved.
 * @param {Function} props.onToggle      - Called with (toolId, enabled).
 * @return {object} Component markup.
 */
export function ToolToggle( { toolId, tool, view, savingToolIds, onToggle } ) {
	const handleChange = useCallback( checked => onToggle( toolId, checked ), [ toolId, onToggle ] );
	return (
		<div id={ getToolDomId( toolId ) } className="jetpack-ai-mcp__tool-row">
			<SwitchControl
				className="jetpack-ai-mcp__tool-switch"
				checked={ tool.enabled }
				disabled={ savingToolIds.has( toolId ) }
				label={ tool.title }
				description={ tool.description }
				onCheckedChange={ handleChange }
			/>
			<AnchorCopyButton view={ view } anchor={ toolId } />
		</div>
	);
}

/**
 * Tool toggles split into sub-category sections.
 *
 * @param {object}   props               - Component props.
 * @param {Array}    props.tools         - Tool entries, each as [toolId, ability].
 * @param {string}   props.view          - View path for copy links, e.g. `mcp/read`.
 * @param {Set}      props.savingToolIds - Set of toolIds currently being saved.
 * @param {Function} props.onToolChange  - Called with (toolId, enabled).
 * @return {object} Component markup.
 */
export function McpToolSections( { tools, view, savingToolIds, onToolChange } ) {
	return groupToolsBySubCategory( tools ).map( ( { subCategory, tools: subTools }, subIndex ) => (
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
							view={ view }
							savingToolIds={ savingToolIds }
							onToggle={ onToolChange }
						/>
					) ) }
				</Stack>
			</div>
		</Fragment>
	) );
}

/**
 * Collapsible card with a group-wide "Enable all" toggle.
 *
 * @param {object}   props                - Component props.
 * @param {string}   [props.id]           - DOM id for the card.
 * @param {string}   props.label          - Group title.
 * @param {string}   [props.description]  - Muted text under the title.
 * @param {boolean}  props.allEnabled     - Whether every tool in the group is on.
 * @param {boolean}  props.isSaving       - Disables the toggle while a save is in flight.
 * @param {boolean}  [props.forceOpen]    - Keep the card open regardless of the chevron.
 * @param {string}   [props.anchorToolId] - Tool in this card to open and scroll to.
 * @param {*}        [props.group]        - Opaque value handed back to onEnableAll.
 * @param {Function} props.onEnableAll    - Called with (enabled, group).
 * @param {object}   props.children       - Card body, rendered while open.
 * @return {object} Component markup.
 */
export default function McpGroupCard( {
	id,
	label,
	description,
	allEnabled,
	isSaving,
	forceOpen = false,
	anchorToolId = null,
	group,
	onEnableAll,
	children,
} ) {
	const [ isToggledOpen, setIsToggledOpen ] = useState( false );
	const isOpen = forceOpen || isToggledOpen;
	const scrolledTo = useRef( null );

	useEffect( () => {
		if ( anchorToolId ) {
			setIsToggledOpen( true );
		}
	}, [ anchorToolId ] );

	useEffect( () => {
		if ( anchorToolId && isOpen && scrolledTo.current !== anchorToolId ) {
			scrolledTo.current = anchorToolId;
			document
				.getElementById( getToolDomId( anchorToolId ) )
				?.scrollIntoView?.( { block: 'center' } );
		}
	}, [ anchorToolId, isOpen ] );

	const handleEnableAll = useCallback(
		enabled => onEnableAll( enabled, group ),
		[ onEnableAll, group ]
	);
	const handleChevron = useCallback( () => setIsToggledOpen( open => ! open ), [] );

	return (
		<Card.Root id={ id }>
			<Card.Content className="jetpack-ai-mcp__card-content">
				<div className="jetpack-ai-mcp__group-header">
					<Stack direction="column" gap="xs" className="jetpack-ai-mcp__group-info">
						<Text className="jetpack-ai-mcp__group-title">{ label }</Text>
						{ description && (
							<Text variant="body-sm" className="jetpack-ai-mcp__muted">
								{ description }
							</Text>
						) }
					</Stack>
					<div className="jetpack-ai-mcp__group-toggle">
						<SwitchControl
							checked={ allEnabled }
							disabled={ isSaving }
							label={ __( 'Enable all', 'jetpack' ) }
							onCheckedChange={ handleEnableAll }
						/>
					</div>
					<Button
						className="jetpack-ai-mcp__group-chevron"
						icon={ isOpen ? chevronUp : chevronDown }
						label={ isOpen ? LABEL_HIDE_OPERATIONS : LABEL_SHOW_OPERATIONS }
						aria-expanded={ isOpen }
						disabled={ forceOpen }
						onClick={ handleChevron }
					/>
				</div>
				{ isOpen && children }
			</Card.Content>
		</Card.Root>
	);
}
