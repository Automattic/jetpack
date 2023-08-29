import {
	IdentifiedStep,
	IdentifiedWorkflow,
	Step,
	Workflow,
} from 'crm/state/automations-admin/types';

let stepIdCounter = 1;

/**
 * Identifies a Step object by adding a unique ID property to it.
 *
 * @function
 * @param {Step} [step] - The step to add an ID to
 * @returns {IdentifiedStep | undefined} The input step object with a unique ID property added, or undefined
 */
export const getIdentifiedStep = ( ( step?: Step ) => {
	if ( ! step ) {
		return undefined;
	}

	return {
		...step,
		...{ id: stepIdCounter++, nextStep: getIdentifiedStep( step.nextStep ) },
	} as IdentifiedStep;
} ) as ( step?: Step ) => IdentifiedStep | undefined;

/**
 * Deidentifies a IdentifiedStep object by removing the unique ID property from it.
 *
 * @function
 * @param {IdentifiedStep} [identifiedStep] - The identified step to remove the ID from
 * @returns {Step | undefined} The input identified step object with the ID removed, or undefined
 */
export const getDeidentifiedStep = ( ( identifiedStep?: IdentifiedStep ) => {
	if ( ! identifiedStep ) {
		return undefined;
	}

	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const { id, nextStep, ...step } = identifiedStep;

	return {
		...step,
		nextStep: getDeidentifiedStep( nextStep ),
	};
} ) as ( identifiedStep?: IdentifiedStep ) => Step | undefined;

/**
 * Takes a Workflow object and converts all Step objects on it to IdentifiedStep objects.
 *
 * @function
 * @param {Workflow} workflow - The Workflow object to convert
 * @returns {IdentifiedWorkflow} The workflow with all Step objects convereted to IdentifiedStep objects
 */
export const getIdentifiedWorkflow = ( ( workflow: Workflow ) => {
	return {
		...workflow,
		initial_step: getIdentifiedStep( workflow.initial_step ),
	};
} ) as ( workflow: Workflow ) => IdentifiedWorkflow;

/**
 * Takes a IdentifiedWorkflow object and converts all IdentifiedStep objects on it to Step objects.
 *
 * @function
 * @param {IdentifiedWorkflow} identifiedWorkflow - The IdentifiedWorkflow object to convert
 * @returns {Workflow} The workflow with all IdentifiedStep objects convereted to Step objects
 */
export const getDeidentifiedWorkflow = ( ( identifiedWorkflow: IdentifiedWorkflow ) => {
	return {
		...identifiedWorkflow,
		initial_step: getDeidentifiedStep( identifiedWorkflow.initial_step ),
	};
} ) as ( identifiedWorkflow: IdentifiedWorkflow ) => Workflow;

/**
 * Finds a step in a Workflow by ID.
 *
 * @param {IdentifiedWorkflow} workflow - The workflow to search for the step
 * @param {number} stepId - The ID of the step to search for
 * @returns {object} An object containing the step, its previous step, and its next step if they exist, or undefined otherwise
 */
export const findStep = ( workflow: IdentifiedWorkflow, stepId: number ) => {
	let step: IdentifiedStep | undefined = workflow.initial_step;
	let nextStep: IdentifiedStep | undefined = step.nextStep;
	let previousStep: IdentifiedStep | undefined;

	while ( step && step.id !== stepId ) {
		previousStep = step;
		step = step.nextStep;
		nextStep = step?.nextStep;
	}

	if ( ! step ) {
		previousStep = undefined;
		nextStep = undefined;
	}

	return {
		step,
		nextStep,
		previousStep,
	};
};
