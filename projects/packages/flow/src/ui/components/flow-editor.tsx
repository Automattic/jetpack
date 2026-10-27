import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Button, Field, Input, Notice, Spinner, Stack, SwitchControl, Text } from '@wordpress/ui';
import { fetchCatalog, fetchFlow, planFlow, saveFlow, suggestName } from '../api';
import { noAutofill } from '../no-autofill';
import { BrandStrip } from './brand-strip';
import { FlowCard, newStep } from './flow-card';
import { FlowPage } from './flow-page';
import { FlowPanel } from './flow-panel';
import { Palette } from './palette';
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
	const [ arrival, setArrival ] = useState( 0 );
	const [ error, setError ] = useState< string | null >( null );
	const [ notice, setNotice ] = useState< string | null >( null );
	const [ open, setOpen ] = useState( { when: true, then: false, flow: false } );
	const [ nameTouched, setNameTouched ] = useState( false );

	useEffect( () => {
		Promise.all( [ fetchCatalog(), flowId ? fetchFlow( flowId ) : Promise.resolve( null ) ] )
			.then( ( [ loadedCatalog, loadedFlow ] ) => {
				setCatalog( loadedCatalog );
				if ( loadedFlow ) {
					setFlow( loadedFlow );
					setNameTouched( true );
					setOpen( { when: false, then: false, flow: true } );
				}
			} )
			.catch( () => setError( __( 'Could not load Flow.', 'jetpack-flow-pkg' ) ) );
	}, [ flowId ] );

	const edit = ( next: Flow ) => {
		setArrival( 0 );
		if ( flow.triggers.length === 0 && next.triggers.length > 0 ) {
			setOpen( current => ( { ...current, when: false, then: true } ) );
		}
		if ( flow.steps.length === 0 && next.steps.length > 0 ) {
			setOpen( current => ( { ...current, flow: true } ) );
		}
		setFlow( next );
	};

	const togglePanel = ( panel: 'when' | 'then' | 'flow' ) => ( isOpen: boolean ) =>
		setOpen( current => ( { ...current, [ panel ]: isOpen } ) );

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
						'I could not match that to any connections. Try drag and drop instead.',
						'jetpack-flow-pkg'
					)
				);
				return;
			}
			setFlow( current => ( { ...planned, id: current.id, enabled: current.enabled } ) );
			setNameTouched( !! planned.name );
			setOpen( { when: false, then: false, flow: true } );
			setArrival( count => count + 1 );
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

						<PromptBox
							value={ prompt }
							busy={ planning }
							onChange={ setPrompt }
							onSubmit={ build }
						/>

						<RequirementsNotice
							flow={ flow }
							catalog={ catalog }
							onInstalled={ () => fetchCatalog().then( setCatalog ) }
						/>

						<FlowPanel
							title={ __( 'When…', 'jetpack-flow-pkg' ) }
							complete={ flow.triggers.length > 0 }
							summary={ flow.triggers
								.map( id => catalog.triggers.find( t => t.id === id )?.label ?? id )
								.join( ', ' ) }
							open={ open.when }
							onOpenChange={ togglePanel( 'when' ) }
						>
							<Stack direction="column" gap="lg">
								<FlowCard
									part="triggers"
									flow={ flow }
									catalog={ catalog }
									arrival={ arrival }
									onChange={ edit }
								/>
								<Palette
									kind="trigger"
									items={ catalog.triggers }
									onPick={ item =>
										flow.triggers.includes( item.id )
											? undefined
											: edit( { ...flow, triggers: [ ...flow.triggers, item.id ] } )
									}
								/>
								{ flow.triggers.includes( 'inbound_event' ) && (
									<Field.Root>
										<Field.Label>{ __( 'Inbound event URL', 'jetpack-flow-pkg' ) }</Field.Label>
										<Stack align="center" gap="sm">
											<Input
												{ ...noAutofill }
												readOnly
												value={
													flow.inbound_url ||
													__( 'The secret URL appears after you save.', 'jetpack-flow-pkg' )
												}
											/>
											<Button
												variant="outline"
												disabled={ ! flow.inbound_url }
												onClick={ () => navigator.clipboard?.writeText( flow.inbound_url ?? '' ) }
											>
												{ __( 'Copy', 'jetpack-flow-pkg' ) }
											</Button>
										</Stack>
										<Field.Description>
											{ __(
												'Send a GET or POST request here from any program. Treat the URL like a password.',
												'jetpack-flow-pkg'
											) }
										</Field.Description>
									</Field.Root>
								) }
								{ flow.triggers.some(
									id => catalog.triggers.find( t => t.id === id )?.inbound
								) && (
									<Stack justify="flex-end">
										<Button
											variant="minimal"
											onClick={ () => navigator.clipboard?.writeText( catalog.inbound_url ) }
										>
											{ __( 'Copy inbound events URL', 'jetpack-flow-pkg' ) }
										</Button>
									</Stack>
								) }
							</Stack>
						</FlowPanel>

						{ flow.triggers.length > 0 && (
							<FlowPanel
								title={ __( 'Then…', 'jetpack-flow-pkg' ) }
								complete={ flow.steps.length > 0 }
								summary={ flow.steps
									.map(
										step => catalog.actions.find( a => a.id === step.type )?.label ?? step.type
									)
									.join( ', ' ) }
								open={ open.then }
								onOpenChange={ togglePanel( 'then' ) }
							>
								<Stack direction="column" gap="lg">
									<FlowCard
										part="steps"
										flow={ flow }
										catalog={ catalog }
										arrival={ arrival }
										onChange={ edit }
									/>
									<Palette
										kind="action"
										items={ catalog.actions }
										onPick={ item =>
											edit( { ...flow, steps: [ ...flow.steps, newStep( item.id, catalog ) ] } )
										}
									/>
								</Stack>
							</FlowPanel>
						) }

						{ flow.steps.length > 0 && (
							<FlowPanel
								title={ __( 'Flow', 'jetpack-flow-pkg' ) }
								complete={ !! flow.name }
								summary={ flow.name }
								open={ open.flow }
								onOpenChange={ togglePanel( 'flow' ) }
							>
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
							</FlowPanel>
						) }

						<BrandStrip />
					</Stack>
				) }
			</div>
		</FlowPage>
	);
}
