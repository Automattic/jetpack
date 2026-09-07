import { PRODUCT_STATUSES } from '../../../constants';
import { shouldShowCompactStatsCard, shouldShowFullStatsCard } from '../index';

const status = ( value: string ) => value as ProductStatus;

describe( 'shouldShowFullStatsCard', () => {
	it( 'shows the large Stats card when the flag is on, the user can view stats, and the module is active', () => {
		expect( shouldShowFullStatsCard( true, true, status( PRODUCT_STATUSES.ACTIVE ) ) ).toBe( true );
	} );

	it( 'shows the large Stats card when the module is active and upgradable', () => {
		expect( shouldShowFullStatsCard( true, true, status( PRODUCT_STATUSES.CAN_UPGRADE ) ) ).toBe(
			true
		);
	} );

	// Regression: when the Stats module is disabled, the large card renders as an empty,
	// non-actionable graph linking to an inaccessible page, so it must be hidden.
	it( 'hides the large Stats card when the Stats module is disabled', () => {
		expect(
			shouldShowFullStatsCard( true, true, status( PRODUCT_STATUSES.MODULE_DISABLED ) )
		).toBe( false );
	} );

	it( 'hides the large Stats card for other non-active statuses', () => {
		[
			PRODUCT_STATUSES.INACTIVE,
			PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION,
			PRODUCT_STATUSES.SITE_CONNECTION_ERROR,
			PRODUCT_STATUSES.NEEDS_PLAN,
		].forEach( value => {
			expect( shouldShowFullStatsCard( true, true, status( value ) ) ).toBe( false );
		} );
	} );

	it( 'hides the large Stats card while the status is still loading (undefined)', () => {
		expect( shouldShowFullStatsCard( true, true, undefined ) ).toBe( false );
	} );

	it( 'hides the large Stats card when the feature flag is off', () => {
		expect( shouldShowFullStatsCard( false, true, status( PRODUCT_STATUSES.ACTIVE ) ) ).toBe(
			false
		);
	} );

	it( 'hides the large Stats card when the user cannot view stats', () => {
		expect( shouldShowFullStatsCard( true, false, status( PRODUCT_STATUSES.ACTIVE ) ) ).toBe(
			false
		);
	} );
} );

describe( 'shouldShowCompactStatsCard', () => {
	// Core of the fix: a disabled Stats module is reported as "unowned", so the compact activation
	// card must be driven off status (not the owned-products list) and shown when Stats is not active.
	it( 'shows the compact card when the Stats module is disabled', () => {
		expect(
			shouldShowCompactStatsCard( true, true, status( PRODUCT_STATUSES.MODULE_DISABLED ) )
		).toBe( true );
	} );

	it( 'shows the compact card for other non-active statuses', () => {
		[
			PRODUCT_STATUSES.INACTIVE,
			PRODUCT_STATUSES.NEEDS_FIRST_SITE_CONNECTION,
			PRODUCT_STATUSES.NEEDS_PLAN,
		].forEach( value => {
			expect( shouldShowCompactStatsCard( true, true, status( value ) ) ).toBe( true );
		} );
	} );

	it( 'hides the compact card when the module is active (the large card is shown instead)', () => {
		expect( shouldShowCompactStatsCard( true, true, status( PRODUCT_STATUSES.ACTIVE ) ) ).toBe(
			false
		);
		expect( shouldShowCompactStatsCard( true, true, status( PRODUCT_STATUSES.CAN_UPGRADE ) ) ).toBe(
			false
		);
	} );

	// Regression: avoids the flash where the card mounts then unmounts while data settles.
	it( 'hides the compact card while the status is still loading (undefined)', () => {
		expect( shouldShowCompactStatsCard( true, true, undefined ) ).toBe( false );
	} );

	it( 'hides the compact card when the feature flag is off', () => {
		expect(
			shouldShowCompactStatsCard( false, true, status( PRODUCT_STATUSES.MODULE_DISABLED ) )
		).toBe( false );
	} );

	it( 'hides the compact card when the user cannot view stats', () => {
		expect(
			shouldShowCompactStatsCard( true, false, status( PRODUCT_STATUSES.MODULE_DISABLED ) )
		).toBe( false );
	} );
} );
