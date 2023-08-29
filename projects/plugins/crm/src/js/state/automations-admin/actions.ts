import type { Workflow } from 'crm/state/automations-admin/types';

export type AutomationsAction =
	| HydrateWorkflowsAction
	| ActivateWorkflowAction
	| DeactivateWorkflowAction
	| SetAttributeAction;

export type HydrateWorkflowsAction = {
	type: 'HYDRATE_WORKFLOWS';
	workflows: Workflow[];
};

export const hydrateWorkflows = ( workflows: Workflow[] ) => {
	return {
		type: 'HYDRATE_WORKFLOWS',
		workflows,
	} as HydrateWorkflowsAction;
};

export type ActivateWorkflowAction = {
	type: 'ACTIVATE_WORKFLOW';
	id: number;
};

export const activateWorkflow = ( id: number ) => {
	return {
		type: 'ACTIVATE_WORKFLOW',
		id,
	} as ActivateWorkflowAction;
};

export type DeactivateWorkflowAction = {
	type: 'DEACTIVATE_WORKFLOW';
	id: number;
};

export const deactivateWorkflow = ( id: number ) => {
	return {
		type: 'DEACTIVATE_WORKFLOW',
		id,
	} as DeactivateWorkflowAction;
};

export type SetAttributeAction = {
	type: 'SET_ATTRIBUTE';
	workflowId: number;
	stepId: number;
	key: string;
	value: string | number | boolean;
	attribute: { key: string; value: string };
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
	} as SetAttributeAction );
