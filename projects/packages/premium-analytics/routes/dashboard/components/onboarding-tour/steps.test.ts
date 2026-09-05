import { onboardingTourSteps } from './steps';

describe( 'onboardingTourSteps', () => {
	it( 'walks the first widget, the date controls, Customize and the options menu', () => {
		const firstWidget = document.createElement( 'section' );
		const dateControls = document.createElement( 'div' );
		const customize = document.createElement( 'button' );
		const optionsMenu = document.createElement( 'button' );

		const steps = onboardingTourSteps( { firstWidget, dateControls, customize, optionsMenu } );

		expect( steps.map( step => step.anchor ) ).toEqual( [
			firstWidget,
			dateControls,
			customize,
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
			customize: null,
			optionsMenu: null,
		} );

		expect( steps.map( step => step.anchor ) ).toEqual( [ null, null, null, null ] );
	} );
} );
