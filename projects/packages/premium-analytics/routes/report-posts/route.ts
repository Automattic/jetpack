/**
 * External dependencies
 */
import { getScriptData } from '@automattic/jetpack-script-data';
import { ensureCoreSettingsReady, normalizeReportParams } from '@jetpack-premium-analytics/data';
import { redirect } from '@wordpress/route';
/**
 * Internal dependencies
 */
import { resolveTabId } from './config';

type ReportPostsSearch = Record< string, string | undefined >;

/**
 * Route lifecycle for the Posts & Pages report page.
 *
 * Guards mirror the dashboard (not connected → /connect, sync pending →
 * /syncing). On first visit it seeds the URL search through
 * `normalizeReportParams` — the same resolver the dashboard and the data hooks
 * use — so the date picker, the performance chart, and the records table share
 * one populated report window. The seed allowlists the report params rather
 * than spreading the incoming search wholesale, so foreign params carried in
 * by a link don't persist.
 */
export const route = {
	beforeLoad: async ( { search }: { search?: ReportPostsSearch } = {} ) => {
		const connectionStatus = getScriptData()?.connection?.connectionStatus;

		if ( ! connectionStatus?.isRegistered ) {
			throw redirect( { to: '/connect' } );
		}

		const syncFinished = getScriptData()?.premium_analytics?.initial_full_sync_finished ?? 0;
		if ( ! syncFinished ) {
			throw redirect( { to: '/syncing' } );
		}

		const params = ( search ?? {} ) as ReportPostsSearch;
		// A `section` carried in from a link may not be a valid tab; resolve it so
		// a shareable URL never persists a bogus tab.
		const resolvedSection = params.section ? resolveTabId( params.section ) : undefined;
		const needsDateSeed = ! params.from || ! params.to || ! params.interval;
		const needsSectionSeed = !! params.section && resolvedSection !== params.section;

		if ( ! needsDateSeed && ! needsSectionSeed ) {
			return;
		}

		/*
		 * Seed dates in the site timezone, not the browser's, by waiting for core
		 * `site` settings. A rejection here (network/auth) shouldn't error the
		 * whole page, so fall back to the default seed.
		 */
		try {
			await ensureCoreSettingsReady();
		} catch {
			// Proceed with the default seed below.
		}

		const seeded: Record< string, unknown > = {
			...normalizeReportParams( params as Parameters< typeof normalizeReportParams >[ 0 ] ),
			...( resolvedSection ? { section: resolvedSection } : {} ),
		};

		throw redirect( {
			to: '/report/posts',
			replace: true,
			/*
			 * The router is built dynamically, so this route has no
			 * statically-typed search schema (tanstack widens it to `never`).
			 * Cast the seeded params the same way the routing package does when
			 * it writes the URL.
			 */
			search: seeded as unknown as never,
		} );
	},
};
