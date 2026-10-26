/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { isDashboardSectionAvailable } from '@jetpack-premium-analytics/data';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * The date controls a page or a section declares: a presets list, false for none, null for the default.
 */
export type SingleReportControls = { presets: string[] } | false | null;

/**
 * An inner section of a single-report page, with its own layout.
 */
export type SingleReportPageSection = {
	/*
	 * The `?section=` value and the stored layout id.
	 */
	slug: string;

	/*
	 * The section's name in the page navigation.
	 */
	label: string;

	/*
	 * The section's composition, after the default-layout filter.
	 */
	default_layout: DashboardWidget[];

	/*
	 * The section's date controls; null inherits the page's.
	 */
	controls: SingleReportControls;
};

/**
 * A single-report page as the server publishes it in `premium_analytics.single_report_pages`.
 */
export type SingleReportPageRecord = {
	/*
	 * The namespaced id the owner registered, e.g. `analytics/video`.
	 */
	id: string;

	/*
	 * The `$kind` segment of `/report/$kind/$id`.
	 */
	path: string;

	/*
	 * The entity kind, translated: the crumb, the title fallback, the not-found copy.
	 */
	label: string;

	/*
	 * The dashboard section the page belongs to; the page is absent when the section is.
	 */
	dashboard_section: string | null;

	/*
	 * The Stats feature a plan may lock.
	 */
	feature: string | null;

	/*
	 * The report param that carries the entity id to the widgets.
	 */
	scope_param: string;

	/*
	 * The regex the `$id` segment must match.
	 */
	id_pattern: string;

	/*
	 * A registered icon name (`jpa/video`), the header's visual without media; null for the Stats icon.
	 */
	icon: string | null;

	/*
	 * The page's date controls; null for the detail presets.
	 */
	controls: SingleReportControls;

	/*
	 * The reports page of the same entities, for the not-found notice's back link.
	 */
	reports_page: string | null;

	/*
	 * Where the stage persists the arrangement.
	 */
	preferences_scope: string;

	/*
	 * The layout of a page with one section; empty when `sections` carry the layouts.
	 */
	default_layout: DashboardWidget[];

	/*
	 * The inner sections, each with its own layout; empty for a page with one layout.
	 */
	sections: SingleReportPageSection[];
};

/**
 * The registered page a URL segment names, or undefined when there is none the
 * reader may open. The server lists only the pages available to the reader;
 * the section check mirrors the reports route, for a payload from an older server.
 *
 * @param kind - The `$kind` segment of `/report/$kind/$id`.
 * @return The page record, or undefined.
 */
export function getSingleReportPage(
	kind: string | undefined
): SingleReportPageRecord | undefined {
	const pages = getScriptData()?.premium_analytics?.single_report_pages;
	if ( ! kind || ! Array.isArray( pages ) ) {
		return undefined;
	}

	// The script data type keeps the layout loose; the server serializes `DashboardWidget` instances.
	const page = pages.find( candidate => candidate.path === kind ) as unknown as
		SingleReportPageRecord | undefined;
	if ( ! page ) {
		return undefined;
	}

	if ( page.dashboard_section && ! isDashboardSectionAvailable( page.dashboard_section ) ) {
		return undefined;
	}

	return page;
}

/**
 * Whether an entity id is one the page accepts.
 *
 * @param page - The page.
 * @param id   - The `$id` segment.
 * @return Whether the id matches the page's pattern.
 */
export function isValidEntityId(
	page: SingleReportPageRecord,
	id: string | undefined
): id is string {
	if ( ! id ) {
		return false;
	}

	try {
		return new RegExp( page.id_pattern ).test( id );
	} catch {
		return /^[1-9]\d*$/.test( id );
	}
}

/**
 * The inner section a raw `?section=` value names, falling back to the first one, so a
 * shared URL never persists a section the page cannot render. Undefined for a page
 * with one layout.
 *
 * @param page  - The page.
 * @param value - The raw search value.
 * @return The section, or undefined.
 */
export function resolveSingleReportSection(
	page: SingleReportPageRecord,
	value: string | undefined
): SingleReportPageSection | undefined {
	const sections = page.sections ?? [];
	if ( ! sections.length ) {
		return undefined;
	}

	return sections.find( section => section.slug === value ) ?? sections[ 0 ];
}

/**
 * The layout the page renders: the active section's, or the page's own.
 *
 * @param page    - The page.
 * @param section - The active inner section, if any.
 * @return The default layout.
 */
export function getSingleReportLayout(
	page: SingleReportPageRecord,
	section: SingleReportPageSection | undefined
): DashboardWidget[] {
	return section ? section.default_layout : page.default_layout;
}

/**
 * The date controls the page renders: the active section's unless it inherits, else the page's.
 *
 * @param page    - The page.
 * @param section - The active inner section, if any.
 * @return A presets list, false for no controls, null for the detail presets.
 */
export function resolveSingleReportControls(
	page: SingleReportPageRecord,
	section: SingleReportPageSection | undefined
): SingleReportControls {
	return section && section.controls !== null ? section.controls : page.controls;
}
