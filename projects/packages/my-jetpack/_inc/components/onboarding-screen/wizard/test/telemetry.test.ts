import { WIZARD_EVENTS, lengthBucket, stepSlug } from '../telemetry';
import type { WizardStep } from '../lib';

/*
 * Tracks' own name rule, copied from Jetpack_Tracks_Event::EVENT_NAME_REGEX in
 * packages/connection. An event that misses it is dropped server side and says
 * nothing about it, so the names are checked here rather than in production.
 */
const EVENT_NAME = /^(([a-z0-9]+)_){2}([a-z0-9_]+)$/;

// The same rule for property keys. One camelCase key costs the whole event.
const PROPERTY_KEY = /^[a-z_][a-z0-9_]*$/;

describe( 'Wizard event names', () => {
	it.each( Object.entries( WIZARD_EVENTS ) )( '%s is a name Tracks will take', ( _key, name ) => {
		expect( name ).toMatch( EVENT_NAME );
	} );

	it( 'has no two events sharing a name', () => {
		const names = Object.values( WIZARD_EVENTS );

		expect( new Set( names ).size ).toBe( names.length );
	} );

	// Every property this wizard sends, listed here so the rule is checked once
	// rather than trusted at each call site.
	it( 'sends only property keys Tracks will take', () => {
		const keys = [
			'flow_id',
			'step',
			'site_type',
			'filled',
			'length_bucket',
			'module',
			'enabled',
			'offered',
			'switched_on',
			'failed',
			'error_code',
		];

		keys.forEach( key => expect( key ).toMatch( PROPERTY_KEY ) );
	} );
} );

describe( 'The free-text bucket', () => {
	/*
	 * The one property that touches something a person wrote. If this ever
	 * returns the text, the wizard starts sending whatever someone typed about
	 * their own site to Tracks.
	 */
	it( 'never returns anything from the text', () => {
		const typed = 'A wiki for the Smith family, kept at smith-family.example since 2019';

		expect( lengthBucket( typed ) ).toBe( 'long' );
		expect( lengthBucket( typed ) ).not.toContain( 'Smith' );
		expect( lengthBucket( typed ) ).not.toContain( 'example' );
	} );

	it( 'buckets by length and nothing else', () => {
		expect( lengthBucket( '' ) ).toBe( 'empty' );
		expect( lengthBucket( '   ' ) ).toBe( 'empty' );
		expect( lengthBucket( 'A wiki' ) ).toBe( 'short' );
		expect( lengthBucket( 'a'.repeat( 20 ) ) ).toBe( 'short' );
		expect( lengthBucket( 'a'.repeat( 21 ) ) ).toBe( 'medium' );
		expect( lengthBucket( 'a'.repeat( 60 ) ) ).toBe( 'medium' );
		expect( lengthBucket( 'a'.repeat( 61 ) ) ).toBe( 'long' );
	} );

	// Two people who wrote different things of the same length are the same row.
	it( 'says the same thing about different text of the same length', () => {
		expect( lengthBucket( 'my band site' ) ).toBe( lengthBucket( 'jane@mail.com' ) );
	} );
} );

describe( 'The step property', () => {
	const steps = [ { id: 'start' }, { id: 'site-type' }, { id: 'features' }, { id: 'done' } ];

	/*
	 * Slugs, not indexes. A connected site opens on the second step, so an index
	 * is not the same number for everyone looking at the same screen.
	 */
	it( 'is the step’s own slug', () => {
		expect( stepSlug( steps, 0 as WizardStep ) ).toBe( 'start' );
		expect( stepSlug( steps, 2 as WizardStep ) ).toBe( 'features' );
	} );

	it( 'says unknown rather than throwing on a step that is not there', () => {
		expect( stepSlug( steps, 9 as WizardStep ) ).toBe( 'unknown' );
	} );
} );
