/**
 * External dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import type { WidgetModuleRecord } from '@wordpress/widget-primitives';

type CoreDataSelectors = {
	getEntityRecords: (
		kind: string,
		name: string,
		query?: Record< string, unknown >
	) => WidgetModuleRecord[] | null;
};

// `per_page: -1`: core-data's default first page of 10 would silently drop any widget past the tenth.
export const WIDGET_MODULES_QUERY = { per_page: -1 };

/**
 * The registered widget modules, or `null` while core-data resolves them.
 *
 * @return Every `widgetModule` record.
 */
export function useWidgetModules(): WidgetModuleRecord[] | null {
	return useSelect(
		select =>
			( select( coreStore ) as unknown as CoreDataSelectors ).getEntityRecords(
				'root',
				'widgetModule',
				WIDGET_MODULES_QUERY
			),
		[]
	);
}
