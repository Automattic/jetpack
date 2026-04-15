/**
 * MCP Write tools view.
 *
 * Lists write tools (tools where readonly === false) grouped by category,
 * with per-tool and per-category toggles.
 */

import {
	Card,
	CardBody,
	CardDivider,
	CardHeader,
	ToggleControl,
	__experimentalHStack as HStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { Fragment, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	CATEGORY_ORDER,
	SUB_CATEGORY_ORDER,
	getDisplayCategory,
	getSubCategory,
	isWriteTool,
	sortTools,
} from './categories';
import {
	getAccountMcpAbilities,
	getSiteContextToolIds,
	getSiteLevelEnabled,
	getSiteMcpAbilities,
	mergeSiteMcpAbilities,
} from './utils';

/**
 * A single tool toggle row.
 *
 * @param {object}   props          - Component props.
 * @param {string}   props.toolId   - Tool identifier.
 * @param {object}   props.tool     - Tool descriptor from the API.
 * @param {boolean}  props.isSaving - Whether a save is pending.
 * @param {Function} props.onToggle - Called with (toolId, enabled).
 * @return {object} Component markup.
 */
function ToolToggle( { toolId, tool, isSaving, onToggle } ) {
	const handleChange = useCallback( checked => onToggle( toolId, checked ), [ toolId, onToggle ] );
	return (
		<ToggleControl
			__nextHasNoMarginBottom
			checked={ tool.enabled }
			disabled={ isSaving }
			label={ tool.title }
			help={ tool.description }
			onChange={ handleChange }
		/>
	);
}

/**
 * Category card header with an "Enable all" toggle.
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.categoryName  - Display name of the category.
 * @param {boolean}  props.allEnabled    - Whether all tools in the category are enabled.
 * @param {boolean}  props.isSaving      - Whether a save is pending.
 * @param {Array}    props.categoryTools - Tools in the category.
 * @param {Function} props.onEnableAll   - Called with (categoryTools, enabled).
 * @return {object} Component markup.
 */
function CategoryHeader( { categoryName, allEnabled, isSaving, categoryTools, onEnableAll } ) {
	const handleChange = useCallback(
		checked => onEnableAll( categoryTools, checked ),
		[ categoryTools, onEnableAll ]
	);
	return (
		<CardHeader>
			<HStack justify="space-between" alignment="center">
				<Text as="h3" weight={ 600 } size={ 14 }>
					{ categoryName }
				</Text>
				<ToggleControl
					__nextHasNoMarginBottom
					checked={ allEnabled }
					disabled={ isSaving }
					label={ __( 'Enable all', 'jetpack' ) }
					onChange={ handleChange }
				/>
			</HStack>
		</CardHeader>
	);
}

/**
 * MCP Write tools view.
 *
 * @param {object}   props              - Component props.
 * @param {object}   props.mcpAbilities - Full mcp_abilities object from the API.
 * @param {number}   props.blogId       - Current site's blog ID.
 * @param {boolean}  props.isSaving     - Whether a save is in progress.
 * @param {Function} props.onUpdate     - Called with partial mcp_abilities update.
 * @return {object} Component markup.
 */
export default function McpWrite( { mcpAbilities, blogId, isSaving, onUpdate } ) {
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

	const buildAbilities = useCallback( overrides => overrides, [] );

	const handleToolChange = useCallback(
		( toolId, enabled ) => {
			onUpdate( {
				sites: [
					{
						blog_id: blogId,
						abilities: buildAbilities( { [ toolId ]: enabled } ),
					},
				],
			} );
		},
		[ blogId, buildAbilities, onUpdate ]
	);

	const handleEnableAll = useCallback(
		( categoryTools, enabled ) => {
			const overrides = {};
			categoryTools.forEach( ( [ toolId ] ) => {
				overrides[ toolId ] = enabled;
			} );
			onUpdate( {
				sites: [
					{
						blog_id: blogId,
						abilities: buildAbilities( overrides ),
					},
				],
			} );
		},
		[ blogId, buildAbilities, onUpdate ]
	);

	// Group by display category
	const grouped = {};
	writeTools.forEach( ( [ toolId, tool ] ) => {
		const category = getDisplayCategory( toolId, tool );
		if ( ! grouped[ category ] ) {
			grouped[ category ] = [];
		}
		grouped[ category ].push( [ toolId, tool ] );
	} );

	const renderToolToggles = tools =>
		tools.map( ( [ toolId, tool ] ) => (
			<ToolToggle
				key={ toolId }
				toolId={ toolId }
				tool={ tool }
				isSaving={ isSaving }
				onToggle={ handleToolChange }
			/>
		) );

	const renderSubGroupedTools = ( categoryTools, categoryName ) => {
		const subGrouped = {};
		categoryTools.forEach( ( [ toolId, tool ] ) => {
			const sub = getSubCategory( toolId, tool ) ?? '';
			if ( ! subGrouped[ sub ] ) {
				subGrouped[ sub ] = [];
			}
			subGrouped[ sub ].push( [ toolId, tool ] );
		} );

		const order = SUB_CATEGORY_ORDER[ categoryName ] ?? [];
		const subGroups = order.filter( sub => subGrouped[ sub ]?.length > 0 );

		return subGroups.map( ( subName, index ) => (
			<Fragment key={ subName }>
				{ index > 0 && <CardDivider className="jetpack-ai-mcp__tool-group-divider" /> }
				<CardBody>
					<VStack spacing={ 4 }>{ renderToolToggles( sortTools( subGrouped[ subName ] ) ) }</VStack>
				</CardBody>
			</Fragment>
		) );
	};

	if ( writeTools.length === 0 ) {
		return (
			<Card>
				<CardBody>
					<Text variant="muted">
						{ __( 'No write tools are available for this site.', 'jetpack' ) }
					</Text>
				</CardBody>
			</Card>
		);
	}

	return (
		<VStack spacing={ 4 }>
			{ CATEGORY_ORDER.map( categoryName => {
				const categoryTools = grouped[ categoryName ];
				if ( ! categoryTools?.length ) {
					return null;
				}

				const allEnabled = categoryTools.every( ( [ , t ] ) => t.enabled );
				const subOrder = SUB_CATEGORY_ORDER[ categoryName ];

				return (
					<Card key={ categoryName }>
						<CategoryHeader
							categoryName={ categoryName }
							allEnabled={ allEnabled }
							isSaving={ isSaving }
							categoryTools={ categoryTools }
							onEnableAll={ handleEnableAll }
						/>
						{ subOrder ? (
							renderSubGroupedTools( categoryTools, categoryName )
						) : (
							<CardBody>
								<VStack spacing={ 4 }>{ renderToolToggles( categoryTools ) }</VStack>
							</CardBody>
						) }
					</Card>
				);
			} ) }
		</VStack>
	);
}
