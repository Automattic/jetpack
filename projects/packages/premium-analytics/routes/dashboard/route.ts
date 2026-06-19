/**
 * WordPress dependencies
 */
import { store as coreStore } from '@wordpress/core-data';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { DASHBOARD_REST_NAMESPACE } from './hooks/constants';

/*
 * Register the widget-modules discovery entity in the route lifecycle, before
 * the stage renders, so the stage's `getEntityRecords` read resolves and feeds
 * the records to `useWidgetTypes`. Premium Analytics serves the records from its
 * own namespace (see src/widget-modules.php), independent of core's `wp/v2`
 * endpoint. Guarded for idempotency: beforeLoad re-runs on every navigation and
 * preload.
 */
export const route = {
	beforeLoad() {
		const coreSelect = select( coreStore ) as unknown as {
			getEntityConfig: ( kind: string, name: string ) => unknown;
		};
		if ( coreSelect.getEntityConfig( 'root', 'widgetModule' ) ) {
			return;
		}

		const coreDispatch = dispatch( coreStore ) as unknown as {
			addEntities: ( entities: object[] ) => void;
		};

		coreDispatch.addEntities( [
			{
				name: 'widgetModule',
				kind: 'root',
				key: 'name',
				baseURL: `/${ DASHBOARD_REST_NAMESPACE }/widget-modules`,
				plural: 'widgetModules',
				label: __( 'Widget modules', 'jetpack-premium-analytics' ),
				supportsPagination: false,
			},
		] );
	},
};
