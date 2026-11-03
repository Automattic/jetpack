import { onboardingTourSteps } from './steps';

describe( 'onboardingTourSteps', () => {
	it( 'walks the first widget, the date controls, then the options menu twice', () => {
		const firstWidget = document.createElement( 'section' );
		const dateControls = document.createElement( 'div' );
		const optionsMenu = document.createElement( 'button' );

		const steps = onboardingTourSteps( {
			firstWidget,
			dateControls,
			optionsMenu,
			sectionTabs: null,
		} );

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
			{ firstWidget: null, dateControls: null, optionsMenu, sectionTabs: null },
			{ withFeedback: false }
		);

		expect( steps.map( step => step.title ) ).not.toContain( 'One last thing' );
		expect( steps ).toHaveLength( 3 );
	} );

	it( 'leaves out the arranging steps where the section cannot be customized', () => {
		const steps = onboardingTourSteps(
			{ firstWidget: null, dateControls: null, optionsMenu: null, sectionTabs: null },
			{ withFeedback: true, withCustomize: false }
		);

		expect( steps.map( step => step.title ) ).toEqual( [
			'A better date picker',
			'One last thing',
		] );
	} );

	it.each( [
		{ withComparison: true, description: 'Pick any period and compare it with the one before it.' },
		{ withComparison: false, description: 'See how your site did on any day of the last 7 days.' },
	] )(
		'describes the date step with withComparison $withComparison',
		( { withComparison, description } ) => {
			const steps = onboardingTourSteps(
				{ firstWidget: null, dateControls: null, optionsMenu: null, sectionTabs: null },
				{ withFeedback: false, withComparison }
			);

			expect( steps.find( step => step.title === 'A better date picker' )?.description ).toBe(
				description
			);
		}
	);

	it( 'keeps the steps whose anchors are not mounted yet', () => {
		const steps = onboardingTourSteps( {
			firstWidget: null,
			dateControls: null,
			optionsMenu: null,
			sectionTabs: null,
		} );

		expect( steps.map( step => step.anchor ) ).toEqual( [ null, null, null, null ] );
	} );

	it.each( [
		{ flow: 'store' as const, titles: [ 'Switch between boards' ] },
		{
			flow: 'stats-and-store' as const,
			titles: [
				'Everything is a widget',
				'Switch between boards',
				'A better date picker',
				'Rearrange it your way',
				'One last thing',
			],
		},
	] )( 'adds the tab bar step to the $flow journey', ( { flow, titles } ) => {
		const sectionTabs = document.createElement( 'div' );

		const steps = onboardingTourSteps(
			{ firstWidget: null, dateControls: null, optionsMenu: null, sectionTabs },
			{ withFeedback: true, flow }
		);

		expect( steps.map( step => step.title ) ).toEqual( titles );
		expect( steps.find( step => step.title === 'Switch between boards' )?.anchor ).toBe(
			sectionTabs
		);
	} );
} );
