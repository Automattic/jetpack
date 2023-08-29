import {
	IdentifiedStep,
	IdentifiedWorkflow,
	Step,
	Workflow,
} from 'crm/state/automations-admin/types';

let stepIdCounter = 1;

export const getIdentifiedStep = ( ( step?: Step ) => {
	if ( ! step ) {
		return undefined;
	}

	return {
		...step,
		...{ id: stepIdCounter++, nextStep: getIdentifiedStep( step.nextStep ) },
	} as IdentifiedStep;
} ) as ( step?: Step ) => IdentifiedStep | undefined;

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

export const getIdentifiedWorkflow = ( ( workflow: Workflow ) => {
	return {
		...workflow,
		initial_step: getIdentifiedStep( workflow.initial_step ),
	};
} ) as ( workflow: Workflow ) => IdentifiedWorkflow;

export const getDeidentifiedWorkflow = ( ( identifiedWorkflow: IdentifiedWorkflow ) => {
	return {
		...identifiedWorkflow,
		initial_step: getDeidentifiedStep( identifiedWorkflow.initial_step ),
	};
} ) as ( identifiedWorkflow: IdentifiedWorkflow ) => Workflow;

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
