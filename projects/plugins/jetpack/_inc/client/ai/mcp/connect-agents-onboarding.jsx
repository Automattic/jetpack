/**
 * "Connect your AI agent" card on the Overview tab. With Skills on, the
 * Overview's opening column carries the same actions bare.
 *
 * Claude and ChatGPT each install the WordPress.com connector from their own
 * directory (see ../agent-connectors.js), so they get a button apiece. Every
 * other client — Claude Code, Cursor, VS Code — is on the Settings tab's agent
 * grid, behind a quieter link.
 */

import { createInterpolateElement, useCallback, useId } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { ButtonLink, Card, Link, Stack, Text } from '@wordpress/ui';
import { AGENT_CONNECTORS, getAgentConnectorUrl } from '../agent-connectors';
import { getViewHref, isModifiedClick } from '../discover/skill-panel-state';
import { chatGptIcon, claudeIcon } from '../overview/connector-icons';
import { EVENTS, recordAiHubEvent } from '../tracks';

// One button per agent with a directory listing, in the order they show.
const AGENT_BUTTONS = [
	{ agent: 'chatgpt', icon: chatGptIcon },
	{ agent: 'claude', icon: claudeIcon },
];

/**
 * Record a click on one of the card's links.
 *
 * @param {string} link - 'claude' | 'chatgpt' | 'other'.
 */
function recordConnectClick( link ) {
	recordAiHubEvent( EVENTS.LINK_CLICK, { link_type: 'overview_connect', link } );
}

/**
 * One agent's connect button: its directory listing, in a new tab.
 *
 * @param {object} props       - Component props.
 * @param {string} props.agent - 'claude' | 'chatgpt'.
 * @param {*}      props.icon  - The agent's mark.
 * @return {object} Component markup.
 */
function ConnectButton( { agent, icon } ) {
	const handleClick = useCallback( () => recordConnectClick( agent ), [ agent ] );
	return (
		<ButtonLink
			href={ getAgentConnectorUrl( agent ) }
			// Adds the new-tab arrow and its "(opens in a new tab)" name.
			openInNewTab
			rel="noopener noreferrer"
			variant="outline"
			// Neither agent outranks the other, so both stay neutral.
			tone="neutral"
			onClick={ handleClick }
		>
			<ButtonLink.Icon icon={ icon } />
			{ sprintf(
				/* translators: %s: an AI agent's product name, e.g. Claude or ChatGPT. */
				__( 'Connect %s', 'jetpack' ),
				AGENT_CONNECTORS[ agent ].name
			) }
		</ButtonLink>
	);
}

/**
 * What to say, a button for each directory-listed agent, and a link to the
 * Settings tab's agent grid for the rest. The card below wraps it; the Overview's opening
 * column uses it bare, under its own heading.
 *
 * @param {object}   props              - Component props.
 * @param {boolean}  props.isMcpEnabled - Whether agents can reach this site yet. While
 *                                      they cannot, the copy points at the access
 *                                      switch first.
 * @param {Function} [props.onNavigate] - Opens the Settings tab in-app.
 * @param {string}   props.description  - The copy while agents can reach the site.
 * @param {boolean}  [props.centered]   - Whether to centre everything, as the Overview does.
 * @return {object} Component markup.
 */
export function ConnectAgentsActions( {
	isMcpEnabled,
	onNavigate,
	description,
	centered = false,
} ) {
	// The link keeps a real href, so it can still open in a new tab; a plain
	// click moves in-app instead, through the page's own history handling.
	const handleSettingsClick = useCallback(
		event => {
			// Without a handler the link's own href moves in-app.
			if ( isModifiedClick( event ) || ! onNavigate ) {
				return;
			}
			event.preventDefault();
			onNavigate();
		},
		[ onNavigate ]
	);
	const handleOtherAgentsClick = useCallback(
		event => {
			recordConnectClick( 'other' );
			handleSettingsClick( event );
		},
		[ handleSettingsClick ]
	);

	const offCopy = createInterpolateElement(
		__( 'Turn on MCP access in <link>Settings</link>, then connect your agent.', 'jetpack' ),
		{ link: <Link href={ getViewHref( 'mcp' ) } onClick={ handleSettingsClick } /> }
	);

	return (
		// The Overview's column is a tight block under its heading.
		<Stack
			direction="column"
			gap={ centered ? 'md' : 'lg' }
			align={ centered ? 'center' : 'flex-start' }
		>
			<Text variant="body-md" render={ <p /> } className="jetpack-ai-mcp__connect-description">
				{ isMcpEnabled ? description : offCopy }
			</Text>
			<Stack direction="row" gap="sm" wrap="wrap" justify={ centered ? 'center' : undefined }>
				{ AGENT_BUTTONS.map( ( { agent, icon } ) => (
					<ConnectButton key={ agent } agent={ agent } icon={ icon } />
				) ) }
			</Stack>
			<Text variant="body-sm" render={ <p /> } className="jetpack-ai-mcp__connect-description">
				{ createInterpolateElement(
					__( '<link>Other agents</link>: Claude Code, Cursor, VS Code, and more.', 'jetpack' ),
					{
						link: <Link href={ getViewHref( 'mcp' ) } onClick={ handleOtherAgentsClick } />,
					}
				) }
			</Text>
		</Stack>
	);
}

/**
 * Onboarding card: a heading over the connect actions.
 *
 * @param {object} props - ConnectAgentsActions' props, less the description.
 * @return {object} Component markup.
 */
export default function McpConnectAgents( props ) {
	const headingId = useId();

	return (
		<Card.Root render={ <section aria-labelledby={ headingId } /> }>
			<Card.Header>
				<Card.Title render={ <h2 id={ headingId } /> }>
					{ __( 'Connect your AI agent', 'jetpack' ) }
				</Card.Title>
			</Card.Header>
			<Card.Content>
				<ConnectAgentsActions
					{ ...props }
					description={ __(
						'Manage your site by chatting with Claude, ChatGPT, or another agent.',
						'jetpack'
					) }
				/>
			</Card.Content>
		</Card.Root>
	);
}
