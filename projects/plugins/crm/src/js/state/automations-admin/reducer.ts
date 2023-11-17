import type { AutomationsAction } from 'crm/state/automations-admin/actions';
import type { Workflow } from 'crm/state/automations-admin/types';

export type AutomationsState = {
	workflows: { [ workflowId: number ]: Workflow };
	selectedWorkflows: Workflow[ 'id' ][];
};

export const automations = (
	state: AutomationsState = { workflows: {}, selectedWorkflows: [] },
	action: AutomationsAction
): AutomationsState => {
	switch ( action.type ) {
		case 'HYDRATE_WORKFLOWS': {
			if ( ! action.workflows ) {
				return state;
			}
			const workflows = action.workflows.reduce(
				( newState, workflow ) => ( {
					...newState,
					[ workflow.id ]: workflow,
				} ),
				{}
			);
			return { ...state, workflows };
		}
		case 'ACTIVATE_WORKFLOW': {
			if ( ! action.id || ! state.workflows[ action.id ] ) {
				return state;
			}
			const workflows = {
				...state.workflows,
				[ action.id ]: { ...state.workflows[ action.id ], active: true },
			};
			return { ...state, workflows };
		}
		case 'DEACTIVATE_WORKFLOW': {
			if ( ! action.id || ! state.workflows[ action.id ] ) {
				return state;
			}
			const workflows = {
				...state.workflows,
				[ action.id ]: { ...state.workflows[ action.id ], active: false },
			};
			return { ...state, workflows };
		}
		case 'SET_ATTRIBUTE': {
			const { workflowId, stepId, attribute } = action;
			if ( ! workflowId || ! stepId || ! attribute ) {
				return state;
			}

			const workflow = state.workflows[ workflowId ];
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

				const workflows = { ...state.workflows, [ workflow.id ]: newWorkflow };
				return { ...state, workflows };
			}

			return state;
		}
		case 'SELECT_WORKFLOW': {
			if ( state.selectedWorkflows.includes( action.id ) ) {
				return state;
			}
			return { ...state, selectedWorkflows: [ ...state.selectedWorkflows, action.id ] };
		}
		case 'DESELECT_WORKFLOW': {
			return {
				...state,
				selectedWorkflows: state.selectedWorkflows.filter( id => id !== action.id ),
			};
		}
		case 'SELECT_ALL_WORKFLOWS': {
			return {
				...state,
				selectedWorkflows: Object.values( state.workflows ).map( workflow => workflow.id ),
			};
		}
		case 'DESELECT_ALL_WORKFLOWS': {
			return { ...state, selectedWorkflows: [] };
		}
		case 'ACTIVATE_SELECTED_WORKFLOWS': {
			const activatedWorkflows = state.selectedWorkflows.reduce(
				( newWorkflows, id ) => ( {
					...newWorkflows,
					[ id ]: { ...state.workflows[ id ], active: true },
				} ),
				{}
			);
			return { ...state, workflows: { ...state.workflows, ...activatedWorkflows } };
		}
		case 'DEACTIVATE_SELECTED_WORKFLOWS': {
			const deactivatedWorkflows = state.selectedWorkflows.reduce(
				( newWorkflows, id ) => ( {
					...newWorkflows,
					[ id ]: { ...state.workflows[ id ], active: false },
				} ),
				{}
			);
			return { ...state, workflows: { ...state.workflows, ...deactivatedWorkflows } };
		}
		default:
			return state;
	}
};
