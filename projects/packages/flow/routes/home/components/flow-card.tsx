import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Card, Stack, Text } from '@wordpress/ui';
import { hasFlowDrag, readDrag, startDrag } from '../drag';
import { StepFields } from './step-fields';
import type { Catalog, Flow, Step } from '../types';

type Props = {
	flow: Flow;
	catalog: Catalog;
	/** Position in the reveal sequence, drives the staggered entrance. */
	order: number;
	onChange: ( flow: Flow ) => void;
	onDelete: () => void;
};

const newStep = ( type: string ): Step => ( {
	id: `step-${ Math.random().toString( 36 ).slice( 2, 10 ) }`,
	type,
	config: {},
} );

/**
 *
 * @param root0
 * @param root0.flow
 * @param root0.catalog
 * @param root0.order
 * @param root0.onChange
 * @param root0.onDelete
 */
export function FlowCard( { flow, catalog, order, onChange, onDelete }: Props ) {
	const [ hover, setHover ] = useState< string | null >( null );
	const [ open, setOpen ] = useState< string | null >( null );

	const trigger = catalog.triggers.find( t => t.id === flow.trigger.type );
	const actionOf = ( type: string ) => catalog.actions.find( a => a.id === type );

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
		if ( payload.kind === 'action' ) {
			const steps = [ ...flow.steps ];
			steps.splice( index, 0, newStep( payload.id ) );
			onChange( { ...flow, steps } );
		} else if ( payload.kind === 'step' && payload.flowId === flow.id ) {
			const from = flow.steps.findIndex( s => s.id === payload.stepId );
			if ( from < 0 ) {
				return;
			}
			const steps = [ ...flow.steps ];
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

	const dropSlot = ( key: string, index: number ) => (
		<div
			key={ key }
			className={ `jetpack-flow-slot${ hover === key ? ' is-over' : '' }` }
			{ ...zone( key, index ) }
		/>
	);

	return (
		<Card.Root
			className="jetpack-flow-card"
			style={ { '--jetpack-flow-delay': `${ order * 140 }ms` } as React.CSSProperties }
		>
			<Card.Header>
				<Stack align="center" justify="space-between" gap="md">
					<input
						className="jetpack-flow-name"
						aria-label={ __( 'Flow name', 'jetpack-flow-pkg' ) }
						value={ flow.name }
						placeholder={ __( 'Untitled flow', 'jetpack-flow-pkg' ) }
						onChange={ event => onChange( { ...flow, name: event.target.value } ) }
					/>
					<Stack gap="sm">
						<Button
							variant="outline"
							aria-pressed={ flow.enabled }
							onClick={ () => onChange( { ...flow, enabled: ! flow.enabled } ) }
						>
							{ flow.enabled ? __( 'On', 'jetpack-flow-pkg' ) : __( 'Off', 'jetpack-flow-pkg' ) }
						</Button>
						<Button variant="minimal" onClick={ onDelete }>
							{ __( 'Delete', 'jetpack-flow-pkg' ) }
						</Button>
					</Stack>
				</Stack>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="sm">
					<div
						className={ `jetpack-flow-node jetpack-flow-node--trigger${
							hover === 'trigger' ? ' is-over' : ''
						}` }
						{ ...zone( 'trigger', 'trigger' ) }
					>
						<Text variant="body-sm">{ __( 'When', 'jetpack-flow-pkg' ) }</Text>
						<Text variant="heading-sm">
							{ trigger?.label ?? __( 'Drop a trigger here', 'jetpack-flow-pkg' ) }
						</Text>
					</div>

					{ flow.steps.map( ( step, index ) => {
						const action = actionOf( step.type );
						const isOpen = open === step.id;
						return (
							<div key={ step.id } className="jetpack-flow-step">
								{ dropSlot( `slot-${ index }`, index ) }
								<div
									className="jetpack-flow-node jetpack-flow-node--action"
									draggable
									onDragStart={ event =>
										startDrag( event, { kind: 'step', flowId: flow.id, stepId: step.id } )
									}
								>
									<Stack align="center" justify="space-between" gap="md">
										<Stack direction="column">
											<Text variant="body-sm">
												{ index === 0
													? __( 'Then', 'jetpack-flow-pkg' )
													: __( 'And', 'jetpack-flow-pkg' ) }
											</Text>
											<Text variant="heading-sm">{ action?.label ?? step.type }</Text>
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
						className={ `jetpack-flow-slot jetpack-flow-slot--end${
							hover === 'end' ? ' is-over' : ''
						}` }
						{ ...zone( 'end', flow.steps.length ) }
					>
						<Text variant="body-sm">{ __( 'Drop an action here', 'jetpack-flow-pkg' ) }</Text>
					</div>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
