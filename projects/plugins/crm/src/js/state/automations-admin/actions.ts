import type { Workflow } from 'crm/state/automations-admin/types';

export type AutomationsAction = {
	type: 'HYDRATE_WORKFLOWS' | 'ACTIVATE_WORKFLOW' | 'DEACTIVATE_WORKFLOW' | 'SET_ATTRIBUTE';
	id?: number;
	workflows?: Workflow[];
	workflowId?: number;
	stepId?: number;
	attribute?: { key: string; value: string };
};

export const hydrateWorkflows = ( workflows: Workflow[] ) => {
	return {
		type: 'HYDRATE_WORKFLOWS',
		workflows,
	} as AutomationsAction;
};

export const activateWorkflow = ( id: number ) => {
	return {
		type: 'ACTIVATE_WORKFLOW',
		id,
	} as AutomationsAction;
};

export const deactivateWorkflow = ( id: number ) => {
	return {
		type: 'DEACTIVATE_WORKFLOW',
		id,
	} as AutomationsAction;
};

export const setAttribute = (
	workflowId: number,
	stepId: number,
	key: string,
	value: string | number | boolean
) =>
	( {
		type: 'SET_ATTRIBUTE',
		workflowId,
		stepId,
		attribute: { key, value },
	} as AutomationsAction );
