/**
 * "Connect an external AI agent" card shown at the top of the MCP hub.
 * Ported from client/dashboard/me/mcp/connect-card.tsx in wp-calypso.
 */

import { speak } from '@wordpress/a11y';
import { useCallback, useEffect, useId, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { arrowUpRight, copy } from '@wordpress/icons';
import {
	Button,
	Card,
	Icon,
	Notice,
	Stack,
	Text,
	TextareaControl,
	VisuallyHidden,
} from '@wordpress/ui';
import assetUrl from '../asset-url';
import { getConnectAgents, HELPER_PROMPT } from './connect-agents';
import { recordMcpTracksEvent } from './tracks';

const COPIED_DURATION_MS = 1600;

/**
 * Copy text to the clipboard. Plain HTTP sites have no Clipboard API, so fall back to
 * execCommand there. This works like `copyToClipboard` in `@wordpress/compose`, but WordPress
 * core loads an older useCopyToClipboard that does not report a failed copy.
 *
 * @param {string}   text          - Text to copy.
 * @param {Document} ownerDocument - Document of the element that was clicked.
 * @return {Promise<boolean>} Whether the copy worked.
 */
async function copyText( text, ownerDocument ) {
	try {
		const clipboard = ownerDocument.defaultView?.navigator?.clipboard;
		if ( clipboard?.writeText ) {
			await clipboard.writeText( text );
			return true;
		}
		const field = ownerDocument.createElement( 'textarea' );
		field.value = text;
		field.setAttribute( 'readonly', '' );
		field.style.position = 'fixed';
		field.style.insetInlineStart = '-9999px';
		ownerDocument.body.appendChild( field );
		field.select();
		const copied = ownerDocument.execCommand( 'copy' );
		field.remove();
		return copied;
	} catch {
		return false;
	}
}

/**
 * Click handler that copies `text`. Everything that confirms the copy waits for it to
 * succeed. A blocked copy hands the text to `setFailedText`.
 *
 * @param {string}   text          - Text to copy.
 * @param {Function} onCopied      - Called after a successful copy.
 * @param {Function} setFailedText - Gets `{ text }` after a failed copy, and null after a success.
 * @return {Array} The click handler, and whether "Copied" should show.
 */
function useCopyWithFeedback( text, onCopied, setFailedText ) {
	const [ isCopied, setIsCopied ] = useState( false );
	const timeout = useRef();

	useEffect( () => () => clearTimeout( timeout.current ), [] );

	const handleClick = useCallback(
		async event => {
			const trigger = event.currentTarget;
			if ( ! ( await copyText( text, trigger.ownerDocument ) ) ) {
				// A new object each time, so a repeat failure selects the text again.
				setFailedText( { text } );
				return;
			}
			// The execCommand fallback moves focus to its field.
			trigger.focus();
			setFailedText( null );
			onCopied();
			speak( __( 'Copied', 'jetpack' ) );
			setIsCopied( true );
			clearTimeout( timeout.current );
			timeout.current = setTimeout( () => setIsCopied( false ), COPIED_DURATION_MS );
		},
		[ text, onCopied, setFailedText ]
	);

	return [ handleClick, isCopied ];
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
 * Contents of a tile. The agent name names the tile; the rest describes it.
 *
 * @param {object}  props            - Component props.
 * @param {string}  props.id         - Base id for the name, description and action.
 * @param {object}  props.agent      - Agent tile data.
 * @param {boolean} [props.isCopied] - Whether to show the "Copied" state.
 * @return {object} Component markup.
 */
function TileContent( { id, agent, isCopied = false } ) {
	return (
		<Card.Content className="jetpack-ai-mcp__connect-tile-content">
			<AgentLogo agent={ agent } />
			<Stack direction="column">
				<Text id={ `${ id }-name` } variant="heading-md">
					{ agent.name }
				</Text>
				<Text id={ `${ id }-description` } variant="body-sm" className="jetpack-ai-mcp__muted">
					{ agent.description }
				</Text>
			</Stack>
			<Text
				id={ `${ id }-action` }
				variant="body-sm"
				className="jetpack-ai-mcp__connect-tile-action"
			>
				{ isCopied ? __( 'Copied', 'jetpack' ) : agent.actionLabel }
				<Icon icon={ agent.href ? arrowUpRight : copy } size={ 12 } />
				{ agent.href && (
					<VisuallyHidden>
						{
							/* translators: accessibility text */
							__( '(opens in a new tab)', 'jetpack' )
						}
					</VisuallyHidden>
				) }
			</Text>
		</Card.Content>
	);
}

/**
 * ARIA props that name a tile by its agent and describe it by the rest.
 *
 * @param {string} id - Base id from useId().
 * @return {object} ARIA props for the tile.
 */
function getTileAriaProps( id ) {
	return {
		'aria-labelledby': `${ id }-name`,
		'aria-describedby': `${ id }-description ${ id }-action`,
	};
}

/**
 * Tile that opens the agent's connector, plugin or install page.
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
		<Card.Root
			className="jetpack-ai-mcp__connect-tile"
			render={ <a href={ agent.href } target="_blank" rel="noreferrer" /> }
			onClick={ handleClick }
			{ ...getTileAriaProps( id ) }
		>
			<TileContent id={ id } agent={ agent } />
		</Card.Root>
	);
}

/**
 * Tile that copies a command, prompt or URL.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.agent         - Agent tile data.
 * @param {Function} props.setFailedText - Receives the text when copying fails.
 * @return {object} Component markup.
 */
function CopyTile( { agent, setFailedText } ) {
	const id = useId();
	const [ handleClick, isCopied ] = useCopyWithFeedback(
		agent.code,
		() => recordMcpTracksEvent( 'jetpack_mcp_connect_click', { agent: agent.key, action: 'copy' } ),
		setFailedText
	);

	return (
		<Card.Root
			className="jetpack-ai-mcp__connect-tile"
			render={ <button type="button" /> }
			onClick={ handleClick }
			{ ...getTileAriaProps( id ) }
		>
			<TileContent id={ id } agent={ agent } isCopied={ isCopied } />
		</Card.Root>
	);
}

/**
 * Shows the text to copy by hand when the browser blocks copying.
 *
 * @param {object} props         - Component props.
 * @param {object} props.failure - The failed copy, with the `text` that failed.
 * @return {object} Component markup.
 */
function CopyFallback( { failure } ) {
	const { text } = failure;
	const fieldRef = useRef();

	// Select the text so people only need to press the copy shortcut.
	useEffect( () => {
		fieldRef.current?.focus();
		fieldRef.current?.select();
	}, [ failure ] );

	return (
		<Notice.Root intent="warning">
			<Notice.Title>{ __( 'Your browser blocked copying', 'jetpack' ) }</Notice.Title>
			<Notice.Description render={ <div /> }>
				<TextareaControl
					ref={ fieldRef }
					className="jetpack-ai-mcp__copy-fallback"
					label={ __( 'Your browser blocked copying', 'jetpack' ) }
					hideLabelFromVision
					description={ __( 'Press Ctrl+C or ⌘C to copy this text.', 'jetpack' ) }
					value={ text }
					readOnly
					rows={ text.length > 100 ? 3 : 2 }
				/>
			</Notice.Description>
		</Notice.Root>
	);
}

/**
 * Warning shown while MCP access is off.
 *
 * @param {object}   props             - Component props.
 * @param {Function} props.onTurnOn    - Turns MCP access on.
 * @param {boolean}  props.isTurningOn - Whether turning it on is in progress.
 * @return {object} Component markup.
 */
function AccessOffNotice( { onTurnOn, isTurningOn } ) {
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
	const [ failedCopy, setFailedText ] = useState( null );
	const [ handleHelperClick, isHelperCopied ] = useCopyWithFeedback(
		HELPER_PROMPT,
		() => recordMcpTracksEvent( 'jetpack_mcp_connect_helper_copy' ),
		setFailedText
	);
	const handleManualSetup = useCallback( () => onNavigate( 'setup' ), [ onNavigate ] );
	const wasEnabled = useRef( mcpEnabled );
	const gridRef = useRef();
	const turnedOnFromNotice = useRef( false );
	const handleTurnOn = useCallback( () => {
		turnedOnFromNotice.current = true;
		onTurnOn();
	}, [ onTurnOn ] );

	// Turning access on removes the notice and its button, so say that it worked.
	// If the button had focus, focus falls to the body, so move it to the first tile.
	// The toggle also disables while saving, so only do this after the notice button.
	useEffect( () => {
		if ( ! wasEnabled.current && mcpEnabled ) {
			speak( __( 'MCP access is on', 'jetpack' ) );
			const { activeElement, body } = gridRef.current.ownerDocument;
			if ( turnedOnFromNotice.current && ( ! activeElement || activeElement === body ) ) {
				gridRef.current.querySelector( 'a, button' )?.focus();
			}
		}
		wasEnabled.current = mcpEnabled;
		if ( mcpEnabled || ! isTurningOn ) {
			turnedOnFromNotice.current = false;
		}
	}, [ mcpEnabled, isTurningOn ] );

	return (
		<Card.Root>
			<Card.Header>
				<Card.Title render={ <h2 /> }>
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
					{ ! mcpEnabled && (
						<AccessOffNotice onTurnOn={ handleTurnOn } isTurningOn={ isTurningOn } />
					) }
					<ul ref={ gridRef } className="jetpack-ai-mcp__connect-grid">
						{ getConnectAgents().map( agent => (
							<li key={ agent.key }>
								{ agent.href ? (
									<LinkTile agent={ agent } />
								) : (
									<CopyTile agent={ agent } setFailedText={ setFailedText } />
								) }
							</li>
						) ) }
					</ul>
					{ failedCopy && <CopyFallback failure={ failedCopy } /> }
				</Stack>
				<Card.FullBleed className="jetpack-ai-mcp__connect-footer">
					<Text variant="body-sm">
						{ __( 'Not sure where to start? Have the agent connect itself.', 'jetpack' ) }
					</Text>
					<Stack direction="row" gap="sm" align="center" justify="flex-end">
						<Button variant="minimal" size="small" onClick={ handleHelperClick }>
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
