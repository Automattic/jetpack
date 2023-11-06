import type {
	ACTIVATE_WORKFLOW,
	DEACTIVATE_WORKFLOW,
	HYDRATE_WORKFLOWS,
	SET_ATTRIBUTE,
} from 'crm/state/action-types';
import type { Workflow } from 'crm/state/automations-admin/types';

export type AutomationsAction =
	| HydrateWorkflowsAction
	| ActivateWorkflowAction
	| DeactivateWorkflowAction
	| SetAttributeAction
	| SelectWorkflowAction
	| DeselectWorkflowAction
	| SelectAllWorkflowsAction
	| DeselectAllWorkflowsAction
	| ActivateSelectedWorkflowsAction
	| DeactivateSelectedWorkflowsAction;

export type HydrateWorkflowsAction = {
	type: HYDRATE_WORKFLOWS;
	workflows: Workflow[];
};

export const hydrateWorkflows = ( workflows: Workflow[] ) => {
	return {
		type: 'HYDRATE_WORKFLOWS',
		workflows,
	} as HydrateWorkflowsAction;
};

export type ActivateWorkflowAction = {
	type: ACTIVATE_WORKFLOW;
	id: number;
};

export const activateWorkflow = ( id: number ) => {
	return {
		type: 'ACTIVATE_WORKFLOW',
		id,
	} as ActivateWorkflowAction;
};

export type DeactivateWorkflowAction = {
	type: DEACTIVATE_WORKFLOW;
	id: number;
};

export const deactivateWorkflow = ( id: number ) => {
	return {
		type: 'DEACTIVATE_WORKFLOW',
		id,
	} as DeactivateWorkflowAction;
};

export type SetAttributeAction = {
	type: SET_ATTRIBUTE;
	workflowId: number;
	stepId: string;
	attribute: { key: string; value: string | number | boolean };
};

export const setAttribute = (
	workflowId: number,
	stepId: string,
	key: string,
	value: string | number | boolean
) =>
	( {
		type: 'SET_ATTRIBUTE',
		workflowId,
		stepId,
		attribute: { key, value },
	} ) as SetAttributeAction;

export type SelectWorkflowAction = {
	type: 'SELECT_WORKFLOW';
	id: number;
};

export const selectWorkflow = ( id: number ) => {
	return {
		type: 'SELECT_WORKFLOW',
		id,
	} as SelectWorkflowAction;
};

export type DeselectWorkflowAction = {
	type: 'DESELECT_WORKFLOW';
	id: number;
};

export const deselectWorkflow = ( id: number ) => {
	return {
		type: 'DESELECT_WORKFLOW',
		id,
	} as DeselectWorkflowAction;
};

export type SelectAllWorkflowsAction = {
	type: 'SELECT_ALL_WORKFLOWS';
};

export const selectAllWorkflows = () => {
	return {
		type: 'SELECT_ALL_WORKFLOWS',
	} as SelectAllWorkflowsAction;
};

export type DeselectAllWorkflowsAction = {
	type: 'DESELECT_ALL_WORKFLOWS';
};

export const deselectAllWorkflows = () => {
	return {
		type: 'DESELECT_ALL_WORKFLOWS',
	} as DeselectAllWorkflowsAction;
};

export type ActivateSelectedWorkflowsAction = {
	type: 'ACTIVATE_SELECTED_WORKFLOWS';
};

export const activateSelectedWorkflows = () => {
	return {
		type: 'ACTIVATE_SELECTED_WORKFLOWS',
	} as ActivateSelectedWorkflowsAction;
};

export type DeactivateSelectedWorkflowsAction = {
	type: 'DEACTIVATE_SELECTED_WORKFLOWS';
};

export const deactivateSelectedWorkflows = () => {
	return {
		type: 'DEACTIVATE_SELECTED_WORKFLOWS',
	} as DeactivateSelectedWorkflowsAction;
};
