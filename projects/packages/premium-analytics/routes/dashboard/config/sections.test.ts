import {
	isSectionAwaitingSync,
	resolveSectionHeading,
	resolveSectionId,
	type DashboardSection,
} from './sections';

const SECTIONS: DashboardSection[] = [
	{
		id: 'analytics/traffic',
		slug: 'traffic',
		label: 'Traffic',
		title: 'Site traffic',
		order: 10,
		date_filter: 'range',
		default_layout: [],
	},
	{
		id: 'analytics/insights',
		slug: 'insights',
		label: 'Insights',
		title: 'Activity insights',
		order: 20,
		date_filter: 'year',
		default_layout: [],
	},
	// Registered without a date filter, the way a payload from a build that
	// predates the field arrives.
	{
		id: 'analytics/subscribers',
		slug: 'subscribers',
		label: 'Subscribers',
		title: 'Subscribers stats',
		order: 30,
		default_layout: [],
	},
];

// Registers no heading of its own, the way Store does.
const STORE: DashboardSection = {
	id: 'woocommerce/store',
	slug: 'store',
	label: 'Store',
	title: null,
	order: 40,
	date_filter: 'range',
	default_layout: [],
};

// A payload from a build predating the copy fields: the keys are absent, not null.
const LEGACY: DashboardSection = {
	id: 'analytics/traffic',
	slug: 'traffic',
	label: 'Traffic',
	order: 10,
	default_layout: [],
};

describe( 'resolveSectionId', () => {
	it( 'keeps a slug matching an available section', () => {
		expect( resolveSectionId( 'insights', SECTIONS ) ).toBe( 'insights' );
	} );

	it( 'falls back to the first section by order for stale or unavailable slugs', () => {
		expect( resolveSectionId( 'store', SECTIONS ) ).toBe( 'traffic' );
		expect( resolveSectionId( 'missing', SECTIONS ) ).toBe( 'traffic' );
	} );

	it( 'falls back to the first section when no value is given', () => {
		expect( resolveSectionId( undefined, SECTIONS ) ).toBe( 'traffic' );
	} );

	it( 'returns an empty slug when no sections are available yet', () => {
		expect( resolveSectionId( 'traffic', [] ) ).toBe( '' );
	} );
} );

describe( 'resolveSectionHeading', () => {
	it( 'prefers the registered heading over the tab label', () => {
		expect( resolveSectionHeading( SECTIONS[ 0 ] ) ).toBe( 'Site traffic' );
	} );

	it( 'falls back to the label when the heading is null', () => {
		expect( resolveSectionHeading( STORE ) ).toBe( 'Store' );
	} );

	it( 'falls back to the label when the field is absent', () => {
		expect( resolveSectionHeading( LEGACY ) ).toBe( 'Traffic' );
	} );

	it( 'falls back to the label when the heading is an empty string', () => {
		// The registry normalises `''` to null before this; this pins the client's
		// own guard against an accessible-name-less `<h2>`.
		expect( resolveSectionHeading( { ...STORE, title: '' } ) ).toBe( 'Store' );
	} );
} );

describe( 'isSectionAwaitingSync', () => {
	const STORE_AWAITING: DashboardSection = { ...STORE, requires_sync: true };

	it( 'waits when the section requires the sync and it has not finished', () => {
		expect( isSectionAwaitingSync( STORE_AWAITING, false ) ).toBe( true );
	} );

	it( 'does not wait once the sync has finished', () => {
		expect( isSectionAwaitingSync( STORE_AWAITING, true ) ).toBe( false );
	} );

	it( 'does not wait for a section whose data needs no sync', () => {
		expect( isSectionAwaitingSync( SECTIONS[ 0 ], false ) ).toBe( false );
	} );

	// A payload served by a build predating the field must render, not wait forever.
	it( 'does not wait when the field is absent', () => {
		expect( isSectionAwaitingSync( LEGACY, false ) ).toBe( false );
	} );
} );
