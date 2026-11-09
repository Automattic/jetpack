import apiFetch from '@wordpress/api-fetch';
import { useEffect, useId, useState } from '@wordpress/element';
import { ButtonLink, Dialog, Icon, Stack, Text } from '@wordpress/ui';
import { trackWizardMcpLinkClicked } from '../lib/tracks.ts';
import { chatGptIcon, claudeIcon } from './connector-icons.tsx';
import { bringYourAiToolCopy } from './goals-step.tsx';
import {
	AI_TOOL_URLS,
	findNewConnection,
	MCP_POLL_INTERVAL_MS,
	MCP_POLL_TIMEOUT_MS,
	type AiTool,
	type GoalsVariation,
	type McpConnection,
} from './lib.ts';
import type { Ref } from 'react';

interface Props {
	variation: GoalsVariation;
	// Whether a new connection can be detected. Without it, Set up only opens the AI tool.
	detectsConnections: boolean;
	// The AI tools shown as connected, in the order they connected.
	connected: AiTool[];
	// Called with the AI tool once its new connection shows up.
	onConnected: ( tool: AiTool ) => void;
	// Whether a connected tool has only read-only access.
	readOnly: boolean;
	// Called on each check with whether the account's MCP access is read only.
	onReadOnlyChange: ( readOnly: boolean ) => void;
	titleRef?: Ref< HTMLHeadingElement >;
}

/**
 * The "Which AI do you use?" view, shown when Continue is clicked on "Build with my AI".
 *
 * After a Set up click it waits for the new connection, checking when the tab is shown again and every few
 * seconds, then shows the tool as connected. With read-only access it keeps checking, so allowing full access shows
 * the tool as connected.
 *
 * @param props                    - Component props.
 * @param props.variation          - The goals step's experiment variation.
 * @param props.detectsConnections - Whether a new connection can be detected.
 * @param props.connected          - The AI tools shown as connected.
 * @param props.onConnected        - Called with the AI tool once its new connection shows up.
 * @param props.readOnly           - Whether a connected tool has only read-only access.
 * @param props.onReadOnlyChange   - Called on each check with whether the account's access is read only.
 * @param props.titleRef           - Ref to the view title, focused when the view opens.
 * @return The AI tool view.
 */
export default function AiToolStep( {
	variation,
	detectsConnections,
	connected,
	onConnected,
	readOnly,
	onReadOnlyChange,
	titleRef,
}: Props ) {
	const id = useId();
	const copy = bringYourAiToolCopy();
	// When each tool's Set up was clicked, in Unix seconds.
	const [ clicks, setClicks ] = useState< Partial< Record< AiTool, number > > >( {} );
	// The tool clicked most recently, while still waiting for a connection.
	const [ waitingFor, setWaitingFor ] = useState< AiTool | null >( null );
	const tools = [
		{ tool: 'chatgpt' as const, icon: chatGptIcon },
		{ tool: 'claude' as const, icon: claudeIcon },
	];
	let title: string = copy.viewTitle;
	let subtitle: string = copy.viewSubtitle;
	if ( readOnly ) {
		title = copy.readOnlyTitle( connected[ connected.length - 1 ] );
		subtitle = copy.readOnlySubtitle;
	} else if ( connected.length === tools.length ) {
		title = copy.bothConnectedTitle;
		subtitle = copy.bothConnectedSubtitle;
	} else if ( waitingFor ) {
		title = copy.waitingTitle( waitingFor );
		subtitle = copy.waitingSubtitle;
	} else if ( connected.length ) {
		const other = connected[ 0 ] === 'chatgpt' ? 'claude' : 'chatgpt';
		title = copy.connectedTitle( connected[ 0 ] );
		subtitle = copy.connectedSubtitle( connected[ 0 ], other );
	}

	useEffect( () => {
		if ( ! waitingFor ) {
			return;
		}
		let stopped = false;
		const check = () => {
			apiFetch< { connections?: McpConnection[]; access_level?: string | null } >( {
				path: '/wpcom/v2/ai-launchpad/mcp-connections',
			} )
				.then( data => {
					if ( stopped ) {
						return;
					}
					const readOnlyAccess = data?.access_level === 'read_only';
					onReadOnlyChange( readOnlyAccess );
					const tool = findNewConnection( data?.connections ?? [], clicks, waitingFor, connected );
					if ( tool ) {
						onConnected( tool );
					}
					// Read-only access keeps the wait going until full access is allowed.
					if ( ! readOnlyAccess && ( tool === waitingFor || connected.includes( waitingFor ) ) ) {
						setWaitingFor( null );
					}
				} )
				.catch( () => {} );
		};
		const onVisibilityChange = () => {
			if ( document.visibilityState === 'visible' ) {
				check();
			}
		};
		const interval = setInterval( check, MCP_POLL_INTERVAL_MS );
		// Measured from the latest click, since each click re-runs this effect.
		const timeout = setTimeout( () => setWaitingFor( null ), MCP_POLL_TIMEOUT_MS );
		document.addEventListener( 'visibilitychange', onVisibilityChange );
		return () => {
			stopped = true;
			clearInterval( interval );
			clearTimeout( timeout );
			document.removeEventListener( 'visibilitychange', onVisibilityChange );
		};
	}, [ waitingFor, clicks, connected, onConnected, onReadOnlyChange ] );

	// Once a read-only wait times out, coming back to the tab waits again, so allowing full access still shows.
	useEffect( () => {
		if ( ! readOnly || waitingFor ) {
			return;
		}
		const onVisibilityChange = () => {
			if ( document.visibilityState === 'visible' ) {
				setWaitingFor( connected[ connected.length - 1 ] );
			}
		};
		document.addEventListener( 'visibilitychange', onVisibilityChange );
		return () => document.removeEventListener( 'visibilitychange', onVisibilityChange );
	}, [ readOnly, waitingFor, connected ] );

	return (
		<Stack direction="column" gap="lg">
			<Stack direction="column" gap="xs">
				<Dialog.Title ref={ titleRef } tabIndex={ -1 } className="ai-launchpad-wizard__title">
					{ title }
				</Dialog.Title>
				<Text render={ <p /> } className="ai-launchpad-wizard__step-subtitle">
					{ subtitle }
				</Text>
			</Stack>
			<Stack direction="column" gap="md">
				{ tools.map( item => {
					const titleId = `${ id }-${ item.tool }-title`;
					const descriptionId = `${ id }-${ item.tool }-description`;
					const isConnected = connected.includes( item.tool );
					const isWaiting = ! isConnected && waitingFor === item.tool;
					let description: string = copy.opensInNewTab;
					if ( isConnected ) {
						description = readOnly ? copy.readOnlyDescription : copy.connectedToAccount;
					} else if ( clicks[ item.tool ] !== undefined ) {
						description = copy.openedInNewTab;
					}
					let status = '';
					if ( isConnected ) {
						status = readOnly ? copy.readOnly : copy.connected;
					} else if ( isWaiting ) {
						status = copy.waiting;
					}
					return (
						<div
							key={ item.tool }
							className="ai-launchpad-wizard__card ai-launchpad-wizard__ai-tool-row"
						>
							<Icon icon={ item.icon } size={ 28 } />
							<Stack
								direction="column"
								gap="xs"
								render={ <span /> }
								className="ai-launchpad-wizard__card-text"
							>
								<Text variant="heading-md" id={ titleId }>
									{ copy.toolName( item.tool ) }
								</Text>
								<Text
									variant="body-sm"
									id={ descriptionId }
									className="ai-launchpad-wizard__card-description"
								>
									{ description }
								</Text>
							</Stack>
							<span className="ai-launchpad-wizard__ai-tool-action">
								<Text
									variant="body-sm"
									role="status"
									className={
										'ai-launchpad-wizard__ai-tool-status' +
										( isConnected && ! readOnly ? ' is-connected' : '' )
									}
								>
									{ status }
								</Text>
								{ ! status && (
									<ButtonLink
										variant="outline"
										href={ AI_TOOL_URLS[ item.tool ] }
										target="_blank"
										rel="noopener noreferrer"
										aria-describedby={ `${ titleId } ${ descriptionId }` }
										onClick={ () => {
											trackWizardMcpLinkClicked( item.tool, { goals_variation: variation } );
											setClicks( current => ( {
												...current,
												[ item.tool ]: Math.floor( Date.now() / 1000 ),
											} ) );
											if ( detectsConnections ) {
												setWaitingFor( item.tool );
											}
										} }
									>
										{ copy.setUp }
									</ButtonLink>
								) }
							</span>
						</div>
					);
				} ) }
			</Stack>
		</Stack>
	);
}
