import type { WorkflowState } from './reducer';

export const getWorkflows = ( state: { workflows: WorkflowState } ) => {
	return state.workflows;
};
