import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Button, Field, Input, Notice, Spinner, Stack, SwitchControl, Text } from '@wordpress/ui';
import { fetchCatalog, fetchFlow, planFlow, saveFlow } from '../api';
import { noAutofill } from '../no-autofill';
import { BrandStrip } from './brand-strip';
import { FlowCard } from './flow-card';
import { FlowPage } from './flow-page';
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

	useEffect( () => {
		Promise.all( [ fetchCatalog(), flowId ? fetchFlow( flowId ) : Promise.resolve( null ) ] )
			.then( ( [ loadedCatalog, loadedFlow ] ) => {
				setCatalog( loadedCatalog );
				if ( loadedFlow ) {
					setFlow( loadedFlow );
				}
			} )
			.catch( () => setError( __( 'Could not load Flow.', 'jetpack-flow-pkg' ) ) );
	}, [ flowId ] );

	const edit = ( next: Flow ) => {
		setArrival( 0 );
		setFlow( next );
	};

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

						<div className="jetpack-flow-palettes">
							<Palette
								title={ __( 'When…', 'jetpack-flow-pkg' ) }
								kind="trigger"
								items={ catalog.triggers }
							/>
							<Palette
								title={ __( 'Then…', 'jetpack-flow-pkg' ) }
								kind="action"
								items={ catalog.actions }
							/>
						</div>

						<RequirementsNotice
							flow={ flow }
							catalog={ catalog }
							onInstalled={ () => fetchCatalog().then( setCatalog ) }
						/>

						<FlowCard flow={ flow } catalog={ catalog } arrival={ arrival } onChange={ edit } />

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

						<Stack justify="flex-end">
							<Button
								variant="minimal"
								onClick={ () => navigator.clipboard?.writeText( catalog.inbound_url ) }
							>
								{ __( 'Copy inbound events URL', 'jetpack-flow-pkg' ) }
							</Button>
						</Stack>

						<Stack justify="center">
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

						<BrandStrip />
					</Stack>
				) }
			</div>
		</FlowPage>
	);
}
