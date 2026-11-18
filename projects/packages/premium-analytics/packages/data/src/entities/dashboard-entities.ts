/**
 * External dependencies
 */
import { store as coreStore, useEntityRecords } from '@wordpress/core-data';
import { dispatch, select } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { DASHBOARD_NAME, DASHBOARD_REST_NAMESPACE } from '../api/constants';

// `per_page: -1`: core-data's default first page of 10 would silently drop any widget past the tenth.
export const WIDGET_MODULES_QUERY = { per_page: -1 };

// Every section, for the same reason.
export const DASHBOARD_SECTIONS_QUERY = { per_page: -1 };

type DashboardEntityConfig = { name: string } & Record< string, unknown >;

/**
 * The core-data entity that holds a dashboard's sections. The package's own dashboard keeps
 * the unqualified name; any other dashboard gets an entity of its own.
 *
 * @param dashboardName - Dashboard identifier.
 * @return The entity name and its plural.
 */
function dashboardSectionEntityNames( dashboardName: string ): { name: string; plural: string } {
	if ( dashboardName === DASHBOARD_NAME ) {
		return { name: 'dashboardSection', plural: 'dashboardSections' };
	}

	return {
		name: `dashboardSection:${ dashboardName }`,
		plural: `dashboardSections:${ dashboardName }`,
	};
}

/**
 * Build the core-data configuration of the entities a dashboard reads its metadata from.
 *
 * Built at call time (not module scope) so `__()` reads translations after
 * the locale data has loaded.
 *
 * @param dashboardName - Dashboard whose sections entity is configured.
 * @return The entity configurations for `addEntities`.
 */
function buildEntityConfigs( dashboardName: string ): DashboardEntityConfig[] {
	return [
		{
			name: 'widgetModule',
			kind: 'root',
			key: 'name',
			baseURL: `/${ DASHBOARD_REST_NAMESPACE }/widget-modules`,
			plural: 'widgetModules',
			label: __( 'Widget modules', 'jetpack-premium-analytics-pkg' ),
			supportsPagination: false,
		},
		{
			...dashboardSectionEntityNames( dashboardName ),
			kind: 'root',
			key: 'slug',
			baseURL: `/${ DASHBOARD_REST_NAMESPACE }/dashboards/${ dashboardName }/sections`,
			label: __( 'Dashboard sections', 'jetpack-premium-analytics-pkg' ),
			supportsPagination: false,
		},
	];
}

/**
 * Register the core-data entities of a dashboard, skipping any already registered.
 *
 * Always registers the complete set: registering a subset seeds the guard, so
 * a later caller skips the entities it left out. That is how `dashboardSection`
 * went missing once and the dashboard force-opened an empty edit-mode canvas.
 *
 * @param dashboardName - Dashboard identifier. Defaults to the package's own dashboard.
 */
export function ensureDashboardEntities( dashboardName: string = DASHBOARD_NAME ): void {
	const coreSelect = select( coreStore ) as unknown as {
		getEntityConfig: ( kind: string, name: string ) => unknown;
	};
	const missing = buildEntityConfigs( dashboardName ).filter(
		config => ! coreSelect.getEntityConfig( 'root', config.name )
	);
	if ( missing.length === 0 ) {
		return;
	}

	const coreDispatch = dispatch( coreStore ) as unknown as {
		addEntities: ( entities: object[] ) => void;
	};
	coreDispatch.addEntities( missing );
}

/**
 * The sections of a dashboard, as its sections route serves them.
 *
 * Reads the entity `ensureDashboardEntities()` registers for that dashboard, so call it first.
 *
 * @param dashboardName - Dashboard identifier. Defaults to the package's own dashboard.
 * @return The section records, `null` while they resolve, and whether the query has resolved.
 */
export function useDashboardSectionRecords< Section >( dashboardName: string = DASHBOARD_NAME ): {
	sections: Section[] | null;
	hasResolved: boolean;
} {
	const { records, hasResolved } = useEntityRecords< Section >(
		'root',
		dashboardSectionEntityNames( dashboardName ).name,
		DASHBOARD_SECTIONS_QUERY
	);

	return { sections: records, hasResolved };
}
