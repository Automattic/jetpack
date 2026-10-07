/**
 * Internal dependencies
 */
import { migrateSectionLayouts, type SectionLayoutMigration } from './section-layout-migrations';
import type { DashboardSection } from './sections';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

const tags: DashboardWidget = {
	uuid: 'default-tags-widget-instance',
	type: 'jpa/tags',
	placement: { width: 2, height: 2, order: 12 },
};
const widget = ( uuid: string ): DashboardWidget => ( { uuid, type: `jpa/${ uuid }` } );
const section = ( slug: string, defaultLayout: DashboardWidget[] ): DashboardSection => ( {
	id: `analytics/${ slug }`,
	slug,
	label: slug,
	order: 0,
	default_layout: defaultLayout,
} );
const sections = [
	section( 'traffic', [ widget( 'clicks' ), tags ] ),
	section( 'insights', [ widget( 'all-time-stats' ) ] ),
];

describe( 'migrateSectionLayouts', () => {
	it( 'returns null once every migration is recorded as applied', () => {
		expect( migrateSectionLayouts( {}, [ 'tags-to-traffic' ], sections ) ).toBeNull();
	} );

	it( 'runs only the pending migrations, in order, and records them', () => {
		const first: SectionLayoutMigration = { id: 'first', run: layouts => layouts };
		const second: SectionLayoutMigration = {
			id: 'second',
			run: layouts => ( { ...layouts, traffic: [ widget( 'second' ) ] } ),
		};

		expect( migrateSectionLayouts( {}, [ 'first' ], sections, [ first, second ] ) ).toEqual( {
			layouts: { traffic: [ widget( 'second' ) ] },
			applied: [ 'first', 'second' ],
		} );
	} );

	describe( 'tags-to-traffic', () => {
		it( 'takes Tags off a customized Insights and appends the default instance to a customized Traffic', () => {
			const result = migrateSectionLayouts(
				{
					insights: [ widget( 'all-time-stats' ), tags, widget( 'shares' ) ],
					traffic: [ widget( 'referrers' ) ],
				},
				[],
				sections
			);

			expect( result?.layouts ).toEqual( {
				insights: [ widget( 'all-time-stats' ), widget( 'shares' ) ],
				traffic: [ widget( 'referrers' ), tags ],
			} );
			expect( result?.applied ).toEqual( [ 'tags-to-traffic' ] );
		} );

		it( 'leaves a Traffic layout that already has Tags, and an uncustomized tab, alone', () => {
			const layouts = { traffic: [ tags, widget( 'referrers' ) ] };

			expect( migrateSectionLayouts( layouts, [], sections )?.layouts ).toBe( layouts );
		} );

		it( 'records the migration for a reader with nothing stored, without inventing layouts', () => {
			expect( migrateSectionLayouts( {}, [], sections ) ).toEqual( {
				layouts: {},
				applied: [ 'tags-to-traffic' ],
			} );
		} );
	} );
} );
