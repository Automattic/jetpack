import { onboardingTourSteps } from './steps';

describe( 'onboardingTourSteps', () => {
	it( 'walks the actions, the date controls and the first widget in that order', () => {
		const actions = document.createElement( 'div' );
		const dateControls = document.createElement( 'div' );
		const firstWidget = document.createElement( 'section' );

		const steps = onboardingTourSteps( { actions, dateControls, firstWidget } );

		expect( steps.map( step => step.anchor ) ).toEqual( [ actions, dateControls, firstWidget ] );
		expect( steps.map( step => step.side ) ).toEqual( [ 'bottom', 'bottom', 'top' ] );
		expect( steps.map( step => step.title ) ).toEqual( [
			'Customize your experience',
			'Improved date selection',
			'Introducing widgets',
		] );
	} );

	it( 'keeps the steps whose anchors are not mounted yet', () => {
		const steps = onboardingTourSteps( { actions: null, dateControls: null, firstWidget: null } );

		expect( steps.map( step => step.anchor ) ).toEqual( [ null, null, null ] );
	} );
} );
