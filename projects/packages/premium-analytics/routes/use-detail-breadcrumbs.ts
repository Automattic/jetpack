/**
 * External dependencies
 */
import { useSearch } from '@wordpress/route';
import { buildReportLink, readReportOriginSearch } from '@jetpack-premium-analytics/routing';
/**
 * Internal dependencies
 */
import { getReportDefinition, resolveReportOrigin } from './reports/registry';

type BreadcrumbItem = { label: string; to?: string };

/**
 * Build the breadcrumbs a post or video detail page adds after the Stats root.
 *
 * `StatsBreadcrumbs` renders the root crumb and its dashboard link, so this
 * hook returns only the crumbs that follow it.
 *
 * @param title            - The resolved detail-page title.
 * @param fallbackReportId - The reports page of the same entities, the crumb when the URL carries no origin.
 * @return Breadcrumb data for the current detail page.
 */
export function useDetailBreadcrumbs(
	title?: string,
	fallbackReportId?: string
): BreadcrumbItem[] {
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const origin = readReportOriginSearch( search );
	const { definition, section: originSection } = resolveReportOrigin( origin );
	const items: BreadcrumbItem[] = [];

	const crumb =
		definition ?? ( fallbackReportId ? getReportDefinition( fallbackReportId ) : undefined );
	if ( crumb ) {
		items.push( {
			label: crumb.getLabel(),
			to: buildReportLink( crumb.id, search, definition ? originSection : undefined ),
		} );
	}

	if ( title ) {
		items.push( { label: title } );
	}

	return items;
}
