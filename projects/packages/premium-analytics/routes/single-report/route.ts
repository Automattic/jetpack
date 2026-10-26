/**
 * External dependencies
 */
import {
	ensureCoreSettingsReady,
	isStatsFeatureLocked,
	needsReportDateParamsSeed,
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
import { seedDetailDateParams } from '../detail-date-seed';
import { isPremiumAnalyticsSiteConnected } from '../site-readiness';
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
 * page's plan lock and id rule, then seeds the report window and the entity scope
 * the way the former per-entity routes did.
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

		if (
			page.feature &&
			page.reports_page &&
			isStatsFeatureLocked( page.feature as StatsFeatureKey )
		) {
			throw redirect( {
				to: '/reports/$report',
				params: { report: page.reports_page } as unknown as never,
				search: pickReportNavigationParams( search ) as unknown as never,
			} );
		}

		const id = params?.id;
		if ( ! isValidEntityId( page, id ) ) {
			throw redirect( { to: '/' } );
		}

		const currentSearch = ( search ?? {} ) as SingleReportSearch;
		const needsDateSeed = needsReportDateParamsSeed( currentSearch );
		const needsScopeSeed = currentSearch[ page.scope_param ] !== id;

		// A page with inner sections keeps a section the URL names only when it exists.
		const section = resolveSingleReportSection( page, currentSearch.section );
		const needsSectionSeed = !! currentSearch.section && section?.slug !== currentSearch.section;

		if ( needsDateSeed || needsScopeSeed || needsSectionSeed ) {
			try {
				await ensureCoreSettingsReady();
			} catch {
				// The seed falls back to the browser zone; the page still opens.
			}

			const reportParams = seedDetailDateParams( currentSearch, id, page.scope_param );
			delete reportParams.post_id;
			delete reportParams.author_id;

			const seeded: Record< string, unknown > = {
				...reportParams,
				...pickReportOriginParams( currentSearch ),
				...pickDashboardOriginParams( currentSearch ),
				...( section ? { section: section.slug } : {} ),
				[ page.scope_param ]: id,
			};

			throw redirect( {
				to: '/report/$kind/$id',
				// The router is built dynamically, so the route has no statically typed params or search.
				params: { kind: page.path, id } as unknown as never,
				replace: true,
				search: seeded as unknown as never,
			} );
		}
	},
};
