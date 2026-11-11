import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { useEffect, useId, useState } from '@wordpress/element';
import { comment, copySmall } from '@wordpress/icons';
import { Button, ButtonLink, Dialog, Icon, Stack, Text } from '@wordpress/ui';
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
	MCP_POLL_INTERVAL_MS,
	MCP_POLL_TIMEOUT_MS,
	type AiTool,
	type GoalsVariation,
} from './lib.ts';
import type { Ref } from 'react';

interface Props {
	variation: GoalsVariation;
	// Whether a new connection can be detected. Without it, Set up only opens the AI tool.
	detectsConnections: boolean;
	// The AI tools shown as connected, in the order they connected.
	connected: AiTool[];
	// Called with each AI tool once its new connection shows up.
	onConnected: ( tool: AiTool ) => void;
	// Whether a connected tool has only read-only access.
	readOnly: boolean;
	// Called on each check with whether the account's MCP access is read only.
	onReadOnlyChange: ( readOnly: boolean ) => void;
	// Called each time the prompt for another AI tool is copied.
	onPromptCopied: () => void;
	titleRef?: Ref< HTMLHeadingElement >;
}

/**
 * The "Which AI do you use?" view, shown when Continue is clicked on "Build with AI".
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
 * @param props.onPromptCopied     - Called each time the prompt for another AI tool is copied.
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
	onPromptCopied,
	titleRef,
}: Props ) {
	const id = useId();
	const copy = bringYourAiToolCopy();
	// The tools whose Set up was clicked.
	const [ clicked, setClicked ] = useState< AiTool[] >( [] );
	// The tool clicked most recently, while still waiting for a connection.
	const [ waitingFor, setWaitingFor ] = useState< AiTool | null >( null );
	// When Copy prompt last copied, in milliseconds, or 0 while it shows Copy prompt.
	const [ copiedAt, setCopiedAt ] = useState( 0 );
	const tools = [
		{ tool: 'chatgpt' as const, icon: chatGptIcon },
		{ tool: 'claude' as const, icon: claudeIcon },
	];
	const view = aiToolView( connected, waitingFor, readOnly );
	let title: string = copy.viewTitle;
	let subtitle: string = copy.viewSubtitle;
	if ( view === 'read_only' ) {
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

	useEffect( () => {
		if ( ! waitingFor ) {
			return;
		}
		let stopped = false;
		const check = () => {
			apiFetch< { connections?: string[]; access_level?: string | null } >( {
				path: '/wpcom/v2/ai-launchpad/mcp-connections',
			} )
				.then( data => {
					if ( stopped ) {
						return;
					}
					const readOnlyAccess = isReadOnlyAccess( data?.access_level );
					onReadOnlyChange( readOnlyAccess );
					const newTools = findNewConnections(
						data?.connections ?? [],
						clicked,
						waitingFor,
						connected
					);
					newTools.forEach( onConnected );
					// Read-only access keeps the wait going until full access is allowed.
					if (
						! readOnlyAccess &&
						( newTools.includes( waitingFor ) || connected.includes( waitingFor ) )
					) {
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
	}, [ waitingFor, clicked, connected, onConnected, onReadOnlyChange ] );

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
							{ copy.otherToolDescription }
						</Text>
					</Stack>
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
								} )
								.catch( () => {} );
						} }
					>
						{ copiedAt ? copy.copied : copy.copyPrompt }
						<Icon icon={ copySmall } />
					</Button>
				</div>
			</Stack>
		</Stack>
	);
}
