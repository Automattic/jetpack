import { stringifySearchValue } from '../search/report-params/report-params';
import { DASHBOARD_PAGE_SLUG } from './match-dashboard-href';

/**
 * Build the portable href of a dashboard route, the form a widget action declares: the admin
 * page with the route and its query inside `p`. `matchDashboardHref()` reads it back, and a full
 * page load reads the query values as the router does.
 *
 * @param path   - The in-app route, e.g. `/reports/referrers`.
 * @param search - The route's search params.
 * @return The admin href.
 */
export function buildDashboardHref( path: string, search: Record< string, unknown > = {} ): string {
	const query = Object.entries( search )
		.filter( ( [ , value ] ) => value !== undefined && value !== null )
		.map(
			( [ key, value ] ) =>
				`${ encodeURIComponent( key ) }=${ encodeURIComponent( stringifySearchValue( value ) ) }`
		)
		.join( '&' );
	const route = query ? `${ path }?${ query }` : path;

	return `admin.php?page=${ DASHBOARD_PAGE_SLUG }&p=${ encodeURIComponent( route ) }`;
}
