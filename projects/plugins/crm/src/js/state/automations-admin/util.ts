import { IdentifiedStep, Step } from 'crm/state/automations-admin/types';

let stepId = 1;

export const getIdentifiedStep = ( ( step?: Step ) => {
	if ( ! step ) {
		return undefined;
	}

	return {
		...step,
		...{ id: stepId++, nextStep: getIdentifiedStep( step.nextStep ) },
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
