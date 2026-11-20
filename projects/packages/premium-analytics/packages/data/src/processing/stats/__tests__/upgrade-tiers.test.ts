import { getAvailableUpgradeTiers } from '../upgrade-tiers';
import type {
	StatsAppPlanPriceTier,
	StatsAppPlanUsage,
} from '../../../hooks/use-stats-app-plan-usage';

function listedTier( maximum_units: number, minimum_price: number ): StatsAppPlanPriceTier {
	return {
		minimum_units: 0,
		maximum_units,
		minimum_price,
		maximum_price: minimum_price,
		minimum_price_display: '',
		minimum_price_monthly_display: '',
		maximum_price_display: null,
		maximum_price_monthly_display: null,
	};
}

// The live `jetpack_stats_yearly` list: five fixed tiers, then an open-ended one priced per million.
const PRICE_TIERS: StatsAppPlanPriceTier[] = [
	listedTier( 10000, 10000 ),
	listedTier( 100000, 20000 ),
	listedTier( 250000, 30000 ),
	listedTier( 500000, 50000 ),
	listedTier( 1000000, 70000 ),
	{
		...listedTier( 0, 95000 ),
		maximum_units: null,
		maximum_price: 0,
		transform_quantity_divide_by: 1000000,
		per_unit_fee: 25000,
	},
];

function usage( overrides: Partial< StatsAppPlanUsage > ): StatsAppPlanUsage {
	return {
		views_limit: null,
		billable_monthly_views: 0,
		current_tier: undefined as unknown as StatsAppPlanUsage[ 'current_tier' ],
		...overrides,
	} as StatsAppPlanUsage;
}

const views = ( tiers: ReturnType< typeof getAvailableUpgradeTiers > ) => tiers.map( t => t.views );

describe( 'getAvailableUpgradeTiers', () => {
	it( 'offers every listed tier, the open-ended one from two million views', () => {
		const tiers = getAvailableUpgradeTiers( PRICE_TIERS, usage( {} ) );

		expect( views( tiers ) ).toEqual( [ 10000, 100000, 250000, 500000, 1000000, 2000000 ] );
		expect( tiers.every( tier => tier.upgradePrice === 0 ) ).toBe( true );
	} );

	it( 'drops the purchased tier and below, and prices the rest as the difference', () => {
		const tiers = getAvailableUpgradeTiers(
			PRICE_TIERS,
			usage( {
				views_limit: 100000,
				billable_monthly_views: 40000,
				current_tier: { ...listedTier( 100000, 20000 ), limit: 100000 },
			} )
		);

		expect( views( tiers ) ).toEqual( [ 250000, 500000, 1000000, 2000000, 3000000, 4000000 ] );
		expect( tiers[ 0 ].upgradePrice ).toBe( 10000 );
		expect( tiers[ 4 ] ).toMatchObject( { price: 120000, upgradePrice: 100000 } );
		expect( tiers[ 5 ].perUnitFee ).toBe( 25000 );
	} );

	it( 'does not count the views a bundled plan adds as a purchased tier', () => {
		const tiers = getAvailableUpgradeTiers(
			PRICE_TIERS,
			usage( { views_limit: 100000, billable_monthly_views: 5000 } )
		);

		expect( tiers[ 0 ].views ).toBe( 10000 );
	} );

	it( 'drops the tiers a site already uses more views than', () => {
		const tiers = getAvailableUpgradeTiers(
			PRICE_TIERS,
			usage( { views_limit: null, billable_monthly_views: 120000 } )
		);

		expect( tiers[ 0 ].views ).toBe( 250000 );
		expect( tiers.every( tier => tier.upgradePrice === 0 ) ).toBe( true );
	} );

	it( 'offers only the million-view steps above a purchased extension step', () => {
		const tiers = getAvailableUpgradeTiers(
			PRICE_TIERS,
			usage( {
				views_limit: 3000000,
				billable_monthly_views: 2500000,
				current_tier: { ...PRICE_TIERS[ 5 ], limit: 3000000 },
			} )
		);

		expect( views( tiers ) ).toEqual( [ 4000000, 5000000, 6000000, 7000000, 8000000, 9000000 ] );
		// The purchased 3M step costs the tier minimum plus one step's fee.
		expect( tiers[ 0 ] ).toMatchObject( { price: 145000, upgradePrice: 25000 } );
	} );

	it( 'offers nothing without a price list', () => {
		expect( getAvailableUpgradeTiers( null, undefined ) ).toEqual( [] );
	} );
} );
