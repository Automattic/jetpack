import { onboardingTourSteps } from './steps';

describe( 'onboardingTourSteps', () => {
	it( 'walks the first widget, the date controls and the options menu twice', () => {
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

	it( 'keeps the steps whose anchors are not mounted yet', () => {
		const steps = onboardingTourSteps( {
			firstWidget: null,
			dateControls: null,
			optionsMenu: null,
		} );

		expect( steps.map( step => step.anchor ) ).toEqual( [ null, null, null, null ] );
	} );
} );
