import JetpackFooter from '@automattic/jetpack-components/jetpack-footer';
import { Page } from '@wordpress/admin-ui';
import { useCallback, useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Notice, Stack, Text } from '@wordpress/ui';
import { fetchCatalog, fetchFlows, planFlows, saveFlows } from './api';
import { FlowCard } from './components/flow-card';
import { Palette } from './components/palette';
import { PromptBox } from './components/prompt-box';
import { hasFlowDrag, readDrag } from './drag';
import type { Catalog, Flow } from './types';
import './style.scss';

const uid = () => `flow-${ Math.random().toString( 36 ).slice( 2, 10 ) }`;

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

/**
 *
 */
function FlowPage( { children }: { children: React.ReactNode } ) {
	return (
		<div className="jp-admin-page">
			<Page
				className="jp-admin-page__page"
				title={ __( 'Flow', 'jetpack-flow-pkg' ) }
				subTitle={ __(
					'Connect Jetpack, MailPoet, CRM and WooCommerce: when this happens, do that.',
					'jetpack-flow-pkg'
				) }
			>
				{ children }
				<JetpackFooter />
			</Page>
		</div>
	);
}

function FlowStage() {
	const [ catalog, setCatalog ] = useState< Catalog | null >( null );
	const [ flows, setFlows ] = useState< Flow[] >( [] );
	const [ prompt, setPrompt ] = useState( '' );
	const [ planning, setPlanning ] = useState( false );
	const [ error, setError ] = useState< string | null >( null );
	const [ notice, setNotice ] = useState< string | null >( null );
	const [ saveState, setSaveState ] = useState< SaveState >( 'idle' );
	const [ revealFrom, setRevealFrom ] = useState( 0 );
	const [ dropHover, setDropHover ] = useState( false );
	const loaded = useRef( false );

	useEffect( () => {
		Promise.all( [ fetchCatalog(), fetchFlows() ] )
			.then( ( [ c, f ] ) => {
				setCatalog( c );
				setFlows( f );
				loaded.current = true;
			} )
			.catch( () => setError( __( 'Could not load Flow.', 'jetpack-flow-pkg' ) ) );
	}, [] );

	// Autosave; flows without a trigger stay local drafts until they get one.
	useEffect( () => {
		if ( ! loaded.current ) {
			return;
		}
		setSaveState( 'saving' );
		const timer = setTimeout( () => {
			saveFlows( flows.filter( f => f.trigger.type ) )
				.then( () => setSaveState( 'saved' ) )
				.catch( () => setSaveState( 'error' ) );
		}, 800 );
		return () => clearTimeout( timer );
	}, [ flows ] );

	const build = useCallback( async () => {
		setPlanning( true );
		setError( null );
		setNotice( null );
		try {
			const result = await planFlows( prompt );
			if ( ! result.flows.length ) {
				setNotice(
					__(
						'I could not match that to any connections. Try drag and drop instead.',
						'jetpack-flow-pkg'
					)
				);
				return;
			}
			// New flows are created off so nothing runs until the customer turns them on.
			const created = result.flows.map( f => ( { ...f, id: uid(), enabled: false } ) );
			setFlows( current => {
				setRevealFrom( current.length );
				return [ ...current, ...created ];
			} );
			setPrompt( '' );
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
	}, [ prompt ] );

	if ( ! catalog ) {
		return (
			<FlowPage>
				<div className="jetpack-flow">
					{ error ? (
						<Notice.Root intent="error">
							<Notice.Description>{ error }</Notice.Description>
						</Notice.Root>
					) : (
						<Text>{ __( 'Loading…', 'jetpack-flow-pkg' ) }</Text>
					) }
				</div>
			</FlowPage>
		);
	}

	const onCanvasDrop = ( event: React.DragEvent ) => {
		event.preventDefault();
		setDropHover( false );
		const payload = readDrag( event );
		if ( ! payload || payload.kind === 'step' ) {
			return;
		}
		setFlows( current => {
			setRevealFrom( current.length );
			return [
				...current,
				{
					id: uid(),
					name: '',
					enabled: false,
					trigger: { type: payload.kind === 'trigger' ? payload.id : '', config: {} },
					steps: payload.kind === 'action' ? [ { id: uid(), type: payload.id, config: {} } ] : [],
				},
			];
		} );
	};

	const triggers = catalog.triggers;
	const actions = catalog.actions;

	return (
		<FlowPage>
			<div className="jetpack-flow">
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

					<PromptBox value={ prompt } busy={ planning } onChange={ setPrompt } onSubmit={ build } />

					<div className="jetpack-flow-palettes" role="list">
						<Palette
							title={ __( 'Triggers', 'jetpack-flow-pkg' ) }
							kind="trigger"
							items={ triggers }
						/>
						<Palette
							title={ __( 'Actions', 'jetpack-flow-pkg' ) }
							kind="action"
							items={ actions }
						/>
					</div>

					<div
						className={ `jetpack-flow-canvas${ dropHover ? ' is-over' : '' }` }
						onDragOver={ event => {
							if ( hasFlowDrag( event ) ) {
								event.preventDefault();
								setDropHover( true );
							}
						} }
						onDragLeave={ () => setDropHover( false ) }
						onDrop={ onCanvasDrop }
					>
						{ flows.length === 0 ? (
							<Text variant="body-md" className="jetpack-flow-empty">
								{ __(
									'Describe a connection above, or drop a card here to start.',
									'jetpack-flow-pkg'
								) }
							</Text>
						) : (
							<Stack direction="column" gap="lg">
								{ flows.map( ( flow, index ) => (
									<FlowCard
										key={ flow.id }
										flow={ flow }
										catalog={ catalog }
										order={ Math.max( 0, index - revealFrom ) }
										onChange={ next =>
											setFlows( current => current.map( f => ( f.id === flow.id ? next : f ) ) )
										}
										onDelete={ () =>
											setFlows( current => current.filter( f => f.id !== flow.id ) )
										}
									/>
								) ) }
							</Stack>
						) }
					</div>

					<Stack align="center" justify="space-between" wrap="wrap" gap="md">
						<Text variant="body-sm" aria-live="polite">
							{ saveState === 'saving' && __( 'Saving…', 'jetpack-flow-pkg' ) }
							{ saveState === 'saved' && __( 'All changes saved', 'jetpack-flow-pkg' ) }
							{ saveState === 'error' && __( 'Could not save changes', 'jetpack-flow-pkg' ) }
						</Text>
						<Button
							variant="minimal"
							onClick={ () => navigator.clipboard?.writeText( catalog.inbound_url ) }
						>
							{ __( 'Copy inbound events URL', 'jetpack-flow-pkg' ) }
						</Button>
					</Stack>
				</Stack>
			</div>
		</FlowPage>
	);
}

export const stage = FlowStage;
