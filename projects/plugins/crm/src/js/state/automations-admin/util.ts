import { Workflow, ServerPreparedWorkflow } from 'crm/state/automations-admin/types';

/**
 * Gets a workflow which has been prepared for sending to the server.
 *
 * @param {Workflow} workflow - The workflow to prepare
 * @returns {ServerPreparedWorkflow} The prepared workflow
 */
export const getServerPreparedWorkflow = ( workflow: Workflow ) => {
	return {
		...workflow,
		triggers: workflow.triggers.map( trigger => trigger.slug ),
		id: Number( workflow.id ),
	};
};
