import type { AutomationsState } from './reducer';

export const getWorkflows = ( state: { automations: AutomationsState } ) => {
	return state.automations.workflows;
};

export const getSelectedWorkflows = ( state: { automations: AutomationsState } ) => {
	return state.automations.selectedWorkflows;
};
