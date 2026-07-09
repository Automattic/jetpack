import type { DashboardWidget } from '@wordpress/widget-dashboard';

export type DashboardSectionId = `${ string }/${ string }`;

/**
 * A dashboard section definition.
 */
export type DashboardSection = {
	id: DashboardSectionId;
	label: string;
	order: number;
	layout: DashboardWidget[];
	hasCustomLayout: boolean;
};

export const EMPTY_DASHBOARD_SECTIONS: DashboardSection[] = [];

const DASHBOARD_SECTION_ID_PATTERN = /^[a-z0-9-]+\/[a-z0-9-]+$/;

/**
 * Check whether a value matches the dashboard section ID grammar.
 *
 * @param value - Candidate section ID.
 * @return Whether the value is a dashboard section ID.
 */
export function isDashboardSectionId( value: unknown ): value is DashboardSectionId {
	return typeof value === 'string' && DASHBOARD_SECTION_ID_PATTERN.test( value );
}

/**
 * Check whether a value matches the REST dashboard section shape.
 *
 * @param value - Candidate section.
 * @return Whether the value can be used as a dashboard section.
 */
export function isDashboardSection( value: unknown ): value is DashboardSection {
	if ( ! value || typeof value !== 'object' || Array.isArray( value ) ) {
		return false;
	}

	const section = value as Record< string, unknown >;

	return (
		isDashboardSectionId( section.id ) &&
		typeof section.label === 'string' &&
		typeof section.order === 'number' &&
		Array.isArray( section.layout ) &&
		typeof section.hasCustomLayout === 'boolean'
	);
}

/**
 * Check whether a value is a list of REST dashboard sections.
 *
 * @param value - Candidate section list.
 * @return Whether the value can be used as dashboard sections.
 */
export function isDashboardSections( value: unknown ): value is DashboardSection[] {
	return Array.isArray( value ) && value.every( isDashboardSection );
}

/**
 * Sort dashboard sections in the same order as the server.
 *
 * @param sections - Sections returned by the REST API.
 * @return Ordered section list.
 */
export function sortDashboardSections( sections: DashboardSection[] ): DashboardSection[] {
	return [ ...sections ].sort( ( a, b ) => a.order - b.order || a.id.localeCompare( b.id ) );
}

/**
 * Get the default section from an ordered section list.
 *
 * @param sections - Sections returned by the REST API.
 * @return Default section ID, when sections are available.
 */
export function getDefaultSectionId(
	sections: DashboardSection[]
): DashboardSectionId | undefined {
	return sections[ 0 ]?.id;
}

/**
 * Resolve an arbitrary string against the available REST-provided sections.
 *
 * @param value    - The candidate section ID (e.g. from the URL).
 * @param sections - Sections returned by the REST API.
 * @return A valid section ID, or undefined while no sections are available.
 */
export function resolveSectionId(
	value: string | undefined,
	sections: DashboardSection[]
): DashboardSectionId | undefined {
	if ( isDashboardSectionId( value ) && sections.some( section => section.id === value ) ) {
		return value;
	}

	return getDefaultSectionId( sections );
}

/**
 * Replace a section in an existing section list with an updated REST response.
 *
 * @param sections       - Current section list.
 * @param updatedSection - Updated section response.
 * @return Section list with the updated section in server order.
 */
export function replaceDashboardSection(
	sections: DashboardSection[],
	updatedSection: DashboardSection
): DashboardSection[] {
	const hasSection = sections.some( section => section.id === updatedSection.id );
	const nextSections = hasSection
		? sections.map( section => ( section.id === updatedSection.id ? updatedSection : section ) )
		: [ ...sections, updatedSection ];

	return sortDashboardSections( nextSections );
}
