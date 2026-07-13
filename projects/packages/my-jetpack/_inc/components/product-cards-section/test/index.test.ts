import { PRODUCT_STATUSES } from '../../../constants';
import { shouldShowFullStatsCard } from '../index';

describe( 'shouldShowFullStatsCard', () => {
	const slugsWithStats: JetpackModule[] = [ 'stats', 'backup' ];

	it( 'shows the large Stats card when Stats is owned, the flag is on, and the module is active', () => {
		expect(
			shouldShowFullStatsCard( slugsWithStats, true, PRODUCT_STATUSES.ACTIVE as ProductStatus )
		).toBe( true );
	} );

	it( 'shows the large Stats card when the module is active and upgradable', () => {
		expect(
			shouldShowFullStatsCard( slugsWithStats, true, PRODUCT_STATUSES.CAN_UPGRADE as ProductStatus )
		).toBe( true );
	} );

	// Regression: when the Stats module is disabled, the large card renders as an empty,
	// non-actionable graph linking to an inaccessible page. It must be hidden so the compact
	// grid card (with an activation CTA) is shown instead. See fix/my-jetpack-stats-card-module-disabled.
	it( 'hides the large Stats card when the Stats module is disabled', () => {
		expect(
			shouldShowFullStatsCard(
				slugsWithStats,
				true,
				PRODUCT_STATUSES.MODULE_DISABLED as ProductStatus
			)
		).toBe( false );
	} );

	it( 'hides the large Stats card for other non-active statuses', () => {
		const nonActiveStatuses: ProductStatus[] = [
			PRODUCT_STATUSES.INACTIVE as ProductStatus,
			PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION as ProductStatus,
			PRODUCT_STATUSES.SITE_CONNECTION_ERROR as ProductStatus,
			PRODUCT_STATUSES.NEEDS_PLAN as ProductStatus,
		];

		nonActiveStatuses.forEach( status => {
			expect( shouldShowFullStatsCard( slugsWithStats, true, status ) ).toBe( false );
		} );
	} );

	it( 'hides the large Stats card while the status is still loading (undefined)', () => {
		expect( shouldShowFullStatsCard( slugsWithStats, true, undefined ) ).toBe( false );
	} );

	it( 'hides the large Stats card when the feature flag is off', () => {
		expect(
			shouldShowFullStatsCard( slugsWithStats, false, PRODUCT_STATUSES.ACTIVE as ProductStatus )
		).toBe( false );
	} );

	it( 'hides the large Stats card when Stats is not owned', () => {
		expect(
			shouldShowFullStatsCard( [ 'backup' ], true, PRODUCT_STATUSES.ACTIVE as ProductStatus )
		).toBe( false );
	} );
} );
