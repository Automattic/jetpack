import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useId, useState } from '@wordpress/element';
import { comment, copySmall } from '@wordpress/icons';
import { Button, ButtonLink, Dialog, Icon, Stack, Text, Tooltip } from '@wordpress/ui';
import {
	trackWizardMcpLinkClicked,
	trackWizardMcpPromptCopied,
	trackWizardMcpWaitingViewed,
} from '../lib/tracks.ts';
import { bringYourAiToolCopy } from './ai-tool-copy.ts';
import { chatGptIcon, claudeIcon } from './connector-icons.tsx';
import {
	AI_TOOL_URLS,
	aiToolRowStatus,
	aiToolView,
	CONNECT_YOURSELF_PROMPT,
	COPIED_RESET_MS,
	findNewConnections,
	isReadOnlyAccess,
	MCP_POLL_TIMEOUT_MS,
	mcpPollSchedule,
	otherConnectionCount,
	otherToolConnected,
	otherWaitBaseline,
	rewaitOnReturn,
	rewaitOtherOnReturn,
	type AiTool,
	type GoalsVariation,
} from './lib.ts';
import type { Ref } from 'react';

const MCP_CONNECTIONS_PATH = '/wpcom/v2/ai-launchpad/mcp-connections';

// Also asks for the count of other AI tools, an extra lookup on Simple.
const MCP_CONNECTIONS_WITH_OTHERS_PATH = `${ MCP_CONNECTIONS_PATH }?other_connections=1`;

/** The GET /mcp-connections answer. */
interface McpConnections {
	connections?: string[];
	access_level?: string | null;
	other_connections?: unknown;
}

interface Props {
	// The goals_variation the view's events report, or null to leave it out.
	variation: GoalsVariation | null;
	// Whether a new connection can be detected. Without it, Connect only opens the AI tool.
	detectsConnections: boolean;
	// Whether each check asks WordPress.com over the network.
	pollsRemotely: boolean;
	// The AI tools shown as connected, in the order they connected.
	connected: AiTool[];
	// Called with each AI tool once its connection shows up, and whether it was connected before the view opened.
	onConnected: ( tool: AiTool, alreadyConnected?: boolean ) => void;
	// Whether a connected tool has only read-only access.
	readOnly: boolean;
	// Called on each check with the account's MCP access level.
	onReadOnlyChange: ( accessLevel: string | null ) => void;
	// Whether allowing full access from the wizard failed.
	allowFullAccessFailed: boolean;
	// Called each time the prompt for another AI tool is copied.
	onPromptCopied: () => void;
	// Whether another AI tool connected since its prompt was copied.
	otherConnected: boolean;
	// Called once another AI tool's new connection shows up.
	onOtherConnected: () => void;
	titleRef?: Ref< HTMLHeadingElement >;
}

/**
 * The "Which AI do you use?" view, shown when Continue is clicked on "Build with AI".
 *
 * After a Connect click it waits for the new connection, checking when the tab is shown again and on
 * `mcpPollSchedule()`'s timer, then shows the tool as connected. With read-only access it keeps checking, so
 * allowing full access shows the tool as connected.
 *
 * @param props                       - Component props.
 * @param props.variation             - The goals_variation the view's events report.
 * @param props.detectsConnections    - Whether a new connection can be detected.
 * @param props.pollsRemotely         - Whether each check asks WordPress.com over the network.
 * @param props.connected             - The AI tools shown as connected.
 * @param props.onConnected           - Called with the AI tool once its new connection shows up.
 * @param props.readOnly              - Whether a connected tool has only read-only access.
 * @param props.onReadOnlyChange      - Called on each check with the account's MCP access level.
 * @param props.allowFullAccessFailed - Whether allowing full access from the wizard failed.
 * @param props.onPromptCopied        - Called each time the prompt for another AI tool is copied.
 * @param props.otherConnected        - Whether another AI tool connected since its prompt was copied.
 * @param props.onOtherConnected      - Called once another AI tool's new connection shows up.
 * @param props.titleRef              - Ref to the view title, focused when the view opens.
 * @return The AI tool view.
 */
export default function AiToolStep( {
	variation,
	detectsConnections,
	pollsRemotely,
	connected,
	onConnected,
	readOnly,
	onReadOnlyChange,
	allowFullAccessFailed,
	onPromptCopied,
	otherConnected,
	onOtherConnected,
	titleRef,
}: Props ) {
	const id = useId();
	const copy = bringYourAiToolCopy();
	// The tools whose Connect was clicked.
	const [ clicked, setClicked ] = useState< AiTool[] >( [] );
	// The tool clicked most recently, while still waiting for a connection.
	const [ waitingFor, setWaitingFor ] = useState< AiTool | null >( null );
	// The tool whose wait last timed out.
	const [ timedOut, setTimedOut ] = useState< AiTool | null >( null );
	// When Copy prompt last copied, in milliseconds, or 0 while it shows Copy prompt.
	const [ copiedAt, setCopiedAt ] = useState( 0 );
	// The tools that were connected before the view opened.
	const [ existingTools, setExistingTools ] = useState< AiTool[] >( [] );
	// The count to beat while waiting for another AI tool: the count at the copy, lowered if it drops.
	const [ otherBaseline, setOtherBaseline ] = useState< number | null >( null );
	// When the prompt was last copied for a wait, so each copy restarts the wait's timeout.
	const [ otherWaitStartedAt, setOtherWaitStartedAt ] = useState( 0 );
	// The count the last timed-out wait for another AI tool started from.
	const [ otherTimedOut, setOtherTimedOut ] = useState< number | null >( null );
	const tools = [
		{ tool: 'chatgpt' as const, icon: chatGptIcon },
		{ tool: 'claude' as const, icon: claudeIcon },
	];
	const view = aiToolView( connected, waitingFor, readOnly );
	let title: string = copy.viewTitle;
	let subtitle: string = copy.viewSubtitle;
	if ( view === 'read_only' && connected.length === 2 ) {
		title = copy.bothReadOnlyTitle;
		subtitle = copy.bothReadOnlySubtitle;
	} else if ( view === 'read_only' ) {
		title = copy.readOnlyTitle( connected[ connected.length - 1 ] );
		subtitle = copy.readOnlySubtitle;
	} else if ( view === 'both_connected' ) {
		title = copy.bothConnectedTitle;
		subtitle = copy.bothConnectedSubtitle;
	} else if ( view === 'waiting' && waitingFor ) {
		title = copy.waitingTitle( waitingFor );
		subtitle = copy.waitingSubtitle;
	} else if ( view === 'connected' ) {
		const other = connected[ 0 ] === 'chatgpt' ? 'claude' : 'chatgpt';
		title = copy.connectedTitle( connected[ 0 ] );
		subtitle = copy.connectedSubtitle( connected[ 0 ], other );
	}
	if ( view === 'read_only' && allowFullAccessFailed ) {
		subtitle = copy.allowFullAccessFailed;
	}

	// Tools connected before the view opened show as connected from the start.
	useEffect( () => {
		if ( ! detectsConnections ) {
			return;
		}
		let stopped = false;
		apiFetch< McpConnections >( {
			path: MCP_CONNECTIONS_PATH,
		} )
			.then( data => {
				if ( stopped ) {
					return;
				}
				// Newest first from the endpoint, so reverse it to keep the most recent connection last.
				const existing = ( ( data?.connections ?? [] ) as AiTool[] ).reverse();
				if ( ! existing.length ) {
					return;
				}
				onReadOnlyChange( data?.access_level ?? null );
				setExistingTools( existing );
				existing.forEach( tool => onConnected( tool, true ) );
			} )
			.catch( () => {} );
		return () => {
			stopped = true;
		};
	}, [ detectsConnections, onConnected, onReadOnlyChange ] );

	useEffect( () => {
		if ( ! waitingFor && ( otherBaseline === null || otherConnected ) ) {
			return;
		}
		let stopped = false;
		let inFlight = false;
		const check = () => {
			// A tab return fires both visibilitychange and focus.
			if ( pollsRemotely && inFlight ) {
				return;
			}
			inFlight = true;
			apiFetch< McpConnections >( {
				path: otherBaseline === null ? MCP_CONNECTIONS_PATH : MCP_CONNECTIONS_WITH_OTHERS_PATH,
			} )
				.then( data => {
					if ( stopped ) {
						return;
					}
					onReadOnlyChange( data?.access_level ?? null );
					const count = otherConnectionCount( data?.other_connections );
					if ( otherToolConnected( otherBaseline, count ) ) {
						onOtherConnected();
						setOtherBaseline( null );
					} else if ( otherBaseline !== null ) {
						setOtherBaseline( otherWaitBaseline( otherBaseline, count ) );
					}
					if ( ! waitingFor ) {
						return;
					}
					const readOnlyAccess = isReadOnlyAccess( data?.access_level );
					const newTools = findNewConnections(
						data?.connections ?? [],
						clicked,
						waitingFor,
						connected
					);
					newTools.forEach( tool => onConnected( tool ) );
					// Read-only access keeps the wait going until full access is allowed.
					if (
						! readOnlyAccess &&
						( newTools.includes( waitingFor ) || connected.includes( waitingFor ) )
					) {
						setWaitingFor( null );
					}
				} )
				.catch( () => {} )
				.finally( () => {
					inFlight = false;
				} );
		};
		const onVisibilityChange = () => {
			if ( document.visibilityState === 'visible' ) {
				check();
			}
		};
		const schedule = mcpPollSchedule( pollsRemotely );
		const interval = setInterval( () => {
			if ( schedule.whileHidden || document.visibilityState === 'visible' ) {
				check();
			}
		}, schedule.intervalMs );
		// Restarts whenever this effect re-runs: a Connect click, a copy, or a change in what is waited for.
		const timeout = setTimeout( () => {
			if ( waitingFor ) {
				setTimedOut( waitingFor );
				setWaitingFor( null );
			}
			if ( otherBaseline !== null ) {
				setOtherTimedOut( otherBaseline );
				setOtherBaseline( null );
			}
		}, MCP_POLL_TIMEOUT_MS );
		document.addEventListener( 'visibilitychange', onVisibilityChange );
		if ( schedule.onFocus ) {
			window.addEventListener( 'focus', check );
		}
		// A wait restarted on return to the tab starts after that event, so the next interval would be the first check.
		if ( schedule.onStart ) {
			check();
		}
		return () => {
			stopped = true;
			clearInterval( interval );
			clearTimeout( timeout );
			document.removeEventListener( 'visibilitychange', onVisibilityChange );
			window.removeEventListener( 'focus', check );
		};
	}, [
		waitingFor,
		otherBaseline,
		otherWaitStartedAt,
		otherConnected,
		pollsRemotely,
		clicked,
		connected,
		onConnected,
		onOtherConnected,
		onReadOnlyChange,
	] );

	// Like Copy prompt on /me/mcp, the label goes back after a moment.
	useEffect( () => {
		if ( ! copiedAt ) {
			return;
		}
		const timeout = setTimeout( () => setCopiedAt( 0 ), COPIED_RESET_MS );
		return () => clearTimeout( timeout );
	}, [ copiedAt ] );

	// Allowing full access from the wizard ends a read-only wait without waiting for the next check.
	useEffect( () => {
		if ( ! readOnly && waitingFor && connected.includes( waitingFor ) ) {
			setWaitingFor( null );
		}
	}, [ readOnly, waitingFor, connected ] );

	useEffect( () => {
		const tool = waitingFor
			? null
			: rewaitOnReturn( { readOnly, connected, timedOut, pollsRemotely } );
		if ( ! tool ) {
			return;
		}
		const rewait = () => setWaitingFor( tool );
		const onVisibilityChange = () => {
			if ( document.visibilityState === 'visible' ) {
				rewait();
			}
		};
		document.addEventListener( 'visibilitychange', onVisibilityChange );
		if ( pollsRemotely ) {
			window.addEventListener( 'focus', rewait );
		}
		return () => {
			document.removeEventListener( 'visibilitychange', onVisibilityChange );
			window.removeEventListener( 'focus', rewait );
		};
	}, [ readOnly, waitingFor, connected, timedOut, pollsRemotely ] );

	useEffect( () => {
		const baseline =
			otherBaseline === null
				? rewaitOtherOnReturn( { timedOut: otherTimedOut, otherConnected, pollsRemotely } )
				: null;
		if ( baseline === null ) {
			return;
		}
		const rewait = () => setOtherBaseline( baseline );
		const onVisibilityChange = () => {
			if ( document.visibilityState === 'visible' ) {
				rewait();
			}
		};
		document.addEventListener( 'visibilitychange', onVisibilityChange );
		window.addEventListener( 'focus', rewait );
		return () => {
			document.removeEventListener( 'visibilitychange', onVisibilityChange );
			window.removeEventListener( 'focus', rewait );
		};
	}, [ otherBaseline, otherTimedOut, otherConnected, pollsRemotely ] );

	// The level is account-wide, so read-only access shown for ChatGPT or Claude applies to the other tool too.
	let otherDescription: string = copy.otherToolDescription;
	let otherStatus = '';
	if ( otherConnected ) {
		otherDescription = readOnly ? copy.readOnlyDescription : copy.connectedToAccount;
		otherStatus = readOnly ? copy.readOnly : copy.connected;
	}

	// Counts afresh at the copy, so only a tool connected after it counts; an unknown count starts no wait.
	const startOtherWait = () => {
		apiFetch< McpConnections >( { path: MCP_CONNECTIONS_WITH_OTHERS_PATH } )
			.then( data => {
				const count = otherConnectionCount( data?.other_connections );
				if ( count === null ) {
					return;
				}
				setOtherBaseline( current => otherWaitBaseline( current, count ) );
				setOtherTimedOut( null );
				setOtherWaitStartedAt( Date.now() );
			} )
			.catch( () => {} );
	};

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
					const rowStatus = aiToolRowStatus( item.tool, connected, waitingFor, readOnly );
					let description: string = copy.opensInNewTab;
					if ( rowStatus === 'read_only' ) {
						description = copy.readOnlyDescription;
					} else if ( rowStatus === 'connected' ) {
						description = copy.connectedToAccount;
					} else if ( clicked.includes( item.tool ) ) {
						description = copy.openedInNewTab;
					}
					const status = rowStatus
						? { connected: copy.connected, read_only: copy.readOnly, waiting: copy.waiting }[
								rowStatus
							]
						: '';
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
								{ /* Hover-only, per the design: the tooltip is not announced and does not show on touch. */ }
								<Tooltip.Root disabled={ ! status || ! existingTools.includes( item.tool ) }>
									<Tooltip.Trigger
										render={
											<Text
												variant="body-sm"
												role="status"
												className={
													'ai-launchpad-wizard__ai-tool-status' +
													( rowStatus === 'connected' ? ' is-connected' : '' )
												}
											>
												{ status }
											</Text>
										}
									/>
									<Tooltip.Popup
										portal={ <Tooltip.Portal className="ai-launchpad-wizard__portal" /> }
										positioner={ <Tooltip.Positioner side="top" align="end" /> }
										className="ai-launchpad-wizard__tooltip"
									>
										{ copy.alreadyConnectedTooltip }
									</Tooltip.Popup>
								</Tooltip.Root>
								{ ! status && (
									<ButtonLink
										variant="outline"
										href={ AI_TOOL_URLS[ item.tool ] }
										target="_blank"
										rel="noopener noreferrer"
										aria-describedby={ `${ titleId } ${ descriptionId }` }
										onClick={ () => {
											trackWizardMcpLinkClicked( item.tool, { goals_variation: variation } );
											setClicked( current =>
												current.includes( item.tool ) ? current : [ ...current, item.tool ]
											);
											if ( detectsConnections ) {
												trackWizardMcpWaitingViewed( {
													goals_variation: variation,
													integration: item.tool,
												} );
												setWaitingFor( item.tool );
												// A new wait replaces a timed-out one, so a return can't bring the old one back.
												setTimedOut( null );
											}
										} }
									>
										{ copy.connect }
									</ButtonLink>
								) }
							</span>
						</div>
					);
				} ) }
				<div className="ai-launchpad-wizard__card ai-launchpad-wizard__ai-tool-row">
					<Icon icon={ comment } size={ 28 } />
					<Stack
						direction="column"
						gap="xs"
						render={ <span /> }
						className="ai-launchpad-wizard__card-text"
					>
						<Text variant="heading-md" id={ `${ id }-other-title` }>
							{ copy.otherToolTitle }
						</Text>
						<Text
							variant="body-sm"
							id={ `${ id }-other-description` }
							className="ai-launchpad-wizard__card-description"
						>
							{ otherDescription }
						</Text>
					</Stack>
					<span className="ai-launchpad-wizard__ai-tool-action">
						<Text
							variant="body-sm"
							role="status"
							className={
								'ai-launchpad-wizard__ai-tool-status' +
								( otherConnected && ! readOnly ? ' is-connected' : '' )
							}
						>
							{ otherStatus }
						</Text>
						{ ! otherConnected && (
							<Button
								variant="outline"
								aria-describedby={ `${ id }-other-title ${ id }-other-description` }
								onClick={ () => {
									navigator.clipboard
										?.writeText( CONNECT_YOURSELF_PROMPT )
										.then( () => {
											trackWizardMcpPromptCopied( { goals_variation: variation } );
											setCopiedAt( Date.now() );
											speak( copy.copied );
											onPromptCopied();
											if ( detectsConnections ) {
												startOtherWait();
											}
										} )
										.catch( () => {} );
								} }
							>
								{ copiedAt ? copy.copied : copy.copyPrompt }
								<Icon icon={ copySmall } />
							</Button>
						) }
					</span>
				</div>
			</Stack>
		</Stack>
	);
}
