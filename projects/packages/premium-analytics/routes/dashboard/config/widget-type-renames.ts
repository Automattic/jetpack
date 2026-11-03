/**
 * External dependencies
 */
import type { DashboardWidget } from '@wordpress/widget-dashboard';

/**
 * A namespaced widget type name, as the dashboard types it.
 */
export type WidgetTypeName = DashboardWidget[ 'type' ];

/**
 * The fields of a widget module record a rename reads.
 */
export type WidgetTypeRenameRecord = {
	name: string;
	former_names?: string[] | null;
};

export const NO_WIDGET_TYPE_RENAMES: ReadonlyMap< string, WidgetTypeName > = new Map();

/**
 * Map each former widget type name to the current one, from the widget module records.
 *
 * @param records - The widget module records, or nothing while they resolve.
 * @return Former name to current name.
 */
export function buildWidgetTypeRenames(
	records: readonly WidgetTypeRenameRecord[] | null | undefined
): ReadonlyMap< string, WidgetTypeName > {
	if ( ! records?.length ) {
		return NO_WIDGET_TYPE_RENAMES;
	}

	const renames = new Map< string, WidgetTypeName >();
	for ( const record of records ) {
		// A record whose former names are not a list, whatever the server sent, renames nothing.
		if ( ! Array.isArray( record.former_names ) ) {
			continue;
		}
		for ( const formerName of record.former_names ) {
			renames.set( formerName, record.name as WidgetTypeName );
		}
	}

	return renames.size ? renames : NO_WIDGET_TYPE_RENAMES;
}

/**
 * Rename the layout items saved under a former widget type name.
 *
 * Hands back the same array when nothing changes, so a layout keeps its identity.
 *
 * @param layout  - Widget instances, stored or default.
 * @param renames - Former name to current name.
 * @return The layout with current type names.
 */
export function resolveLayoutTypes(
	layout: DashboardWidget[],
	renames: ReadonlyMap< string, WidgetTypeName >
): DashboardWidget[] {
	if ( ! renames.size || ! layout.some( item => renames.has( item.type ) ) ) {
		return layout;
	}

	return layout.map( item =>
		renames.has( item.type ) ? { ...item, type: renames.get( item.type ) as WidgetTypeName } : item
	);
}
