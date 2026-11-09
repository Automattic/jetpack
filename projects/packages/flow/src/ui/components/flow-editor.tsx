import { useEffect, useRef, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Button, Spinner, Stack, Text } from '@wordpress/ui';
import { fetchCatalog, fetchFlow, planFlow, saveFlow, suggestName } from '../api';
import { Chat } from './chat';
import { FlowCanvas } from './flow-canvas';
import { FlowPage } from './flow-page';
import { PromptBox } from './prompt-box';
import { RequirementsNotice } from './requirements-notice';
import type { ChatMessage } from './chat';
import type { Catalog, Flow } from '../types';

const blankFlow = (): Flow => ( {
	id: null,
	name: '',
	enabled: true,
	triggers: [],
	steps: [],
} );

/** One sentence naming what a flow does, for the chat reply. */
function describeFlow( flow: Flow, catalog: Catalog ) {
	const label = ( list: { id: string; label: string }[], id: string ) =>
		list.find( item => item.id === id )?.label ?? id;
	const when = flow.triggers.map( id => label( catalog.triggers, id ) ).join( ' or ' );
	const then = flow.steps.map( step => label( catalog.actions, step.type ) ).join( ', then ' );
	return sprintf(
		/* translators: 1: trigger names, 2: action names. */ __(
			'Done. When %1$s, then %2$s.',
			'jetpack-flow-pkg'
		),
		when,
		then
	);
}

/** Builds or edits exactly one flow; saving returns to the Flows tab. */
export function FlowEditor( { flowId }: { flowId?: number } ) {
	const navigate = useNavigate();
	const [ catalog, setCatalog ] = useState< Catalog | null >( null );
	const [ flow, setFlow ] = useState< Flow >( blankFlow );
	const [ prompt, setPrompt ] = useState( '' );
	const [ planning, setPlanning ] = useState( false );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const [ messages, setMessages ] = useState< ChatMessage[] >( [] );
	const nextId = useRef( 0 );
	const planner = useRef< AbortController | null >( null );
	const [ nameTouched, setNameTouched ] = useState( false );

	const say = ( role: ChatMessage[ 'role' ], text: string ) =>
		setMessages( list => [ ...list, { id: nextId.current++, role, text } ] );

	useEffect( () => {
		Promise.all( [ fetchCatalog(), flowId ? fetchFlow( flowId ) : Promise.resolve( null ) ] )
			.then( ( [ loadedCatalog, loadedFlow ] ) => {
				setCatalog( loadedCatalog );
				if ( loadedFlow ) {
					setFlow( loadedFlow );
					setNameTouched( true );
				}
			} )
			.catch( () => setError( __( 'Could not load Flow.', 'jetpack-flow-pkg' ) ) );
	}, [ flowId ] );

	const triggerKey = flow.triggers.join();
	const stepKey = flow.steps.map( step => step.type ).join();

	// Name the flow once it has actions, until the user writes their own description.
	useEffect( () => {
		if ( nameTouched || ! stepKey ) {
			return undefined;
		}
		let current = true;
		const timer = setTimeout( () => {
			suggestName( flow )
				.then( ( { name } ) => current && name && setFlow( latest => ( { ...latest, name } ) ) )
				.catch( () => {} );
		}, 800 );
		return () => {
			current = false;
			clearTimeout( timer );
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- Only the trigger and action types matter for the name.
	}, [ triggerKey, stepKey, nameTouched ] );

	const build = async () => {
		const asked = prompt.trim();
		const controller = new AbortController();
		planner.current = controller;
		say( 'user', asked );
		setPrompt( '' );
		setPlanning( true );
		try {
			const result = await planFlow( asked, controller.signal );
			const planned = result.flows[ 0 ];
			if ( ! planned ) {
				say(
					'assistant',
					__(
						'I could not match that to any connections. Pick triggers and actions yourself instead.',
						'jetpack-flow-pkg'
					)
				);
				return;
			}
			setFlow( { ...planned, id: null, enabled: true } );
			setNameTouched( !! planned.name );
			say( 'assistant', describeFlow( planned, catalog as Catalog ) );
			if ( result.source === 'keywords' ) {
				say(
					'assistant',
					__( 'AI is unavailable, so this is a best guess from your keywords.', 'jetpack-flow-pkg' )
				);
			}
		} catch {
			if ( controller.signal.aborted ) {
				setPrompt( asked );
				say( 'assistant', __( 'Stopped. Nothing was changed.', 'jetpack-flow-pkg' ) );
			} else {
				say(
					'assistant',
					__( 'Something went wrong while building your flow.', 'jetpack-flow-pkg' )
				);
			}
		} finally {
			planner.current = null;
			setPlanning( false );
		}
	};

	const save = async () => {
		setSaving( true );
		setError( null );
		try {
			await saveFlow( flow );
			navigate( { href: '/flows' } );
		} catch {
			say( 'assistant', __( 'Could not save the flow.', 'jetpack-flow-pkg' ) );
			setSaving( false );
		}
	};

	let saveLabel: string = __( 'Save', 'jetpack-flow-pkg' );
	if ( saving ) {
		saveLabel = __( 'Saving…', 'jetpack-flow-pkg' );
	} else if ( flow.id === null && flow.enabled ) {
		saveLabel = __( 'Save and enable', 'jetpack-flow-pkg' );
	}

	const canSave = ! saving && flow.triggers.length > 0 && flow.steps.length > 0;

	return (
		<FlowPage
			tab="new"
			actions={
				<Stack align="center" gap="md">
					{ flow.id !== null && (
						<Button
							variant="outline"
							className="jetpack-flow-save"
							onClick={ () => navigate( { href: '/' } ) }
						>
							{ __( 'Cancel', 'jetpack-flow-pkg' ) }
						</Button>
					) }
					<Button className="jetpack-flow-save" disabled={ ! canSave } onClick={ save }>
						{ saveLabel }
					</Button>
				</Stack>
			}
		>
			<div className="jetpack-flow-editor">
				<div className="jetpack-flow">
					{ ! catalog ? (
						<Stack align="center" justify="center" className="jetpack-flow-loading">
							{ error ? <Text>{ error }</Text> : <Spinner /> }
						</Stack>
					) : (
						<FlowCanvas flow={ flow } catalog={ catalog } busy={ planning } onChange={ setFlow } />
					) }
				</div>
				{ catalog && (
					<Chat
						messages={ messages }
						footer={
							<PromptBox
								value={ prompt }
								busy={ planning }
								onChange={ setPrompt }
								onSubmit={ build }
								onStop={ () => planner.current?.abort() }
							/>
						}
					>
						<RequirementsNotice
							flow={ flow }
							catalog={ catalog }
							onInstalled={ name => {
								fetchCatalog().then( setCatalog );
								say(
									'assistant',
									/* translators: %s: plugin name. */ sprintf(
										__( '%s is ready.', 'jetpack-flow-pkg' ),
										name
									)
								);
							} }
						/>
					</Chat>
				) }
			</div>
		</FlowPage>
	);
}
