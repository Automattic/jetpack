/**
 * External dependencies
 */
import { useSearch } from '@wordpress/route';
import { buildReportLink, readReportOriginSearch } from '@jetpack-premium-analytics/routing';
/**
 * Internal dependencies
 */
import { resolveReportOrigin } from './reports/registry';

type BreadcrumbItem = { label: string; to?: string };

/**
 * Build the breadcrumbs a post or video detail page adds after the Stats root.
 *
 * `StatsBreadcrumbs` renders the root crumb and its dashboard link, so this
 * hook returns only the crumbs that follow it.
 *
 * @param title - The resolved detail-page title.
 * @return Breadcrumb data for the current detail page.
 */
export function useDetailBreadcrumbs( title?: string ): BreadcrumbItem[] {
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const origin = readReportOriginSearch( search );
	const { definition, section: originSection } = resolveReportOrigin( origin );
	const items: BreadcrumbItem[] = [];

	if ( definition ) {
		items.push( {
			label: definition.getLabel(),
			to: buildReportLink( definition.id, search, originSection ),
		} );
	}

	if ( title ) {
		items.push( { label: title } );
	}

	return items;
}
