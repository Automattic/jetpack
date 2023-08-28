import type { AutomationsAction } from 'crm/state/automations-admin/actions';
import type { Workflow } from 'crm/state/automations-admin/types';

export type WorkflowState = { [ index: number ]: Workflow };

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
				( newState, workflow ) => ( { ...newState, [ workflow.id ]: workflow } ),
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
		default:
			return state;
	}
};
