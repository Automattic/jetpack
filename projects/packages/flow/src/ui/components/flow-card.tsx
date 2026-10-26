import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import { hasFlowDrag, readDrag, startDrag } from '../drag';
import { ProductIcon } from './product-icon';
import { StepFields } from './step-fields';
import type { Catalog, Flow, Step } from '../types';

type Props = {
	flow: Flow;
	catalog: Catalog;
	/** Bumped when the AI fills the card, so the nodes fly in again. */
	arrival: number;
	onChange: ( flow: Flow ) => void;
};

const newStep = ( type: string, catalog: Catalog ): Step => ( {
	id: `step-${ Math.random().toString( 36 ).slice( 2, 10 ) }`,
	type,
	config: Object.fromEntries(
		( catalog.actions.find( a => a.id === type )?.fields ?? [] )
			.filter( field => field.default )
			.map( field => [ field.name, field.default as string ] )
	),
} );

const delay = ( index: number ) =>
	( { '--jetpack-flow-delay': `${ index * 160 }ms` } ) as React.CSSProperties;

export function FlowCard( { flow, catalog, arrival, onChange }: Props ) {
	const [ hover, setHover ] = useState< string | null >( null );
	const [ open, setOpen ] = useState< string | null >( null );

	const trigger = catalog.triggers.find( t => t.id === flow.trigger.type );
	const actionOf = ( type: string ) => catalog.actions.find( a => a.id === type );
	const arriving = arrival > 0 ? 'is-arriving' : '';

	const dropOn = ( event: React.DragEvent, index: number | 'trigger' ) => {
		event.preventDefault();
		event.stopPropagation();
		setHover( null );
		const payload = readDrag( event );
		if ( ! payload ) {
			return;
		}
		if ( index === 'trigger' ) {
			if ( payload.kind === 'trigger' ) {
				onChange( { ...flow, trigger: { type: payload.id, config: {} } } );
			}
			return;
		}
		const steps = [ ...flow.steps ];
		if ( payload.kind === 'action' ) {
			steps.splice( index, 0, newStep( payload.id, catalog ) );
			onChange( { ...flow, steps } );
		} else if ( payload.kind === 'step' ) {
			const from = steps.findIndex( s => s.id === payload.stepId );
			if ( from < 0 ) {
				return;
			}
			const [ moved ] = steps.splice( from, 1 );
			steps.splice( index > from ? index - 1 : index, 0, moved );
			onChange( { ...flow, steps } );
		}
	};

	const zone = ( key: string, index: number | 'trigger' ) => ( {
		onDragOver: ( event: React.DragEvent ) => {
			if ( hasFlowDrag( event ) ) {
				event.preventDefault();
				setHover( key );
			}
		},
		onDragLeave: () => setHover( current => ( current === key ? null : current ) ),
		onDrop: ( event: React.DragEvent ) => dropOn( event, index ),
	} );

	return (
		<Card.Root className="jetpack-flow-card">
			<Card.Header>
				<Stack align="center" justify="space-between" gap="md">
					<input
						className="jetpack-flow-name"
						aria-label={ __( 'Flow name', 'jetpack-flow-pkg' ) }
						value={ flow.name }
						placeholder={ __( 'Untitled flow', 'jetpack-flow-pkg' ) }
						onChange={ event => onChange( { ...flow, name: event.target.value } ) }
					/>
					<Button
						variant="outline"
						aria-pressed={ flow.enabled }
						onClick={ () => onChange( { ...flow, enabled: ! flow.enabled } ) }
					>
						{ flow.enabled ? __( 'On', 'jetpack-flow-pkg' ) : __( 'Off', 'jetpack-flow-pkg' ) }
					</Button>
				</Stack>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="sm">
					<div
						key={ `trigger-${ arrival }` }
						className={ `jetpack-flow-node jetpack-flow-node--trigger ${ arriving }${
							hover === 'trigger' ? ' is-over' : ''
						}` }
						style={ delay( 0 ) }
						{ ...zone( 'trigger', 'trigger' ) }
					>
						{ trigger && <ProductIcon product={ trigger.product } size={ 28 } /> }
						<Stack direction="column">
							<Text variant="body-sm">{ __( 'When…', 'jetpack-flow-pkg' ) }</Text>
							<Text variant="heading-sm">
								{ trigger?.label ?? __( 'Drop a trigger here', 'jetpack-flow-pkg' ) }
							</Text>
						</Stack>
					</div>

					{ flow.steps.map( ( step, index ) => {
						const action = actionOf( step.type );
						const isOpen = open === step.id;
						return (
							<div key={ `${ step.id }-${ arrival }` } className="jetpack-flow-step">
								<div
									className={ `jetpack-flow-slot${ hover === `slot-${ index }` ? ' is-over' : '' }` }
									{ ...zone( `slot-${ index }`, index ) }
								/>
								<div
									className={ `jetpack-flow-node jetpack-flow-node--action ${ arriving }` }
									style={ delay( index + 1 ) }
									draggable
									onDragStart={ event => startDrag( event, { kind: 'step', stepId: step.id } ) }
								>
									<Stack align="center" justify="space-between" gap="md">
										<Stack align="center" gap="md">
											{ action && <ProductIcon product={ action.product } size={ 28 } /> }
											<Stack direction="column">
												<Text variant="body-sm">
													{ index === 0
														? __( 'Then', 'jetpack-flow-pkg' )
														: __( 'And', 'jetpack-flow-pkg' ) }
												</Text>
												<Text variant="heading-sm">{ action?.label ?? step.type }</Text>
											</Stack>
										</Stack>
										<Stack gap="sm">
											<Button
												variant="minimal"
												aria-expanded={ isOpen }
												onClick={ () => setOpen( isOpen ? null : step.id ) }
											>
												{ isOpen
													? __( 'Done', 'jetpack-flow-pkg' )
													: __( 'Edit', 'jetpack-flow-pkg' ) }
											</Button>
											<Button
												variant="minimal"
												onClick={ () =>
													onChange( { ...flow, steps: flow.steps.filter( s => s.id !== step.id ) } )
												}
											>
												{ __( 'Remove', 'jetpack-flow-pkg' ) }
											</Button>
										</Stack>
									</Stack>
									{ isOpen && action && (
										<StepFields
											item={ action }
											config={ step.config }
											catalog={ catalog }
											tokens={ trigger?.tokens ?? [] }
											onChange={ config =>
												onChange( {
													...flow,
													steps: flow.steps.map( s => ( s.id === step.id ? { ...s, config } : s ) ),
												} )
											}
										/>
									) }
								</div>
							</div>
						);
					} ) }

					<div
						className={ `jetpack-flow-slot jetpack-flow-slot--end${ hover === 'end' ? ' is-over' : '' }` }
						{ ...zone( 'end', flow.steps.length ) }
					>
						<Text variant="body-sm">{ __( 'Drop an action here', 'jetpack-flow-pkg' ) }</Text>
					</div>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
