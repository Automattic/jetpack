import { IdentifiedStep, IdentifiedWorkflow } from 'crm/state/automations-admin/types';
import {
	getIdentifiedStep,
	getDeidentifiedStep,
	getIdentifiedWorkflow,
	getDeidentifiedWorkflow,
	findStep,
} from '../util';
import {
	getStep,
	getIdentifiedStep as getIdentifiedStepUtil,
	workflowOne,
	getWorkflow,
} from './util/data';

describe( 'getIdentifiedStep', () => {
	test( 'returns undefined if the step is undefined', () => {
		const identifiedStep = getIdentifiedStep( undefined );
		expect( identifiedStep ).toBeUndefined();
	} );

	test( 'returns steps with slugs that match the input steps', () => {
		const firstStep = getStep( 'First Step' );
		const secondStep = getStep( 'Second Step' );
		firstStep.nextStep = secondStep;

		const identifiedStep = getIdentifiedStep( firstStep );

		// Steps exist
		expect( identifiedStep ).toBeDefined();
		expect( identifiedStep?.nextStep ).toBeDefined();

		// Step slugs match the slugs of the input steps
		expect( identifiedStep?.slug ).toEqual( firstStep.slug );
		expect( identifiedStep?.nextStep?.slug ).toEqual( secondStep.slug );
	} );

	test( 'returns a final step without a next step', () => {
		const firstStep = getStep( 'First Step' );
		const secondStep = getStep( 'Second Step' );
		firstStep.nextStep = secondStep;

		const identifiedStep = getIdentifiedStep( firstStep );

		expect( identifiedStep?.nextStep?.nextStep ).toBeUndefined();
	} );

	test( 'returns identified steps with unique IDs', () => {
		const firstStep = getStep( 'First Step' );
		const secondStep = getStep( 'Second Step' );
		firstStep.nextStep = secondStep;

		const identifiedStep = getIdentifiedStep( firstStep );

		expect( identifiedStep?.id ).toBeDefined();
		expect( identifiedStep?.nextStep?.id ).toBeDefined();
		expect( identifiedStep?.id ).not.toEqual( identifiedStep?.nextStep?.id );
	} );
} );

describe( 'getDeidentifiedStep', () => {
	test( 'returns undefined if the step is undefined', () => {
		const deidentifiedStep = getDeidentifiedStep( undefined );
		expect( deidentifiedStep ).toBeUndefined();
	} );

	test( 'returns steps with slugs that match the input steps', () => {
		const firstStep = getIdentifiedStepUtil( 'First Step', 1 ) as IdentifiedStep;
		const secondStep = getIdentifiedStepUtil( 'Second Step', 2 ) as IdentifiedStep;
		firstStep.nextStep = secondStep;

		const deidentifiedStep = getDeidentifiedStep( firstStep );

		// Steps exist
		expect( deidentifiedStep ).toBeDefined();
		expect( deidentifiedStep?.nextStep ).toBeDefined();

		// Step slugs match the slugs of the input steps
		expect( deidentifiedStep?.slug ).toEqual( firstStep.slug );
		expect( deidentifiedStep?.nextStep?.slug ).toEqual( secondStep.slug );
	} );

	test( 'returns a final step without a next step', () => {
		const firstStep = getIdentifiedStepUtil( 'First Step', 1 ) as IdentifiedStep;
		const secondStep = getIdentifiedStepUtil( 'Second Step', 2 ) as IdentifiedStep;
		firstStep.nextStep = secondStep;

		const deidentifiedStep = getDeidentifiedStep( firstStep );

		expect( deidentifiedStep?.nextStep?.nextStep ).toBeUndefined();
	} );

	test( 'returns the steps without IDs', () => {
		const firstStep = getIdentifiedStepUtil( 'First Step', 1 ) as IdentifiedStep;
		const secondStep = getIdentifiedStepUtil( 'Second Step', 2 ) as IdentifiedStep;
		firstStep.nextStep = secondStep;

		const deidentifiedStep = getDeidentifiedStep( firstStep );
		expect( deidentifiedStep ).not.toHaveProperty( 'id' );
		expect( deidentifiedStep?.nextStep ).not.toHaveProperty( 'id' );
	} );
} );

describe( 'getIdentifiedWorkflow', () => {
	test( 'returns a workflow with identifiedSteps', () => {
		const identifiedWorkflow = getIdentifiedWorkflow( workflowOne );

		expect( identifiedWorkflow.initial_step.id ).toBeDefined();
	} );
} );

describe( 'getDeidentifiedWorkflow', () => {
	test( 'returns a workflow with deidentified steps', () => {
		const identifiedWorkflow = getIdentifiedWorkflow( workflowOne );

		const deidentifiedWorkflow = getDeidentifiedWorkflow( identifiedWorkflow );

		expect( deidentifiedWorkflow.initial_step ).not.toHaveProperty( 'id' );
	} );
} );

describe( 'findStep', () => {
	const stepOne = getIdentifiedStepUtil( 'Step One', 1 );
	const stepTwo = getIdentifiedStepUtil( 'Step Two', 2 );
	const stepThree = getIdentifiedStepUtil( 'Step Three', 3 );
	stepOne.nextStep = stepTwo;
	stepTwo.nextStep = stepThree;
	const workflow = getWorkflow( 1, 'Workflow', {
		initial_step: stepOne,
	} ) as IdentifiedWorkflow;

	test( 'returns undefined if the step cannot be found', () => {
		const steps = findStep( workflow, -1 );

		expect( steps.previousStep ).toBeUndefined();
		expect( steps.step ).toBeUndefined();
		expect( steps.nextStep ).toBeUndefined();
	} );

	test( 'returns the correct values for a beginning step', () => {
		const steps = findStep( workflow, 1 );

		expect( steps.previousStep ).toBeUndefined();
		expect( steps.step ).toEqual( stepOne );
		expect( steps.nextStep ).toEqual( stepTwo );
	} );

	test( 'returns the correct values for a middle step', () => {
		const steps = findStep( workflow, 2 );

		expect( steps.previousStep ).toEqual( stepOne );
		expect( steps.step ).toEqual( stepTwo );
		expect( steps.nextStep ).toEqual( stepThree );
	} );

	test( 'returns the correct values for an end step', () => {
		const steps = findStep( workflow, 3 );

		expect( steps.previousStep ).toEqual( stepTwo );
		expect( steps.step ).toEqual( stepThree );
		expect( steps.nextStep ).toBeUndefined();
	} );
} );
