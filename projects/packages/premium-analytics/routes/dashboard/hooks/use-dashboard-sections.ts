import apiFetch from '@wordpress/api-fetch';
import { useCallback, useEffect, useState } from 'react';
import {
	EMPTY_DASHBOARD_SECTIONS,
	isDashboardSection,
	isDashboardSections,
	replaceDashboardSection,
	sortDashboardSections,
} from '../config';
import { DASHBOARD_REST_NAMESPACE } from './constants';
import type { DashboardName } from './use-dashboard-layout';
import type { DashboardSection, DashboardSectionId } from '../config';
import type { DashboardWidget } from '@wordpress/widget-dashboard';

type UseDashboardSectionsReturn = {
	sections: DashboardSection[];
	isResolvingSections: boolean;
	updateSectionLayout: (
		sectionId: DashboardSectionId,
		layout: DashboardWidget[]
	) => Promise< void >;
	resetSectionLayout: ( sectionId: DashboardSectionId ) => Promise< void >;
};

const dashboardSectionsCache = new Map< DashboardName, DashboardSection[] >();
const dashboardSectionsRequests = new Map< DashboardName, Promise< DashboardSection[] > >();

/**
 * Build the REST path for a dashboard's sections.
 *
 * @param dashboardName - Dashboard registration name.
 * @return Sections REST path.
 */
export function getDashboardSectionsPath( dashboardName: DashboardName ): string {
	return `/${ DASHBOARD_REST_NAMESPACE }/dashboards/${ dashboardName }/sections`;
}

/**
 * Build the REST path for a dashboard section's custom layout.
 *
 * @param dashboardName - Dashboard registration name.
 * @param sectionId     - Dashboard section ID.
 * @return Section layout REST path.
 */
export function getDashboardSectionLayoutPath(
	dashboardName: DashboardName,
	sectionId: DashboardSectionId
): string {
	return `${ getDashboardSectionsPath( dashboardName ) }/${ sectionId }/layout`;
}

/**
 * Normalize a sections REST response into the hook's ordered section list.
 *
 * @param response - REST response to normalize.
 * @return Ordered dashboard sections, or an empty list for invalid data.
 */
function normalizeDashboardSections( response: unknown ): DashboardSection[] {
	return isDashboardSections( response )
		? sortDashboardSections( response )
		: EMPTY_DASHBOARD_SECTIONS;
}

/**
 * Read sections once per dashboard, sharing concurrent calls across consumers.
 *
 * @param dashboardName - Dashboard registration name.
 * @return Promise resolving to the dashboard's section list.
 */
function fetchDashboardSections( dashboardName: DashboardName ): Promise< DashboardSection[] > {
	if ( dashboardSectionsCache.has( dashboardName ) ) {
		return Promise.resolve(
			dashboardSectionsCache.get( dashboardName ) ?? EMPTY_DASHBOARD_SECTIONS
		);
	}

	const pendingRequest = dashboardSectionsRequests.get( dashboardName );
	if ( pendingRequest ) {
		return pendingRequest;
	}

	const request = apiFetch( { path: getDashboardSectionsPath( dashboardName ) } )
		.then( response => {
			const nextSections = normalizeDashboardSections( response );
			dashboardSectionsCache.set( dashboardName, nextSections );
			return nextSections;
		} )
		.catch( () => EMPTY_DASHBOARD_SECTIONS )
		.finally( () => {
			dashboardSectionsRequests.delete( dashboardName );
		} );

	dashboardSectionsRequests.set( dashboardName, request );

	return request;
}

/**
 * Get REST-provided dashboard sections and section layout actions.
 *
 * @param dashboardName - Dashboard registration name.
 * @return Sections state and layout mutation helpers.
 */
export function useDashboardSections( dashboardName: DashboardName ): UseDashboardSectionsReturn {
	const [ sections, setSections ] = useState< DashboardSection[] >(
		() => dashboardSectionsCache.get( dashboardName ) ?? EMPTY_DASHBOARD_SECTIONS
	);
	const [ isResolvingSections, setIsResolvingSections ] = useState(
		() => ! dashboardSectionsCache.has( dashboardName )
	);

	useEffect( () => {
		let isMounted = true;

		if ( dashboardSectionsCache.has( dashboardName ) ) {
			setSections( dashboardSectionsCache.get( dashboardName ) ?? EMPTY_DASHBOARD_SECTIONS );
			setIsResolvingSections( false );
			return () => {
				isMounted = false;
			};
		}

		setIsResolvingSections( true );
		void fetchDashboardSections( dashboardName )
			.then( nextSections => {
				if ( isMounted ) {
					setSections( nextSections );
				}
			} )
			.finally( () => {
				if ( isMounted ) {
					setIsResolvingSections( false );
				}
			} );

		return () => {
			isMounted = false;
		};
	}, [ dashboardName ] );

	const updateSectionFromResponse = useCallback(
		( response: unknown ) => {
			if ( isDashboardSection( response ) ) {
				setSections( currentSections => {
					const nextSections = replaceDashboardSection( currentSections, response );
					dashboardSectionsCache.set( dashboardName, nextSections );
					return nextSections;
				} );
			}
		},
		[ dashboardName ]
	);

	const updateSectionLayout = useCallback(
		async ( sectionId: DashboardSectionId, layout: DashboardWidget[] ) => {
			const response = await apiFetch( {
				path: getDashboardSectionLayoutPath( dashboardName, sectionId ),
				method: 'PUT',
				data: { layout },
			} );

			updateSectionFromResponse( response );
		},
		[ dashboardName, updateSectionFromResponse ]
	);

	const resetSectionLayout = useCallback(
		async ( sectionId: DashboardSectionId ) => {
			const response = await apiFetch( {
				path: getDashboardSectionLayoutPath( dashboardName, sectionId ),
				method: 'DELETE',
			} );

			updateSectionFromResponse( response );
		},
		[ dashboardName, updateSectionFromResponse ]
	);

	return {
		sections,
		isResolvingSections,
		updateSectionLayout,
		resetSectionLayout,
	};
}
