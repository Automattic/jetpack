/**
 * External dependencies
 */
import { WIDGET_MODULES_QUERY } from '@jetpack-premium-analytics/data';
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
