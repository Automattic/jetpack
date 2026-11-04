/**
 * "Connect an external AI agent" card shown at the top of the MCP hub.
 * Ported from client/dashboard/me/mcp/connect-card.tsx in wp-calypso.
 */

import { speak } from '@wordpress/a11y';
import { useCopyToClipboard } from '@wordpress/compose';
import { useCallback, useEffect, useId, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { copy } from '@wordpress/icons';
import { Button, ButtonLink, Card, Notice, Stack, Text } from '@wordpress/ui';
import assetUrl from '../asset-url';
import { getConnectAgents, getHelperPrompt } from './connect-agents';
import { recordMcpTracksEvent } from './tracks';

const COPIED_DURATION_MS = 1600;

/**
 * Copy `text` when the returned ref's element is clicked. Everything that confirms
 * the copy waits for it to succeed, so a blocked clipboard reports nothing.
 *
 * @param {string}   text     - Text to copy.
 * @param {Function} onCopied - Called after a successful copy.
 * @return {Array} The ref for the trigger element, and whether "Copied" should show.
 */
function useCopyWithFeedback( text, onCopied ) {
	const [ isCopied, setIsCopied ] = useState( false );
	const timeout = useRef();

	useEffect( () => () => clearTimeout( timeout.current ), [] );

	const ref = useCopyToClipboard( text, () => {
		onCopied();
		speak( __( 'Copied', 'jetpack' ) );
		setIsCopied( true );
		clearTimeout( timeout.current );
		timeout.current = setTimeout( () => setIsCopied( false ), COPIED_DURATION_MS );
	} );

	return [ ref, isCopied ];
}

/**
 * Agent logo, falling back to the first letter of its name.
 *
 * @param {object} props       - Component props.
 * @param {object} props.agent - Agent tile data.
 * @return {object} Component markup.
 */
function AgentLogo( { agent } ) {
	const [ isBroken, setIsBroken ] = useState( false );
	const src = assetUrl( `agents/${ agent.logo }` );
	const handleError = useCallback( () => setIsBroken( true ), [] );

	return (
		<span className="jetpack-ai-mcp__connect-logo" aria-hidden="true">
			{ isBroken || ! src ? agent.name[ 0 ] : <img src={ src } alt="" onError={ handleError } /> }
		</span>
	);
}

/**
 * Button that opens the agent's connector, plugin or install page.
 *
 * @param {object} props            - Component props.
 * @param {object} props.agent      - Agent tile data.
 * @param {string} props.id         - Id for the action.
 * @param {string} props.labelledBy - Ids that name the action.
 * @return {object} Component markup.
 */
function OpenAction( { agent, id, labelledBy } ) {
	const handleClick = useCallback(
		() => recordMcpTracksEvent( 'jetpack_mcp_connect_click', { agent: agent.key, action: 'open' } ),
		[ agent.key ]
	);

	return (
		<ButtonLink
			id={ id }
			aria-labelledby={ labelledBy }
			href={ agent.href }
			openInNewTab
			variant="outline"
			size="small"
			onClick={ handleClick }
		>
			{ agent.actionLabel }
		</ButtonLink>
	);
}

/**
 * Button that copies a command, prompt or URL.
 *
 * @param {object} props            - Component props.
 * @param {object} props.agent      - Agent tile data.
 * @param {string} props.id         - Id for the action.
 * @param {string} props.labelledBy - Ids that name the action.
 * @return {object} Component markup.
 */
function CopyAction( { agent, id, labelledBy } ) {
	const [ ref, isCopied ] = useCopyWithFeedback( agent.code, () =>
		recordMcpTracksEvent( 'jetpack_mcp_connect_click', { agent: agent.key, action: 'copy' } )
	);

	return (
		<Button ref={ ref } id={ id } aria-labelledby={ labelledBy } variant="outline" size="small">
			{ isCopied ? __( 'Copied', 'jetpack' ) : agent.actionLabel }
		</Button>
	);
}

/**
 * One agent in the grid: logo, name, description and its action.
 *
 * @param {object} props       - Component props.
 * @param {object} props.agent - Agent tile data.
 * @return {object} Component markup.
 */
function AgentTile( { agent } ) {
	const id = useId();
	const nameId = `${ id }-name`;
	const actionId = `${ id }-action`;
	// Name each action by its agent too, e.g. "Claude Code Copy command".
	const Action = agent.href ? OpenAction : CopyAction;

	return (
		<Stack direction="column" gap="sm" align="flex-start" render={ <li /> }>
			<AgentLogo agent={ agent } />
			<Stack direction="column" gap="xs">
				<Text id={ nameId } render={ <h3 /> } variant="heading-md">
					{ agent.name }
				</Text>
				<Text render={ <p /> } variant="body-sm" className="jetpack-ai-mcp__muted">
					{ agent.description }
				</Text>
			</Stack>
			<Action agent={ agent } id={ actionId } labelledBy={ `${ nameId } ${ actionId }` } />
		</Stack>
	);
}

/**
 * Notice above the grid: a warning while MCP access is off, and a success
 * message in the same place once it turns on, so the layout below stays put.
 *
 * @param {object}   props             - Component props.
 * @param {boolean}  props.mcpEnabled  - Whether MCP access is on for this site.
 * @param {Function} props.onTurnOn    - Turns MCP access on.
 * @param {boolean}  props.isTurningOn - Whether turning it on is in progress.
 * @param {Function} props.onDismiss   - Called after the on notice closes, to move focus.
 * @return {object|null} Component markup.
 */
function AccessNotice( { mcpEnabled, onTurnOn, isTurningOn, onDismiss } ) {
	const [ wasEnabled, setWasEnabled ] = useState( mcpEnabled );
	const [ showTurnedOn, setShowTurnedOn ] = useState( false );

	// Set during render, not in an effect, so no frame paints without a notice.
	if ( mcpEnabled !== wasEnabled ) {
		setWasEnabled( mcpEnabled );
		setShowTurnedOn( mcpEnabled );
	}

	useEffect( () => {
		if ( showTurnedOn ) {
			speak( __( 'MCP access is on', 'jetpack' ) );
		}
	}, [ showTurnedOn ] );

	const handleDismiss = useCallback( () => {
		setShowTurnedOn( false );
		onDismiss();
	}, [ onDismiss ] );

	if ( ! mcpEnabled ) {
		return (
			<Notice.Root intent="warning">
				<Notice.Title>{ __( 'MCP access is off', 'jetpack' ) }</Notice.Title>
				<Notice.Description>
					{ __(
						'Agents can still connect, but they can’t read or change this site until you turn it on.',
						'jetpack'
					) }
				</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton
						variant="outline"
						onClick={ onTurnOn }
						loading={ isTurningOn }
						loadingAnnouncement={ __( 'Turning on MCP access', 'jetpack' ) }
					>
						{ __( 'Turn on MCP access', 'jetpack' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>
		);
	}

	if ( ! showTurnedOn ) {
		return null;
	}

	return (
		<Notice.Root intent="success">
			<Notice.Title>{ __( 'MCP access is on', 'jetpack' ) }</Notice.Title>
			<Notice.Description>
				{ __( 'Connected agents can now use the tools you allow below.', 'jetpack' ) }
			</Notice.Description>
			<Notice.Actions>
				<Notice.ActionButton variant="outline" onClick={ handleDismiss }>
					{ __( 'Dismiss', 'jetpack' ) }
				</Notice.ActionButton>
			</Notice.Actions>
		</Notice.Root>
	);
}

/**
 * Connect card.
 *
 * @param {object}   props             - Component props.
 * @param {boolean}  props.mcpEnabled  - Whether MCP access is on for this site.
 * @param {Function} props.onTurnOn    - Turns MCP access on.
 * @param {boolean}  props.isTurningOn - Whether turning it on is in progress.
 * @param {Function} props.onNavigate  - Called with 'setup' to open the manual setup view.
 * @return {object} Component markup.
 */
export default function McpConnectCard( { mcpEnabled, onTurnOn, isTurningOn, onNavigate } ) {
	const [ helperRef, isHelperCopied ] = useCopyWithFeedback( getHelperPrompt(), () =>
		recordMcpTracksEvent( 'jetpack_mcp_connect_helper_copy' )
	);
	const handleManualSetup = useCallback( () => onNavigate( 'setup' ), [ onNavigate ] );
	const headingRef = useRef();
	const focusHeading = useCallback( () => headingRef.current?.focus(), [] );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title ref={ headingRef } tabIndex={ -1 } render={ <h2 /> }>
					{ __( 'Connect an external AI agent', 'jetpack' ) }
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="lg">
					<Text render={ <p /> } className="jetpack-ai-mcp__muted">
						{ __(
							'Add this site to your agent, then sign in with your WordPress.com account to approve the connection.',
							'jetpack'
						) }
					</Text>
					<AccessNotice
						mcpEnabled={ mcpEnabled }
						onTurnOn={ onTurnOn }
						isTurningOn={ isTurningOn }
						onDismiss={ focusHeading }
					/>
					<ul className="jetpack-ai-mcp__connect-grid">
						{ getConnectAgents().map( agent => (
							<AgentTile key={ agent.key } agent={ agent } />
						) ) }
					</ul>
					<Stack direction="row" gap="sm" align="center" justify="space-between" wrap="wrap">
						<Text variant="body-sm">
							{ __( 'Not sure where to start? Have the agent connect itself.', 'jetpack' ) }
						</Text>
						<Stack direction="row" gap="sm" align="center">
							<Button ref={ helperRef } variant="minimal" size="small">
								<Button.Icon icon={ copy } />
								{ isHelperCopied ? __( 'Copied', 'jetpack' ) : __( 'Copy prompt', 'jetpack' ) }
							</Button>
							<Button variant="minimal" size="small" onClick={ handleManualSetup }>
								{ __( 'Manual setup', 'jetpack' ) }
							</Button>
						</Stack>
					</Stack>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
