/**
 * Internal dependencies
 */
import type { DashboardSectionId } from './sections';
/**
 * External dependencies
 */
import type { WidgetModuleRecord, WidgetType } from '@wordpress/widget-primitives';

/**
 * A widget module record carrying the sections its type may be added from.
 *
 * `sections` is Premium Analytics' own field on the `/widget-modules` payload,
 * so it is absent from the upstream `WidgetModuleRecord` contract. Optional for
 * the same reason the section fields are: WPCOM's public-api serves this route
 * from its own checkout, so a Simple site can be served a payload built before
 * the field existed. Missing or `null` means every section.
 */
export interface SectionScopedWidgetModuleRecord extends WidgetModuleRecord {
	sections?: string[] | null;
}

/**
 * Whether a widget type's server-declared scope admits a section.
 *
 * @param sections  - The type's section scope, as served: section slugs.
 * @param sectionId - The active section's slug, which is what `useActiveSection`
 *                  resolves to — never the namespaced `analytics/…` id.
 * @return Whether the type may be added from that section.
 */
function isSectionInScope(
	sections: string[] | null | undefined,
	sectionId: DashboardSectionId
): boolean {
	return ! Array.isArray( sections ) || sections.includes( sectionId );
}

/**
 * The widget types a section's dashboard may hand to `WidgetDashboard`.
 *
 * One prop feeds both the grid and the widget gallery, so scoping is a union
 * rather than a plain filter: a type out of scope here is still returned while
 * the section's layout places it. Dropping it instead would render every
 * instance a reader had already placed — or that an older default seeded — as
 * "Missing widget".
 *
 * @param widgetTypes - The resolved widget types, from `useWidgetTypesWithI18n`.
 * @param records     - The complete `/widget-modules` record set, which carries the scope.
 *                    Deliberately wider than what `widgetTypes` was resolved from, so a
 *                    type resolved before its record was needed still finds its scope.
 * @param sectionId   - The active section's slug.
 * @param placedTypes - Type names the active section's layout places.
 * @return The widget types in scope for the section, in their original order.
 */
export function selectSectionWidgetTypes(
	widgetTypes: WidgetType[],
	records: SectionScopedWidgetModuleRecord[] | null | undefined,
	sectionId: DashboardSectionId,
	placedTypes: ReadonlySet< string >
): WidgetType[] {
	const scopes = new Map(
		( records ?? [] ).map( record => [ record.name, record.sections ] as const )
	);

	const scoped = widgetTypes.filter(
		widgetType =>
			placedTypes.has( widgetType.name ) ||
			isSectionInScope( scopes.get( widgetType.name ), sectionId )
	);

	// Most sections scope nothing away, and `WidgetDashboard` re-renders on a new
	// `widgetTypes` array — so hand back the one it already has.
	return scoped.length === widgetTypes.length ? widgetTypes : scoped;
}
