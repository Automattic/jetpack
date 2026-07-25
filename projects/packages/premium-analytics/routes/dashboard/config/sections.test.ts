import { resolveSectionId, type DashboardSection } from './sections';

const SECTIONS: DashboardSection[] = [
	{ id: 'analytics/traffic', slug: 'traffic', label: 'Traffic', order: 10, default_layout: [] },
	{ id: 'analytics/insights', slug: 'insights', label: 'Insights', order: 20, default_layout: [] },
	{
		id: 'analytics/subscribers',
		slug: 'subscribers',
		label: 'Subscribers',
		order: 30,
		default_layout: [],
	},
];

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
