import type { AutomationsAction } from 'crm/state/automations-admin/actions';
import type { Workflow } from 'crm/state/automations-admin/types';

export type WorkflowState = { [ workflowId: number ]: Workflow };

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
					[ workflow.id ]: workflow,
				} ),
				{}
			);
		case 'ACTIVATE_WORKFLOW':
			if ( ! action.id || ! state[ action.id ] ) {
				return state;
			}
			return { ...state, [ action.id ]: { ...state[ action.id ], active: true } };
		case 'DEACTIVATE_WORKFLOW':
			if ( ! action.id || ! state[ action.id ] ) {
				return state;
			}
			return { ...state, [ action.id ]: { ...state[ action.id ], active: false } };
		case 'SET_ATTRIBUTE': {
			const { workflowId, stepId, attribute } = action;
			if ( ! workflowId || ! stepId || ! attribute ) {
				return state;
			}

			const workflow = state[ workflowId ];
			if ( ! workflow ) {
				return state;
			}

			const step = workflow.steps[ stepId ];
			if ( step ) {
				const newAttributes = {
					...step.attributes,
					[ attribute.key ]: attribute.value,
				};

				const newStep = { ...step, attributes: newAttributes };
				const newWorkflow = { ...workflow, steps: { ...workflow.steps, [ newStep.id ]: newStep } };

				return { ...state, [ workflow.id ]: newWorkflow };
			}

			return state;
		}
		default:
			return state;
	}
};
