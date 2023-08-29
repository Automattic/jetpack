import { findStep, getIdentifiedWorkflow } from './util';
import type { AutomationsAction } from 'crm/state/automations-admin/actions';
import type { IdentifiedWorkflow } from 'crm/state/automations-admin/types';

export type WorkflowState = { [ index: number ]: IdentifiedWorkflow };

export const workflows = (
	state: WorkflowState = {},
	action: AutomationsAction
): WorkflowState => {
	switch ( action.type ) {
		case 'HYDRATE_WORKFLOWS':
			if ( ! action.workflows ) {
				return state;
			}
			return action.workflows.reduce(
				( newState, workflow ) => ( {
					...newState,
					[ workflow.id ]: getIdentifiedWorkflow( workflow ),
				} ),
				{}
			);
		case 'ACTIVATE_WORKFLOW':
			if ( ! action.id || ! state[ action.id ] ) {
				return state;
			}
			return { ...state, ...{ [ action.id ]: { ...state[ action.id ], active: true } } };
		case 'DEACTIVATE_WORKFLOW':
			if ( ! action.id || ! state[ action.id ] ) {
				return state;
			}
			return { ...state, ...{ [ action.id ]: { ...state[ action.id ], active: false } } };
		case 'SET_ATTRIBUTE': {
			const { workflowId, stepId, attribute } = action;
			if ( ! workflowId || ! stepId || ! attribute ) {
				return state;
			}

			if ( ! state[ workflowId ] ) {
				return state;
			}

			const { step, previousStep, nextStep } = findStep( state[ workflowId ], stepId );
			if ( step ) {
				const newAttributes = {
					...step.attributes,
					...{ [ attribute.key ]: attribute.value },
				};
				const newStep = { ...step, attributes: newAttributes, nextStep };
				previousStep
					? ( previousStep.nextStep = newStep )
					: ( state[ workflowId ].initial_step = newStep );
			}

			return state;
		}
		default:
			return state;
	}
};
