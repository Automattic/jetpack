/**
 * MCP Settings hub — main view shown at wp-admin/admin.php?page=jetpack-ai.
 * Shows the enable/disable toggle and navigation to Read, Write, and Setup sub-views.
 */

import {
	Card,
	CardBody,
	CardDivider,
	Icon,
	ToggleControl,
	__experimentalText as Text, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import {
	seen,
	pencil,
	connection,
	chevronRight,
	info,
	published,
	caution,
	list,
} from '@wordpress/icons';
import { Badge, Button, Stack } from '@wordpress/ui';
import analytics from 'lib/analytics';
import { isWriteTool } from './categories';
import {
	getAccountMcpAbilities,
	getSiteContextToolIds,
	getSiteLevelEnabled,
	getSiteMcpAbilities,
	mergeSiteMcpAbilities,
} from './utils';

import './style.scss';

/**
 * Compute a badge text + intent for a set of tools.
 *
 * @param {Array}   tools          - Tool entries to evaluate.
 * @param {boolean} defaultEnabled - Fallback enabled state when there are no overrides.
 * @return {{ text: string, intent?: string }} Badge descriptor.
 */
function computeBadge( tools, defaultEnabled ) {
	if ( tools.length === 0 ) {
		return defaultEnabled
			? { text: __( 'All enabled', 'jetpack' ), intent: 'success' }
			: { text: __( 'Disabled', 'jetpack' ) };
	}
	const enabledCount = tools.filter( ( [ , t ] ) => t.enabled ).length;
	if ( enabledCount === tools.length ) {
		return { text: __( 'All enabled', 'jetpack' ), intent: 'success' };
	}
	if ( enabledCount === 0 ) {
		return { text: __( 'Disabled', 'jetpack' ) };
	}
	return {
		/* translators: %1$d: enabled count, %2$d: total count */
		text: sprintf( __( '%1$d of %2$d enabled', 'jetpack' ), enabledCount, tools.length ),
		intent: 'info',
	};
}

/* Map our semantic intents to the Badge intents provided by @wordpress/ui. */
const BADGE_INTENT_MAP = {
	success: 'stable',
	info: 'informational',
	warning: 'medium',
	neutral: 'draft',
};

/**
 * Badge with an optional intent icon (info / checkmark / caution).
 *
 * @param {object}                            props       - Component props.
 * @param {{ text: string, intent?: string }} props.badge - Badge descriptor.
 * @return {object} Component markup.
 */
function BadgeWithIcon( { badge } ) {
	const intent = badge.intent ?? 'neutral';
	const iconMap = { success: published, info, warning: caution };
	const badgeIcon = iconMap[ intent ];
	return (
		<Badge intent={ BADGE_INTENT_MAP[ intent ] ?? 'draft' }>
			{ badgeIcon ? (
				<span className="jetpack-ai-mcp__badge-content">
					<Icon icon={ badgeIcon } size={ 14 } />
					{ badge.text }
				</span>
			) : (
				badge.text
			) }
		</Badge>
	);
}

/**
 * A tappable row that navigates to a sub-view, visually similar to calypso's
 * RouterLinkSummaryButton.
 *
 * @param {object}                            props         - Component props.
 * @param {*}                                 props.icon    - WordPress icon.
 * @param {string}                            props.title   - Row label.
 * @param {{ text: string, intent?: string }} props.badge   - Optional badge.
 * @param {Function}                          props.onClick - Click handler.
 * @return {object} Component markup.
 */
function SummaryRow( { icon, title, badge, onClick } ) {
	return (
		<Button
			className="jetpack-ai-mcp__summary-row"
			onClick={ onClick }
			variant="minimal"
			tone="neutral"
		>
			<Stack direction="row" justify="space-between" align="center" style={ { width: '100%' } }>
				<Stack direction="row" gap="sm" align="center" justify="flex-start">
					<Icon className="jetpack-ai-mcp__row-icon" icon={ icon } size={ 24 } />
					<Text>{ title }</Text>
				</Stack>
				<Stack direction="row" gap="sm" align="center" justify="flex-end">
					{ badge && <BadgeWithIcon badge={ badge } /> }
					<Icon icon={ chevronRight } size={ 20 } />
				</Stack>
			</Stack>
		</Button>
	);
}

/**
 * A card row for the "Connect external AI agent" action — shows title + description.
 *
 * @param {object}   props             - Component props.
 * @param {string}   props.title       - Row title.
 * @param {string}   props.description - Row description.
 * @param {Function} props.onClick     - Click handler.
 * @return {object} Component markup.
 */
function ConnectRow( { title, description, onClick } ) {
	return (
		<button className="jetpack-ai-mcp__connect-row" onClick={ onClick } type="button">
			<span className="jetpack-ai-mcp__connect-row-icon">
				<Icon icon={ connection } size={ 24 } />
			</span>
			<span className="jetpack-ai-mcp__connect-row-text">
				<Text as="p" className="jetpack-ai-mcp__connect-row-title" weight={ 600 }>
					{ title }
				</Text>
				<Text as="p" className="jetpack-ai-mcp__connect-row-description" variant="muted">
					{ description }
				</Text>
			</span>
			<span className="jetpack-ai-mcp__connect-row-chevron">
				<Icon icon={ chevronRight } size={ 24 } />
			</span>
		</button>
	);
}

/**
 * MCP hub component.
 *
 * @param {object}   props                - Component props.
 * @param {object}   props.mcpAbilities   - Full mcp_abilities object from API.
 * @param {number}   props.blogId         - Current site's blog ID.
 * @param {string}   props.activityLogUrl - URL for the activity log link.
 * @param {Set}      props.savingToolIds  - Set of toolIds currently being saved.
 * @param {Function} props.onNavigate     - Called with 'read' | 'write' | 'setup'.
 * @param {Function} props.onUpdate       - Called with partial mcp_abilities update.
 * @return {object} Component markup.
 */
export default function McpHub( {
	mcpAbilities,
	blogId,
	activityLogUrl,
	savingToolIds,
	onNavigate,
	onUpdate,
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
	const merged = mergeSiteMcpAbilities( siteAccountAbilities, siteAbilities, isMcpEnabled );

	const hasSiteAbilityOverrides = Object.keys( siteAbilities ).length > 0;
	const defaultToolEnabled = mcpAbilities?.site_level_enabled_default ?? false;

	const availableTools = Object.entries( merged ).filter( ( [ , t ] ) => t.visible !== false );
	const readTools = availableTools.filter( ( [ id, t ] ) => ! isWriteTool( id, t ) );
	const writeTools = availableTools.filter( ( [ id, t ] ) => isWriteTool( id, t ) );

	const defaultBadge = defaultToolEnabled
		? { text: __( 'All enabled', 'jetpack' ), intent: 'success' }
		: { text: __( 'Disabled', 'jetpack' ) };
	const readBadge = hasSiteAbilityOverrides
		? computeBadge( readTools, defaultToolEnabled )
		: defaultBadge;
	const writeBadge = hasSiteAbilityOverrides
		? computeBadge( writeTools, defaultToolEnabled )
		: defaultBadge;

	const handleMcpToggle = useCallback(
		enabled => {
			analytics.tracks.recordEvent( 'jetpack_mcp_enabled_toggled', { enabled } );
			const abilities = {};
			if ( enabled ) {
				// Enable all tools (read + write) by default, matching the backend's
				// new default-on behavior.
				availableTools.forEach( ( [ toolId ] ) => {
					abilities[ toolId ] = true;
				} );
			}
			onUpdate( {
				sites: [
					{
						blog_id: blogId,
						site_level_enabled: enabled,
						abilities,
					},
				],
			} );
		},
		[ blogId, onUpdate, availableTools ]
	);

	const navigateToRead = useCallback( () => onNavigate( 'read' ), [ onNavigate ] );
	const navigateToWrite = useCallback( () => onNavigate( 'write' ), [ onNavigate ] );
	const navigateToSetup = useCallback( () => onNavigate( 'setup' ), [ onNavigate ] );

	return (
		<>
			<Card className="jetpack-ai-mcp__access-card">
				<CardBody>
					<Stack direction="column" gap="md">
						<Stack direction="column" gap="xs">
							<Text as="h3" weight={ 600 }>
								{ __( 'External AI agent access', 'jetpack' ) }
							</Text>
							<Text variant="muted">
								{ __( 'Allow external AI agents to access this site via MCP.', 'jetpack' ) }
							</Text>
						</Stack>
						<ToggleControl
							__nextHasNoMarginBottom
							checked={ isMcpEnabled }
							disabled={ savingToolIds.has( '__site_level__' ) }
							label={ __( 'Enable MCP access', 'jetpack' ) }
							onChange={ handleMcpToggle }
						/>
					</Stack>
				</CardBody>

				{ isMcpEnabled && (
					<>
						<CardDivider />
						<SummaryRow
							icon={ seen }
							title={ __( 'Read', 'jetpack' ) }
							badge={ readBadge }
							onClick={ navigateToRead }
						/>
						<CardDivider />
						<SummaryRow
							icon={ pencil }
							title={ __( 'Write', 'jetpack' ) }
							badge={ writeBadge }
							onClick={ navigateToWrite }
						/>
					</>
				) }
			</Card>

			{ isMcpEnabled && (
				<Card className="jetpack-ai-mcp__action-card">
					<ConnectRow
						title={ __( 'Connect external AI agent', 'jetpack' ) }
						description={ __(
							'Get instructions for connecting your external AI agent.',
							'jetpack'
						) }
						onClick={ navigateToSetup }
					/>
				</Card>
			) }

			{ isMcpEnabled && activityLogUrl && (
				<Card className="jetpack-ai-mcp__action-card">
					<a className="jetpack-ai-mcp__connect-row" href={ activityLogUrl }>
						<span className="jetpack-ai-mcp__connect-row-icon">
							<Icon icon={ list } size={ 24 } />
						</span>
						<span className="jetpack-ai-mcp__connect-row-text">
							<Text as="p" className="jetpack-ai-mcp__connect-row-title" weight={ 600 }>
								{ __( 'Activity log', 'jetpack' ) }
							</Text>
							<Text as="p" className="jetpack-ai-mcp__connect-row-description" variant="muted">
								{ __( 'Review recent actions taken by AI agents on your site.', 'jetpack' ) }
							</Text>
						</span>
						<span className="jetpack-ai-mcp__connect-row-chevron">
							<Icon icon={ chevronRight } size={ 24 } />
						</span>
					</a>
				</Card>
			) }
		</>
	);
}
