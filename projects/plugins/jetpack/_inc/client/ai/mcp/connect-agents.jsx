/**
 * "Connect your AI agent" onboarding card. It leads the Settings tab where
 * there is no Overview tab, and the Overview without the Skills tab. With
 * Skills on, the Overview's opening column carries the same actions bare.
 *
 * Claude and ChatGPT each install the WordPress.com connector from their own
 * directory (see ../agent-connectors.js), so they get a button apiece. Every
 * other client — Claude Code, Cursor, VS Code — follows the steps on the setup
 * sub-view, behind a quieter link. This card is the tab's one connect prompt:
 * it took the place of the hub's "Connect external AI agent" row.
 */

import { createInterpolateElement, useCallback, useId } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { ButtonLink, Card, Link, Stack, Text } from '@wordpress/ui';
import { AGENT_CONNECTORS, getAgentConnectorUrl } from '../agent-connectors';
import { getViewHref } from '../discover/skill-panel-state';
import { chatGptIcon, claudeIcon } from '../overview/connector-icons';
import { EVENTS, recordAiHubEvent } from '../tracks';

// One button per agent with a directory listing, in the order they show.
const AGENT_BUTTONS = [
	{ agent: 'claude', icon: claudeIcon },
	{ agent: 'chatgpt', icon: chatGptIcon },
];

/**
 * Record a click on one of the card's links.
 *
 * @param {string}  link       - 'claude' | 'chatgpt' | 'other'.
 * @param {boolean} onOverview - Whether the card is on Overview rather than Settings.
 */
function recordConnectClick( link, onOverview ) {
	recordAiHubEvent( EVENTS.LINK_CLICK, {
		link_type: onOverview ? 'overview_connect' : 'settings_connect',
		link,
	} );
}

/**
 * Whether a click asks the browser for something other than a plain follow —
 * a new tab or window, a download — which the link should be left to do.
 *
 * @param {MouseEvent} event - The click.
 * @return {boolean} True for a modified or non-primary click.
 */
const isModifiedClick = event =>
	event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;

/**
 * One agent's connect button: its directory listing, in a new tab.
 *
 * @param {object}  props            - Component props.
 * @param {string}  props.agent      - 'claude' | 'chatgpt'.
 * @param {*}       props.icon       - The agent's mark.
 * @param {boolean} props.onOverview - Whether the card is on Overview.
 * @return {object} Component markup.
 */
function ConnectButton( { agent, icon, onOverview } ) {
	const handleClick = useCallback(
		() => recordConnectClick( agent, onOverview ),
		[ agent, onOverview ]
	);
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
 * manual setup for the rest. The card below wraps it; the Overview's opening
 * column uses it bare, under its own heading.
 *
 * @param {object}   props                   - Component props.
 * @param {boolean}  props.isMcpEnabled      - Whether agents can reach this site yet. While
 *                                           they cannot, the copy points at the access
 *                                           switch first.
 * @param {Function} [props.onNavigate]      - Called with 'setup' to open the setup sub-view.
 * @param {boolean}  [props.showOtherAgents] - Whether to link the setup sub-view, which only
 *                                           renders once the hub does.
 * @param {boolean}  [props.onOverview]      - Whether this sits on Overview, so the access
 *                                           switch is on Settings rather than below it.
 * @param {string}   props.description       - The copy while agents can reach the site.
 * @param {boolean}  [props.centered]        - Whether to centre everything, as the Overview does.
 * @return {object} Component markup.
 */
export function ConnectAgentsActions( {
	isMcpEnabled,
	onNavigate,
	showOtherAgents = true,
	onOverview = false,
	description,
	centered = false,
} ) {
	// The link keeps a real href, so it can still open in a new tab; a plain
	// click moves in-app instead, through the page's own history handling.
	const handleOtherAgentsClick = useCallback(
		event => {
			recordConnectClick( 'other', onOverview );
			// Without a handler the link's own href moves in-app.
			if ( isModifiedClick( event ) || ! onNavigate ) {
				return;
			}
			event.preventDefault();
			onNavigate( 'setup' );
		},
		[ onNavigate, onOverview ]
	);

	const offCopy = onOverview
		? createInterpolateElement(
				__( 'Turn on MCP access in <link>Settings</link>, then connect your agent.', 'jetpack' ),
				{ link: <Link href={ getViewHref( 'mcp' ) } /> }
			)
		: __( 'Turn on MCP access below, then connect your agent.', 'jetpack' );

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
					<ConnectButton key={ agent } agent={ agent } icon={ icon } onOverview={ onOverview } />
				) ) }
			</Stack>
			{ showOtherAgents && (
				<Text variant="body-sm" render={ <p /> } className="jetpack-ai-mcp__connect-description">
					{ createInterpolateElement(
						__( '<link>Other agents</link>: Claude Code, Cursor, VS Code, and more.', 'jetpack' ),
						{
							link: <Link href={ getViewHref( 'mcp/setup' ) } onClick={ handleOtherAgentsClick } />,
						}
					) }
				</Text>
			) }
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
