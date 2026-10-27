import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plus } from '@wordpress/icons';
import {
	Button,
	Card,
	CollapsibleCard,
	Field,
	IconButton,
	Input,
	Stack,
	Text,
} from '@wordpress/ui';
import { noAutofill } from '../no-autofill';
import { Palette } from './palette';
import { ProductIcon } from './product-icon';
import { StepFields } from './step-fields';
import type { Catalog, Flow, Step } from '../types';

type Props = {
	flow: Flow;
	catalog: Catalog;
	onChange: ( flow: Flow ) => void;
};

export const newStep = ( type: string, catalog: Catalog ): Step => ( {
	id: `step-${ Math.random().toString( 36 ).slice( 2, 10 ) }`,
	type,
	config: Object.fromEntries(
		( catalog.actions.find( a => a.id === type )?.fields ?? [] )
			.filter( field => field.default )
			.map( field => [ field.name, field.default as string ] )
	),
} );

/** A dotted line, with a plus button to insert an action at this point. */
function Wire( { onAdd }: { onAdd?: () => void } ) {
	return (
		<div className="jetpack-flow-wire jetpack-flow-enter">
			<span className="jetpack-flow-wire__line" />
			{ onAdd && (
				<IconButton
					variant="outline"
					label={ __( 'Add an action', 'jetpack-flow-pkg' ) }
					icon={ plus }
					onClick={ onAdd }
				/>
			) }
			<span className="jetpack-flow-wire__line" />
		</div>
	);
}

function Or() {
	return (
		<div className="jetpack-flow-or jetpack-flow-enter">
			<Text variant="body-sm">{ __( 'or', 'jetpack-flow-pkg' ) }</Text>
		</div>
	);
}

/** One card holding every trigger, joined by "or". */
function TriggerCard( { flow, catalog, onChange }: Props ) {
	const [ picking, setPicking ] = useState( false );
	const chosen = flow.triggers.map( id => catalog.triggers.find( t => t.id === id ) );
	const remaining = catalog.triggers.filter( t => ! flow.triggers.includes( t.id ) );
	const showPalette = flow.triggers.length === 0 || picking;

	const pick = ( id: string ) => {
		onChange( { ...flow, triggers: [ ...flow.triggers, id ] } );
		setPicking( false );
	};

	return (
		<Card.Root className="jetpack-flow-card">
			<Card.Header>
				<Card.Title>{ __( 'When…', 'jetpack-flow-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					{ flow.triggers.map( ( id, index ) => (
						<Stack direction="column" gap="md" className="jetpack-flow-enter" key={ id }>
							{ index > 0 && <Or /> }
							<Stack align="center" justify="space-between" gap="md">
								<Stack align="center" gap="md">
									{ chosen[ index ] && (
										<ProductIcon product={ chosen[ index ].product } size={ 28 } />
									) }
									<Text variant="heading-sm">{ chosen[ index ]?.label ?? id }</Text>
								</Stack>
								<Button
									variant="minimal"
									onClick={ () =>
										onChange( { ...flow, triggers: flow.triggers.filter( t => t !== id ) } )
									}
								>
									{ __( 'Remove', 'jetpack-flow-pkg' ) }
								</Button>
							</Stack>
						</Stack>
					) ) }

					{ flow.triggers.length > 0 && remaining.length > 0 && <Or /> }
					{ flow.triggers.length > 0 && remaining.length > 0 && ! picking && (
						<Stack justify="center" className="jetpack-flow-enter">
							<IconButton
								variant="outline"
								label={ __( 'Add another trigger', 'jetpack-flow-pkg' ) }
								icon={ plus }
								onClick={ () => setPicking( true ) }
							/>
						</Stack>
					) }
					{ showPalette && (
						<Palette kind="trigger" items={ remaining } onPick={ item => pick( item.id ) } />
					) }

					{ flow.triggers.includes( 'inbound_event' ) && (
						<Field.Root className="jetpack-flow-enter">
							<Field.Label>{ __( 'Webhook URL', 'jetpack-flow-pkg' ) }</Field.Label>
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
					{ flow.triggers.some( id => catalog.triggers.find( t => t.id === id )?.inbound ) && (
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
			</Card.Content>
		</Card.Root>
	);
}

/** The flow as a column of cards: one trigger card, then one card per action. */
export function FlowCanvas( { flow, catalog, onChange }: Props ) {
	const [ pendingAt, setPendingAt ] = useState< number | null >( null );
	const [ openId, setOpenId ] = useState< string | null >( null );

	// Until there is an action, the "Then…" card is the picker itself.
	const pickingAt = flow.steps.length === 0 ? 0 : pendingAt;

	// Only tokens every trigger provides are safe to use in the steps.
	const sharedTokens =
		flow.triggers
			.map( id => catalog.triggers.find( t => t.id === id )?.tokens ?? [] )
			.reduce< string[] | null >(
				( common, tokens ) =>
					common ? common.filter( token => tokens.includes( token ) ) : tokens,
				null
			) ?? [];

	const insert = ( index: number, type: string ) => {
		const step = newStep( type, catalog );
		const steps = [ ...flow.steps ];
		steps.splice( index, 0, step );
		onChange( { ...flow, steps } );
		setPendingAt( null );
		setOpenId( step.id );
	};

	const slot = ( index: number ) =>
		pickingAt === index ? (
			<>
				<Wire />
				<Card.Root className="jetpack-flow-card jetpack-flow-enter">
					<Card.Header>
						<Stack align="center" justify="space-between" gap="md">
							<Card.Title>{ __( 'Then…', 'jetpack-flow-pkg' ) }</Card.Title>
							{ flow.steps.length > 0 && (
								<Button variant="minimal" onClick={ () => setPendingAt( null ) }>
									{ __( 'Cancel', 'jetpack-flow-pkg' ) }
								</Button>
							) }
						</Stack>
					</Card.Header>
					<Card.Content>
						<Palette
							kind="action"
							items={ catalog.actions }
							onPick={ item => insert( index, item.id ) }
						/>
					</Card.Content>
				</Card.Root>
			</>
		) : (
			<Wire onAdd={ () => setPendingAt( index ) } />
		);

	return (
		<div className="jetpack-flow-canvas">
			<TriggerCard flow={ flow } catalog={ catalog } onChange={ onChange } />
			{ flow.triggers.length > 0 && (
				<div className="jetpack-flow-canvas__then">
					{ flow.steps.map( ( step, index ) => {
						const action = catalog.actions.find( a => a.id === step.type );
						return (
							<div className="jetpack-flow-canvas__item jetpack-flow-enter" key={ step.id }>
								{ slot( index ) }
								<CollapsibleCard.Root
									className="jetpack-flow-card"
									open={ openId === step.id }
									onOpenChange={ open => setOpenId( open ? step.id : null ) }
								>
									<CollapsibleCard.Header>
										<Stack align="center" gap="md">
											{ action && <ProductIcon product={ action.product } size={ 28 } /> }
											<Card.Title>{ action?.label ?? step.type }</Card.Title>
										</Stack>
									</CollapsibleCard.Header>
									<CollapsibleCard.Content>
										<Stack direction="column" gap="md">
											{ action && (
												<StepFields
													item={ action }
													config={ step.config }
													catalog={ catalog }
													tokens={ [
														...sharedTokens,
														...flow.steps
															.slice( 0, index )
															.flatMap(
																previous =>
																	catalog.actions.find( a => a.id === previous.type )?.outputs ?? []
															),
													] }
													onChange={ config =>
														onChange( {
															...flow,
															steps: flow.steps.map( s =>
																s.id === step.id ? { ...s, config } : s
															),
														} )
													}
												/>
											) }
											<Stack justify="flex-end">
												<Button
													variant="minimal"
													onClick={ () =>
														onChange( {
															...flow,
															steps: flow.steps.filter( s => s.id !== step.id ),
														} )
													}
												>
													{ __( 'Remove action', 'jetpack-flow-pkg' ) }
												</Button>
											</Stack>
										</Stack>
									</CollapsibleCard.Content>
								</CollapsibleCard.Root>
							</div>
						);
					} ) }
					{ slot( flow.steps.length ) }
				</div>
			) }
		</div>
	);
}
