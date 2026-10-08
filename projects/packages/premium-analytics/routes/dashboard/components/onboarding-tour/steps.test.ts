import { onboardingTourSteps } from './steps';

describe( 'onboardingTourSteps', () => {
	it( 'walks the first widget, the date controls, then the options menu twice', () => {
		const firstWidget = document.createElement( 'section' );
		const dateControls = document.createElement( 'div' );
		const optionsMenu = document.createElement( 'button' );

		const steps = onboardingTourSteps( { firstWidget, dateControls, optionsMenu } );

		expect( steps.map( step => step.anchor ) ).toEqual( [
			firstWidget,
			dateControls,
			optionsMenu,
			optionsMenu,
		] );
		expect( steps.map( step => step.side ) ).toEqual( [ 'top', 'bottom', 'bottom', 'bottom' ] );
		expect( steps.map( step => step.title ) ).toEqual( [
			'Everything is a widget',
			'A better date picker',
			'Rearrange it your way',
			'One last thing',
		] );
	} );

	it( 'leaves out the feedback step for a reader who cannot send feedback', () => {
		const optionsMenu = document.createElement( 'button' );

		const steps = onboardingTourSteps(
			{ firstWidget: null, dateControls: null, optionsMenu },
			{ withFeedback: false }
		);

		expect( steps.map( step => step.title ) ).not.toContain( 'One last thing' );
		expect( steps ).toHaveLength( 3 );
	} );

	it( 'keeps the steps whose anchors are not mounted yet', () => {
		const steps = onboardingTourSteps( {
			firstWidget: null,
			dateControls: null,
			optionsMenu: null,
		} );

		expect( steps.map( step => step.anchor ) ).toEqual( [ null, null, null, null ] );
	} );
} );
