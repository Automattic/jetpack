/**
 * Internal dependencies
 */
import type { DashboardSectionLayouts } from './section-layouts';
import type { DashboardSection } from './sections';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * A one-off rewrite of the stored section layouts, run once per reader and
 * recorded by id so a widget the reader later removes is not put back.
 */
export type SectionLayoutMigration = {
	id: string;
	/**
	 * Rewrite the stored layouts, or return them as they are when nothing applies.
	 *
	 * @param layouts  - The stored section layouts.
	 * @param sections - The dashboard sections, carrying their defaults.
	 * @return The layouts to store.
	 */
	run: (
		layouts: DashboardSectionLayouts,
		sections: DashboardSection[]
	) => DashboardSectionLayouts;
};

const TAGS_TYPE = 'jpa/tags';

/**
 * The instance a default layout carries for a type, when it has one.
 *
 * @param sections - The dashboard sections.
 * @param slug     - The section to read.
 * @param type     - The widget type to find.
 * @return The default instance, or undefined.
 */
function defaultInstanceOf(
	sections: DashboardSection[],
	slug: string,
	type: string
): DashboardWidget | undefined {
	return sections
		.find( section => section.slug === slug )
		?.default_layout?.find( widget => widget.type === type );
}

/**
 * Top tags & categories moved from Insights to Traffic once `stats/tags` took a
 * date window. A reader who customized Insights keeps everything but that tile;
 * one who customized Traffic gains it at the end, as the default places it.
 */
const tagsToTraffic: SectionLayoutMigration = {
	id: 'tags-to-traffic',
	run( layouts, sections ) {
		let next = layouts;

		const insights = layouts.insights;
		if ( insights?.some( widget => widget.type === TAGS_TYPE ) ) {
			next = { ...next, insights: insights.filter( widget => widget.type !== TAGS_TYPE ) };
		}

		// The default instance, placement included: the default lists it last.
		const traffic = layouts.traffic;
		const instance = defaultInstanceOf( sections, 'traffic', TAGS_TYPE );
		if ( traffic && instance && ! traffic.some( widget => widget.type === TAGS_TYPE ) ) {
			next = { ...next, traffic: [ ...traffic, instance ] };
		}

		return next;
	},
};

export const SECTION_LAYOUT_MIGRATIONS: readonly SectionLayoutMigration[] = [ tagsToTraffic ];

/**
 * Run the migrations not yet applied, in order.
 *
 * @param layouts    - The stored section layouts.
 * @param applied    - Ids of the migrations already applied.
 * @param sections   - The dashboard sections, carrying their defaults.
 * @param migrations - The migrations to consider.
 * @return The layouts and applied ids to store, or null when every migration has run.
 */
export function migrateSectionLayouts(
	layouts: DashboardSectionLayouts,
	applied: readonly string[],
	sections: DashboardSection[],
	migrations: readonly SectionLayoutMigration[] = SECTION_LAYOUT_MIGRATIONS
): { layouts: DashboardSectionLayouts; applied: string[] } | null {
	const pending = migrations.filter( migration => ! applied.includes( migration.id ) );
	if ( ! pending.length ) {
		return null;
	}

	return {
		layouts: pending.reduce(
			( current, migration ) => migration.run( current, sections ),
			layouts
		),
		applied: [ ...applied, ...pending.map( migration => migration.id ) ],
	};
}
