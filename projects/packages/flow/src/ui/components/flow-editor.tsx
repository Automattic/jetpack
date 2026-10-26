import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useNavigate } from '@wordpress/route';
import { Button, Notice, Stack, Text } from '@wordpress/ui';
import { fetchCatalog, fetchFlow, planFlow, saveFlow } from '../api';
import { FlowCard } from './flow-card';
import { FlowPage } from './flow-page';
import { Palette } from './palette';
import { PromptBox } from './prompt-box';
import { RequirementsNotice } from './requirements-notice';
import type { Catalog, Flow } from '../types';

const blankFlow = (): Flow => ( {
	id: null,
	name: '',
	enabled: false,
	trigger: { type: '', config: {} },
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

	const canSave = ! saving && !! flow.trigger.type && flow.steps.length > 0;

	return (
		<FlowPage
			tab="new"
			actions={
				<Button className="jetpack-flow-save" disabled={ ! canSave } onClick={ save }>
					{ saving ? __( 'Saving…', 'jetpack-flow-pkg' ) : __( 'Save', 'jetpack-flow-pkg' ) }
				</Button>
			}
		>
			<div className="jetpack-flow">
				{ ! catalog ? (
					<Text>{ error ?? __( 'Loading…', 'jetpack-flow-pkg' ) }</Text>
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
								title={ __( 'Then', 'jetpack-flow-pkg' ) }
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

						<Stack justify="flex-end">
							<Button
								variant="minimal"
								onClick={ () => navigator.clipboard?.writeText( catalog.inbound_url ) }
							>
								{ __( 'Copy inbound events URL', 'jetpack-flow-pkg' ) }
							</Button>
						</Stack>
					</Stack>
				) }
			</div>
		</FlowPage>
	);
}
