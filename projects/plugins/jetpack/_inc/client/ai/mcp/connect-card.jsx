/**
 * "Connect an external AI agent" card shown at the top of the MCP hub.
 * Ported from client/dashboard/me/mcp/connect-card.tsx in wp-calypso.
 */

import { speak } from '@wordpress/a11y';
import { Icon } from '@wordpress/components';
import { useCopyToClipboard } from '@wordpress/compose';
import { useCallback, useEffect, useId, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowUpRight, copy } from '@wordpress/icons';
import { Button, Card, Notice, Stack, Text } from '@wordpress/ui';
import assetUrl from '../asset-url';
import { getConnectAgents, HELPER_PROMPT } from './connect-agents';
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
 * Accessible-name props for a tile: the agent name is the name, the rest is the description.
 *
 * @param {string} id - Base id from useId().
 * @return {object} ARIA props for the tile element.
 */
function getTileAriaProps( id ) {
	return {
		'aria-labelledby': `${ id }-name`,
		'aria-describedby': `${ id }-description ${ id }-action`,
	};
}

/**
 * Shared contents of a link or copy tile.
 *
 * @param {object}  props            - Component props.
 * @param {string}  props.id         - Base id for the name, description and action.
 * @param {object}  props.agent      - Agent tile data.
 * @param {boolean} [props.isCopied] - Whether to show the "Copied" state.
 * @return {object} Component markup.
 */
function TileContent( { id, agent, isCopied = false } ) {
	return (
		<>
			<AgentLogo agent={ agent } />
			<span className="jetpack-ai-mcp__connect-tile-text">
				<span id={ `${ id }-name` } className="jetpack-ai-mcp__connect-tile-name">
					{ agent.name }
				</span>
				<span id={ `${ id }-description` } className="jetpack-ai-mcp__connect-tile-description">
					{ agent.description }
				</span>
			</span>
			<span id={ `${ id }-action` } className="jetpack-ai-mcp__connect-tile-action">
				<span>{ isCopied ? __( 'Copied', 'jetpack' ) : agent.actionLabel }</span>
				<Icon icon={ agent.href ? arrowUpRight : copy } size={ 12 } />
			</span>
		</>
	);
}

/**
 * Tile that opens the agent's connector or plugin page.
 *
 * @param {object} props       - Component props.
 * @param {object} props.agent - Agent tile data.
 * @return {object} Component markup.
 */
function LinkTile( { agent } ) {
	const id = useId();
	const handleClick = useCallback(
		() => recordMcpTracksEvent( 'jetpack_mcp_connect_click', { agent: agent.key, action: 'open' } ),
		[ agent.key ]
	);

	return (
		<a
			className="jetpack-ai-mcp__connect-tile"
			href={ agent.href }
			target="_blank"
			rel="noreferrer"
			onClick={ handleClick }
			{ ...getTileAriaProps( id ) }
		>
			<TileContent id={ id } agent={ agent } />
		</a>
	);
}

/**
 * Tile that copies a command, prompt or URL.
 *
 * @param {object} props       - Component props.
 * @param {object} props.agent - Agent tile data.
 * @return {object} Component markup.
 */
function CopyTile( { agent } ) {
	const id = useId();
	const [ ref, isCopied ] = useCopyWithFeedback( agent.code, () =>
		recordMcpTracksEvent( 'jetpack_mcp_connect_click', { agent: agent.key, action: 'copy' } )
	);

	return (
		<button
			ref={ ref }
			type="button"
			className="jetpack-ai-mcp__connect-tile"
			{ ...getTileAriaProps( id ) }
		>
			<TileContent id={ id } agent={ agent } isCopied={ isCopied } />
		</button>
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
	const [ helperRef, isHelperCopied ] = useCopyWithFeedback( HELPER_PROMPT, () =>
		recordMcpTracksEvent( 'jetpack_mcp_connect_helper_copy' )
	);
	const handleManualSetup = useCallback( () => onNavigate( 'setup' ), [ onNavigate ] );

	return (
		<Card.Root className="jetpack-ai-mcp__connect-card">
			<Card.Header>
				<Card.Title render={ <h2 /> }>{ __( 'Connect an external AI agent', 'jetpack' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<Text className="jetpack-ai-mcp__muted">
						{ __(
							'Add this site to your agent, then sign in with your WordPress.com account to approve the connection.',
							'jetpack'
						) }
					</Text>
					{ ! mcpEnabled && (
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
					) }
					<ul className="jetpack-ai-mcp__connect-grid">
						{ getConnectAgents().map( agent => (
							<li key={ agent.key }>
								{ agent.href ? <LinkTile agent={ agent } /> : <CopyTile agent={ agent } /> }
							</li>
						) ) }
					</ul>
				</Stack>
				<Card.FullBleed className="jetpack-ai-mcp__connect-footer">
					<span>
						{ __( 'Not sure where to start? Have the agent connect itself.', 'jetpack' ) }
					</span>
					<Stack direction="row" gap="sm" align="center" justify="flex-end">
						<Button ref={ helperRef } variant="minimal" size="small">
							<Button.Icon icon={ copy } />
							{ isHelperCopied ? __( 'Copied', 'jetpack' ) : __( 'Copy prompt', 'jetpack' ) }
						</Button>
						<Button variant="minimal" size="small" onClick={ handleManualSetup }>
							{ __( 'Manual setup', 'jetpack' ) }
						</Button>
					</Stack>
				</Card.FullBleed>
			</Card.Content>
		</Card.Root>
	);
}
