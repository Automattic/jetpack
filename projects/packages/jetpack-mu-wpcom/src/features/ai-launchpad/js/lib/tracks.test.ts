import {
	trackViewed,
	trackWizardCompleted,
	trackAiResponseReceived,
	trackTaskClicked,
	trackLaunched,
} from './tracks.ts';

describe( 'ai-launchpad tracks', () => {
	beforeEach( () => {
		window._tkq = [];
	} );

	const lastEvent = () => window._tkq[ window._tkq.length - 1 ];

	it( 'trackViewed records jetpack_ai_launchpad_viewed with launchpad_variant: ai', () => {
		trackViewed();
		expect( lastEvent() ).toEqual( [
			'recordEvent',
			'jetpack_ai_launchpad_viewed',
			{ launchpad_variant: 'ai' },
		] );
	} );

	it( 'trackWizardCompleted records jetpack_ai_launchpad_wizard_completed with launchpad_variant: ai', () => {
		trackWizardCompleted();
		expect( lastEvent() ).toEqual( [
			'recordEvent',
			'jetpack_ai_launchpad_wizard_completed',
			{ launchpad_variant: 'ai' },
		] );
	} );

	it( 'trackAiResponseReceived records the event with its props plus launchpad_variant: ai', () => {
		trackAiResponseReceived( { duration_ms: 1234, source: 'ai' } );
		expect( lastEvent() ).toEqual( [
			'recordEvent',
			'jetpack_ai_launchpad_ai_response_received',
			{ duration_ms: 1234, source: 'ai', launchpad_variant: 'ai' },
		] );
	} );

	it( 'trackTaskClicked records the task_id without leaking other props', () => {
		trackTaskClicked( { task_id: 'site_theme_selected' } );
		expect( lastEvent() ).toEqual( [
			'recordEvent',
			'jetpack_ai_launchpad_task_clicked',
			{ task_id: 'site_theme_selected', launchpad_variant: 'ai' },
		] );
	} );

	it( 'trackLaunched records jetpack_ai_launchpad_launched with launchpad_variant: ai', () => {
		trackLaunched();
		expect( lastEvent() ).toEqual( [
			'recordEvent',
			'jetpack_ai_launchpad_launched',
			{ launchpad_variant: 'ai' },
		] );
	} );

	it( 'initializes window._tkq when it is undefined', () => {
		delete ( window as unknown as { _tkq?: unknown } )._tkq;
		trackViewed();
		expect( Array.isArray( window._tkq ) ).toBe( true );
		expect( window._tkq ).toHaveLength( 1 );
	} );
} );
