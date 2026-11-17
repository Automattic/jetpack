/**
 * Allowlist for the abilities this site's plugins publish, shown on Read and Write.
 */

import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice, Spinner, Stack, Text } from '@wordpress/ui';
import { getGroupDomId } from './anchors';
import McpGroupCard, { ToolToggle } from './mcp-group-card';
import { recordMcpTracksEvent } from './tracks';
import { matchesQuery } from './use-tool-search';
import {
	getRemoteAbilityCategory,
	getRemoteAbilityGroupKey,
	getRemoteAbilityKey,
	getSiteRemoteGroups,
	isRemoteAbilityEnabled,
} from './utils';

/**
 * Display name for a namespace: `jetpack-forms` becomes `Jetpack Forms`.
 *
 * @param {string} namespace - Ability namespace.
 * @return {string} Display name.
 */
function formatNamespace( namespace ) {
	return namespace
		.split( '-' )
		.map( word => word.charAt( 0 ).toUpperCase() + word.slice( 1 ) )
		.join( ' ' );
}

/**
 * What one view offers, keyed by namespace: the group keys its card writes and
 * the abilities listed under it. Saved keys always get a card, so settings stay
 * visible when the site is unreachable or has stopped publishing an ability.
 *
 * @param {Array}                   abilities   - Published abilities.
 * @param {Record<string, boolean>} savedGroups - Saved allowlist.
 * @param {'read'|'write'}          view        - View to collect for.
 * @return {Map<string, {keys: string[], abilityKeys: string[], abilities: Array}>} Namespaces, sorted.
 */
export function collectNamespaces( abilities, savedGroups, view ) {
	const namespaces = new Map();
	const entry = namespace => {
		const group = namespaces.get( namespace ) ?? { keys: [], abilityKeys: [], abilities: [] };
		namespaces.set( namespace, group );
		return group;
	};
	const addKey = ( keys, key ) => {
		if ( ! keys.includes( key ) ) {
			keys.push( key );
		}
	};

	for ( const ability of abilities ) {
		const annotations = ability.meta?.annotations;
		if ( getRemoteAbilityCategory( ability.name, annotations ) !== view ) {
			continue;
		}
		const groupKey = getRemoteAbilityGroupKey( ability.name, annotations );
		const group = entry( groupKey.split( ':' )[ 1 ] );
		addKey( group.keys, groupKey );
		group.abilities.push( ability );
	}

	for ( const savedKey of Object.keys( savedGroups ) ) {
		const [ kind, rest ] = savedKey.split( ':' );
		if ( ! rest || ( kind === 'read' ? 'read' : 'write' ) !== view ) {
			continue;
		}
		const [ namespace, abilityPath ] = rest.split( '/' );
		addKey( abilityPath ? entry( namespace ).abilityKeys : entry( namespace ).keys, savedKey );
	}

	return new Map( [ ...namespaces ].sort( ( [ a ], [ b ] ) => a.localeCompare( b ) ) );
}

/**
 * Remote abilities section for the Read or Write view.
 *
 * @param {object}         props                 - Component props.
 * @param {'read'|'write'} props.view            - View this section sits on.
 * @param {object}         props.mcpAbilities    - Full mcp_abilities object from the API.
 * @param {number}         props.blogId          - Current site's blog ID.
 * @param {object}         props.remoteAbilities - Catalog state from useSiteAbilities.
 * @param {boolean}        props.defaultEnabled  - State of abilities with no saved setting.
 * @param {string}         props.query           - Search text.
 * @param {string|null}    [props.anchor]        - Ability name from the URL hash, if any.
 * @param {Set}            props.savingToolIds   - Keys currently being saved.
 * @param {Function}       props.onUpdate        - Called with a partial mcp_abilities update.
 * @return {object|null} Component markup.
 */
export default function RemoteAbilitiesSection( {
	view,
	mcpAbilities,
	blogId,
	remoteAbilities,
	defaultEnabled,
	query,
	anchor = null,
	savingToolIds,
	onUpdate,
} ) {
	const { abilities, isLoading, isError } = remoteAbilities;
	const savedGroups = getSiteRemoteGroups( mcpAbilities, blogId );
	const searchText = query.trim();

	const namespaces = collectNamespaces( abilities, savedGroups, view );
	if ( searchText ) {
		for ( const [ namespace, group ] of namespaces ) {
			group.abilities = group.abilities.filter( ability =>
				matchesQuery(
					{
						title: ability.label ?? ability.name,
						description: `${ ability.description ?? '' } ${ ability.name }`,
					},
					searchText
				)
			);
			// A card with nothing published stays only when its own name matches.
			const nameMatches = formatNamespace( namespace )
				.toLowerCase()
				.includes( searchText.toLowerCase() );
			const hadAbilities = abilities.some(
				ability =>
					getRemoteAbilityGroupKey( ability.name, ability.meta?.annotations ).split( ':' )[ 1 ] ===
					namespace
			);
			if ( group.abilities.length === 0 && ( hadAbilities || ! nameMatches ) ) {
				namespaces.delete( namespace );
			}
		}
	}

	const save = useCallback(
		( keys, enabled, trackGroup ) => {
			recordMcpTracksEvent( 'jetpack_mcp_allowlist_updated', {
				enabled,
				view,
				scope: 'remote',
				group: trackGroup,
			} );
			onUpdate( {
				sites: [
					{
						blog_id: blogId,
						remote_groups: Object.fromEntries( keys.map( key => [ key, enabled ] ) ),
					},
				],
			} );
		},
		[ blogId, onUpdate, view ]
	);

	const handleEnableAll = useCallback(
		( enabled, { namespace, keys } ) => save( keys, enabled, `${ view }:${ namespace }` ),
		[ save, view ]
	);

	const handleToolChange = useCallback(
		( toolId, enabled ) => {
			const ability = abilities.find( item => item.name === toolId );
			const abilityKey = getRemoteAbilityKey( toolId, ability?.meta?.annotations );
			save( [ abilityKey ], enabled, abilityKey );
		},
		[ abilities, save ]
	);

	if ( namespaces.size === 0 && ! isLoading ) {
		return null;
	}

	return (
		<Stack direction="column" gap="md">
			<Stack direction="column" gap="xs">
				<Text className="jetpack-ai-mcp__group-title">
					{ __( 'Site-published abilities', 'jetpack' ) }
				</Text>
				<Text variant="body-sm" className="jetpack-ai-mcp__muted">
					{ __(
						'Choose which abilities this site’s plugins publish to external AI agents.',
						'jetpack'
					) }
				</Text>
			</Stack>
			{ isLoading && namespaces.size === 0 && <Spinner /> }
			{ isError && (
				<Notice.Root intent="warning">
					<Notice.Description>
						{ __(
							'This site’s abilities can’t be loaded right now. The site may be unreachable or too old to publish them. Your saved settings are shown and still apply.',
							'jetpack'
						) }
					</Notice.Description>
				</Notice.Root>
			) }
			{ [ ...namespaces ].map( ( [ namespace, group ] ) => {
				const isSavingKey = key => savingToolIds.has( key );
				const savingNames = new Set(
					group.abilities
						.filter( ability => {
							const annotations = ability.meta?.annotations;
							return (
								isSavingKey( getRemoteAbilityKey( ability.name, annotations ) ) ||
								isSavingKey( getRemoteAbilityGroupKey( ability.name, annotations ) )
							);
						} )
						.map( ability => ability.name )
				);
				const intentKeys = [ ...group.keys, ...group.abilityKeys ];
				const allEnabled =
					group.keys.length > 0 &&
					intentKeys.every( key => ( savedGroups[ key ] ?? defaultEnabled ) === true ) &&
					group.abilities.every( ability =>
						isRemoteAbilityEnabled(
							savedGroups,
							ability.name,
							ability.meta?.annotations,
							defaultEnabled
						)
					);

				return (
					<McpGroupCard
						key={ namespace }
						id={ getGroupDomId( `remote-${ namespace }` ) }
						label={ formatNamespace( namespace ) }
						allEnabled={ allEnabled }
						isSaving={ intentKeys.some( isSavingKey ) }
						forceOpen={ searchText !== '' }
						anchorToolId={
							group.abilities.some( ability => ability.name === anchor ) ? anchor : null
						}
						group={ { namespace, keys: intentKeys } }
						onEnableAll={ handleEnableAll }
					>
						<Stack direction="column" gap="md" className="jetpack-ai-mcp__group-body">
							{ group.abilities.map( ability => (
								<ToolToggle
									key={ ability.name }
									toolId={ ability.name }
									tool={ {
										title: ability.label || ability.name,
										description: ability.description,
										enabled: isRemoteAbilityEnabled(
											savedGroups,
											ability.name,
											ability.meta?.annotations,
											defaultEnabled
										),
									} }
									view={ `mcp/${ view }` }
									savingToolIds={ savingNames }
									onToggle={ handleToolChange }
								/>
							) ) }
						</Stack>
					</McpGroupCard>
				);
			} ) }
		</Stack>
	);
}
