/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Ordered list of the dashboard section IDs.
 *
 * This is the single source of truth for which sections exist and in what order.
 * Each section is surfaced as a tab and renders the customizable widget grid,
 * so the IDs are kept stable and URL-friendly (they are persisted in the
 * `?section=` search param).
 */
export const DASHBOARD_SECTION_IDS = [ 'traffic', 'insights', 'subscribers', 'store' ] as const;

/**
 * Dashboard section identifier.
 * Derived from DASHBOARD_SECTION_IDS to keep the union in sync with the source list.
 */
export type DashboardSectionId = ( typeof DASHBOARD_SECTION_IDS )[ number ];

/**
 * Default section shown when the URL has no (or an unknown) `section` param.
 */
export const DEFAULT_SECTION_ID: DashboardSectionId = 'traffic';

/**
 * A dashboard section definition.
 *
 * For now a section is just an ID and a display label. This is the natural place
 * to attach per-section metadata such as the default widget layout.
 */
export type DashboardSection = {
	id: DashboardSectionId;
	label: string;
};

/**
 * Get the translated display label for a section.
 *
 * @param id - The section identifier.
 * @return Translated label for the section.
 */
export function getSectionLabel( id: DashboardSectionId ): string {
	switch ( id ) {
		case 'traffic':
			return __( 'Traffic', 'jetpack-premium-analytics' );
		case 'insights':
			return __( 'Insights', 'jetpack-premium-analytics' );
		case 'subscribers':
			return __( 'Subscribers', 'jetpack-premium-analytics' );
		case 'store':
			return __( 'Store', 'jetpack-premium-analytics' );
		default: {
			const exhaustiveCheck: never = id;
			throw new Error( `Unknown section ID: ${ exhaustiveCheck }` );
		}
	}
}

/**
 * Build the ordered list of section definitions ({ id, label }).
 *
 * Labels are resolved lazily (at call time) so translations are applied after
 * the i18n locale data has loaded.
 *
 * @return Ordered list of section definitions.
 */
export function getDashboardSections(): DashboardSection[] {
	return DASHBOARD_SECTION_IDS.map( id => ( { id, label: getSectionLabel( id ) } ) );
}

/**
 * Narrow an arbitrary string to a known section ID, falling back to the default.
 *
 * @param value - The candidate section ID (e.g. from the URL).
 * @return A valid section ID.
 */
export function resolveSectionId( value: string | undefined ): DashboardSectionId {
	return value && ( DASHBOARD_SECTION_IDS as readonly string[] ).includes( value )
		? ( value as DashboardSectionId )
		: DEFAULT_SECTION_ID;
}
