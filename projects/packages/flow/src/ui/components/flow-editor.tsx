import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import {
	Button,
	Card,
	Field,
	Input,
	Notice,
	Spinner,
	Stack,
	SwitchControl,
	Text,
} from '@wordpress/ui';
import { fetchCatalog, fetchFlow, planFlow, saveFlow, suggestName } from '../api';
import { noAutofill } from '../no-autofill';
import { FlowCanvas } from './flow-canvas';
import { FlowPage } from './flow-page';
import { PromptBox } from './prompt-box';
import { RequirementsNotice } from './requirements-notice';
import type { Catalog, Flow } from '../types';

const blankFlow = (): Flow => ( {
	id: null,
	name: '',
	enabled: true,
	triggers: [],
	steps: [],
} );

/** Builds or edits exactly one flow; saving returns to the Flows tab. */
export function FlowEditor( { flowId }: { flowId?: number } ) {
	const navigate = useNavigate();
	const [ catalog, setCatalog ] = useState< Catalog | null >( null );
	const [ flow, setFlow ] = useState< Flow >( blankFlow );
	const [ prompt, setPrompt ] = useState( '' );
	const [ planning, setPlanning ] = useState( false );
	const [ saving, setSaving ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const [ notice, setNotice ] = useState< string | null >( null );
	const [ nameTouched, setNameTouched ] = useState( false );

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
		setPlanning( true );
		setError( null );
		setNotice( null );
		try {
			const result = await planFlow( prompt );
			const planned = result.flows[ 0 ];
			if ( ! planned ) {
				setNotice(
					__(
						'I could not match that to any connections. Pick triggers and actions yourself instead.',
						'jetpack-flow-pkg'
					)
				);
				return;
			}
			setFlow( current => ( { ...planned, id: current.id, enabled: current.enabled } ) );
			setNameTouched( !! planned.name );
			if ( result.source === 'keywords' ) {
				setNotice(
					__( 'AI is unavailable, so this is a best guess from your keywords.', 'jetpack-flow-pkg' )
				);
			}
		} catch {
			setError( __( 'Something went wrong while building your flow.', 'jetpack-flow-pkg' ) );
		} finally {
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
			setError( __( 'Could not save the flow.', 'jetpack-flow-pkg' ) );
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
			<div className="jetpack-flow">
				{ ! catalog ? (
					<Stack align="center" justify="center" className="jetpack-flow-loading">
						{ error ? <Text>{ error }</Text> : <Spinner /> }
					</Stack>
				) : (
					<Stack direction="column" gap="xl">
						{ error && (
							<Notice.Root intent="error">
								<Notice.Description>{ error }</Notice.Description>
							</Notice.Root>
						) }
						{ notice && (
							<Notice.Root intent="info">
								<Notice.Description>{ notice }</Notice.Description>
							</Notice.Root>
						) }

						<RequirementsNotice
							flow={ flow }
							catalog={ catalog }
							onInstalled={ () => fetchCatalog().then( setCatalog ) }
						/>

						<FlowCanvas flow={ flow } catalog={ catalog } onChange={ setFlow } />

						{ flow.steps.length > 0 && (
							<Card.Root className="jetpack-flow-settings">
								<Card.Content>
									<Stack direction="column" gap="lg">
										<Field.Root>
											<Field.Label>{ __( 'Description', 'jetpack-flow-pkg' ) }</Field.Label>
											<Input
												{ ...noAutofill }
												value={ flow.name }
												placeholder={ __( 'Describe this flow', 'jetpack-flow-pkg' ) }
												onValueChange={ name => {
													setNameTouched( true );
													setFlow( { ...flow, name } );
												} }
											/>
										</Field.Root>
										<SwitchControl
											label={
												flow.enabled
													? __( 'Flow enabled', 'jetpack-flow-pkg' )
													: __( 'Flow disabled', 'jetpack-flow-pkg' )
											}
											checked={ flow.enabled }
											onCheckedChange={ ( enabled: boolean ) => setFlow( { ...flow, enabled } ) }
										/>
									</Stack>
								</Card.Content>
							</Card.Root>
						) }
					</Stack>
				) }
			</div>
			{ catalog && (
				<PromptBox value={ prompt } busy={ planning } onChange={ setPrompt } onSubmit={ build } />
			) }
		</FlowPage>
	);
}
