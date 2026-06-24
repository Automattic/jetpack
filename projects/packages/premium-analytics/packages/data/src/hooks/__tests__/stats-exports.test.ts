/**
 * Internal dependencies
 */
import * as dataPackage from '../../index';

const statsHookNames = [
	'useStatsSite',
	'useStatsPost',
	'useStatsTopPosts',
	'useStatsReferrers',
	'useStatsClicks',
	'useStatsSearchTerms',
	'useStatsFileDownloads',
	'useStatsTopAuthors',
	'useStatsLocations',
	'useStatsCountryViews',
	'useStatsVideoPlays',
	'useStatsAppCommercialClassificationMutation',
	'useStatsAppDashboardModuleSettings',
	'useStatsAppDashboardModuleSettingsMutation',
	'useStatsAppPlanUsage',
	'useStatsArchives',
	'useStatsCommentFollowers',
	'useStatsFollowers',
	'useStatsPublicize',
	'useStatsComments',
	'useStatsSubscribers',
	'useStatsSubscribersCounts',
	'useStatsStreak',
	'useStatsVisits',
	'useStatsInsights',
	'useStatsUtm',
	'useStatsHighlights',
	'useStatsTags',
	'useStatsDevices',
	'useStatsAppSiteHasNeverPublishedPost',
] as const satisfies ReadonlyArray< keyof typeof dataPackage >;

describe( 'Stats public hook names', () => {
	it.each( statsHookNames )(
		'exports %s as a discoverable family-prefixed traffic hook',
		hookName => {
			expect( dataPackage[ hookName ] ).toEqual( expect.any( Function ) );
		}
	);
} );
