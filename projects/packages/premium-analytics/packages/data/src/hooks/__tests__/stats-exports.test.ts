/**
 * Internal dependencies
 */
import * as dataPackage from '../../index';

const statsHookNames = [
	'useStatsSite',
	'useStatsTopPosts',
	'useStatsReferrers',
	'useStatsClicks',
	'useStatsSearchTerms',
	'useStatsFileDownloads',
	'useStatsTopAuthors',
	'useStatsLocations',
	'useStatsCountryViews',
	'useStatsVideoPlays',
	'useStatsDevices',
	'useStatsArchives',
	'useStatsPublicize',
	'useStatsFollowers',
	'useStatsTags',
	'useStatsComments',
	'useStatsCommentFollowers',
] as const satisfies ReadonlyArray< keyof typeof dataPackage >;

describe( 'Stats public hook names', () => {
	it.each( statsHookNames )(
		'exports %s as a discoverable family-prefixed Stats hook',
		hookName => {
			expect( dataPackage[ hookName ] ).toEqual( expect.any( Function ) );
		}
	);
} );
