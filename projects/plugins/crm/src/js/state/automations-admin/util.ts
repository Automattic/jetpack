import { Step, Workflow } from 'crm/state/automations-admin/types';

/**
 * Finds a step in a Workflow by ID.
 *
 * @param {Workflow} workflow - The workflow to search for the step
 * @param {string} stepId - The ID of the step to search for
 * @returns {object} An object containing the step, its previous step, and its next step if they exist, or undefined otherwise
 */
export const findStep = ( workflow: Workflow, stepId: string ) => {
	const step: Step | undefined = workflow.steps[ stepId ];

	let nextStep: Step | undefined;
	let previousStep: Step | undefined;

	if ( step ) {
		nextStep = step.next_step ? workflow.steps[ step.next_step ] : undefined;
		previousStep = Object.values( workflow.steps ).find( x => x.next_step === step.id );
	}

	return {
		step,
		nextStep,
		previousStep,
	};
};
