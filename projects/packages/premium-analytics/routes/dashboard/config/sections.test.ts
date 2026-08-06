import { resolveSectionHeading, resolveSectionId, type DashboardSection } from './sections';

const SECTIONS: DashboardSection[] = [
	{
		id: 'analytics/traffic',
		slug: 'traffic',
		label: 'Traffic',
		title: 'Site traffic',
		description: 'Views, visitors, and where they came from.',
		order: 10,
		date_filter: 'range',
		default_layout: [],
	},
	{
		id: 'analytics/insights',
		slug: 'insights',
		label: 'Insights',
		title: 'Activity insights',
		description: 'Longer-term patterns in your content and audience.',
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
		description: 'How your subscriber list is growing, and how your emails land.',
		order: 30,
		default_layout: [],
	},
];

// Registers no copy of its own, the way Store does.
const STORE: DashboardSection = {
	id: 'woocommerce/store',
	slug: 'store',
	label: 'Store',
	title: null,
	description: null,
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
} );
