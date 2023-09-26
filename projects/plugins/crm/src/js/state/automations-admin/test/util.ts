import { findStep } from '../util';
import { getStep, getWorkflow } from './util/data';
describe( 'findStep', () => {
	const stepOne = getStep( 'step_one', 'Step One' );
	const stepTwo = getStep( 'step_two', 'Step Two' );
	const stepThree = getStep( 'step_three', 'Step Three' );
	stepOne.next_step = stepTwo.id;
	stepTwo.next_step = stepThree.id;
	const workflow = getWorkflow( 1, 'Workflow', {
		initial_step: stepOne.id,
		steps: {
			[ stepOne.id ]: stepOne,
			[ stepTwo.id ]: stepTwo,
			[ stepThree.id ]: stepThree,
		},
	} );

	test( 'returns undefined if the step cannot be found', () => {
		const steps = findStep( workflow, 'step_null' );

		expect( steps.previousStep ).toBeUndefined();
		expect( steps.step ).toBeUndefined();
		expect( steps.nextStep ).toBeUndefined();
	} );

	test( 'returns the correct values for a beginning step', () => {
		const steps = findStep( workflow, stepOne.id );

		expect( steps.previousStep ).toBeUndefined();
		expect( steps.step ).toEqual( stepOne );
		expect( steps.nextStep ).toEqual( stepTwo );
	} );

	test( 'returns the correct values for a middle step', () => {
		const steps = findStep( workflow, stepTwo.id );

		expect( steps.previousStep ).toEqual( stepOne );
		expect( steps.step ).toEqual( stepTwo );
		expect( steps.nextStep ).toEqual( stepThree );
	} );

	test( 'returns the correct values for an end step', () => {
		const steps = findStep( workflow, stepThree.id );

		expect( steps.previousStep ).toEqual( stepTwo );
		expect( steps.step ).toEqual( stepThree );
		expect( steps.nextStep ).toBeUndefined();
	} );
} );
