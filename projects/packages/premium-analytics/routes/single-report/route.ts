/**
 * External dependencies
 */
import {
	getSectionDatePolicy,
	isStatsFeatureLocked,
	type StatsFeatureKey,
} from '@jetpack-premium-analytics/data';
import {
	pickDashboardOriginParams,
	pickReportNavigationParams,
	pickReportOriginParams,
} from '@jetpack-premium-analytics/routing';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { dateWindowRedirect } from '../date-window-redirect';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { seedDetailDateParams } from './detail-date-seed';
import { getSingleReportPage, isValidEntityId, resolveSingleReportSection } from './registry';

type SingleReportParams = {
	/*
	 * The page's `path`.
	 */
	kind?: string;

	/*
	 * The entity id, validated against the page's `id_pattern`.
	 */
	id?: string;
};

type SingleReportSearch = Record< string, string | undefined >;

/**
 * `/report/$kind/$id`: one route for every registered single-report page.
 *
 * The guard resolves `$kind` against the pages the server published, applies the
 * page's plan lock and id rule, then seeds the report window and the entity scope and
 * holds the window to the plan, by the policy of the page's dashboard section.
 */
export const route = {
	beforeLoad: async ( {
		params,
		search,
	}: { params?: SingleReportParams; search?: SingleReportSearch } = {} ) => {
		if ( ! isPremiumAnalyticsSiteConnected() ) {
			throw redirect( { to: '/connect' } );
		}

		const page = getSingleReportPage( params?.kind );
		if ( ! page ) {
			throw redirect( { to: '/' } );
		}

		if ( page.feature && isStatsFeatureLocked( page.feature as StatsFeatureKey ) ) {
			// The locked reports page offers the upgrade; a page without one goes home.
			throw redirect(
				page.reports_page
					? {
							to: '/reports/$report',
							params: { report: page.reports_page } as unknown as never,
							search: pickReportNavigationParams( search ) as unknown as never,
						}
					: { to: '/' }
			);
		}

		const id = params?.id;
		if ( ! isValidEntityId( page, id ) ) {
			throw redirect( { to: '/' } );
		}

		const currentSearch = ( search ?? {} ) as SingleReportSearch;
		const needsScopeSeed = currentSearch[ page.scope_param ] !== id;

		// A page with inner sections keeps a section the URL names only when it exists.
		const section = resolveSingleReportSection( page, currentSearch.section );
		const needsSectionSeed = !! currentSearch.section && section?.slug !== currentSearch.section;

		const limited = await dateWindowRedirect(
			currentSearch,
			getSectionDatePolicy( page.dashboard_section ?? undefined ),
			{
				seed: () => {
					const reportParams = seedDetailDateParams( currentSearch, id, page.scope_param );
					delete reportParams.post_id;
					delete reportParams.author_id;

					return {
						...reportParams,
						...pickReportOriginParams( currentSearch ),
						...pickDashboardOriginParams( currentSearch ),
						...( section ? { section: section.slug } : {} ),
						[ page.scope_param ]: id,
					};
				},
				needsSeed: needsScopeSeed || needsSectionSeed,
				// An arrival seeds all time, not a window the reader asked for, so it gets no notice.
				requested: needsScopeSeed ? undefined : currentSearch,
			}
		);
		if ( limited ) {
			throw redirect( {
				to: '/report/$kind/$id',
				// The router is built dynamically, so the route has no statically typed params or search.
				params: { kind: page.path, id } as unknown as never,
				replace: true,
				viewTransition: false,
				search: limited.search as unknown as never,
				state: limited.state,
			} );
		}
	},
};
