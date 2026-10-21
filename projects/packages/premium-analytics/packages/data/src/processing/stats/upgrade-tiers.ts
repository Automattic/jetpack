/**
 * Internal dependencies
 */
import type {
	StatsAppPlanPriceTier,
	StatsAppPlanUsage,
} from '../../hooks/use-stats-app-plan-usage';

// The open-ended top tier is offered from this many million views, then a million at a time.
const EXTENSION_THRESHOLD_IN_MILLION = 2;
const MAX_TIERS = 6;

/**
 * A Stats tier the site can upgrade to. Prices are yearly, in the currency's smallest unit.
 */
export type StatsUpgradeTier = {
	/** The monthly views limit, which checkout takes as the purchase quantity. */
	views: number;
	price: number;
	/** What the upgrade costs on top of the current purchase; 0 when the site has none. */
	upgradePrice: number;
	/** The yearly fee per extra million views, set on the open-ended tier and its steps. */
	perUnitFee?: number;
	/** Views per extension step, set on the open-ended tier only. */
	extensionStep?: number;
};

type PlanUsage = Pick<
	StatsAppPlanUsage,
	'views_limit' | 'billable_monthly_views' | 'current_tier'
>;

function toUpgradeTiers(
	priceTiers: StatsAppPlanPriceTier[],
	currentTierPrice: number
): StatsUpgradeTier[] {
	return priceTiers.map( tier => {
		const upgradePrice =
			currentTierPrice && tier.minimum_price > currentTierPrice
				? tier.minimum_price - currentTierPrice
				: 0;

		if ( tier.maximum_units === null ) {
			const step = tier.transform_quantity_divide_by || 1;
			return {
				views: EXTENSION_THRESHOLD_IN_MILLION * step,
				price: tier.minimum_price,
				upgradePrice,
				perUnitFee: tier.per_unit_fee,
				extensionStep: step,
			};
		}

		return { views: tier.maximum_units, price: tier.minimum_price, upgradePrice };
	} );
}

function withoutLowerTiers( tiers: StatsUpgradeTier[], usage: PlanUsage ): StatsUpgradeTier[] {
	if ( ! usage.views_limit && ! usage.billable_monthly_views ) {
		return tiers;
	}

	// `current_tier.limit` leaves out the views a bundled plan (e.g. Complete) adds to `views_limit`.
	const floor = Math.max( usage.current_tier?.limit ?? 0, usage.billable_monthly_views ?? 0, 0 );

	return tiers.filter( tier => !! tier.extensionStep || tier.views > floor );
}

/** Fills the list up to `MAX_TIERS` with steps of the open-ended tier, above the site's limit or usage. */
function withExtensionTiers( tiers: StatsUpgradeTier[], usage: PlanUsage ): StatsUpgradeTier[] {
	const highest = tiers[ tiers.length - 1 ];
	if ( ! highest?.extensionStep || tiers.length >= MAX_TIERS ) {
		return tiers;
	}

	const step = highest.extensionStep;
	const perUnitFee = highest.perUnitFee ?? 0;
	const viewsLimit = usage.views_limit ?? 0;

	const startingStep =
		Math.floor( Math.max( viewsLimit, usage.billable_monthly_views ?? 0, 0 ) / step ) -
		EXTENSION_THRESHOLD_IN_MILLION +
		1;

	// The purchased tier may itself be an extension step, priced above the tier's minimum.
	const purchasedStep = Math.floor( viewsLimit / step );
	const purchasedExtensionSteps = Math.max( purchasedStep - EXTENSION_THRESHOLD_IN_MILLION, 0 );
	const purchasedPrice =
		( usage.current_tier?.minimum_price ?? 0 ) + perUnitFee * purchasedExtensionSteps;

	// A site past the open-ended tier's start is offered only the steps above it.
	const extended = tiers.length === 1 && startingStep > 0 ? [] : [ ...tiers ];

	const firstStep = Math.max( startingStep, 1 );
	const lastStep = firstStep + MAX_TIERS - extended.length;

	for ( let extensionStep = firstStep; extensionStep < lastStep; extensionStep++ ) {
		const price = highest.price + perUnitFee * extensionStep;
		extended.push( {
			views: highest.views + step * extensionStep,
			price,
			upgradePrice: purchasedPrice > 0 ? price - purchasedPrice : 0,
			perUnitFee: highest.perUnitFee,
		} );
	}

	return extended;
}

/**
 * The Stats tiers a site can upgrade to, as classic Stats offers them: above the site's
 * current tier and usage, and extended past the top listed tier a million views at a time.
 *
 * @param priceTiers - The `jetpack_stats_yearly` price tier list.
 * @param usage      - The site's plan usage; without it every listed tier is offered.
 * @return The tiers, cheapest first.
 */
export function getAvailableUpgradeTiers(
	priceTiers: StatsAppPlanPriceTier[] | null | undefined,
	usage: PlanUsage | undefined
): StatsUpgradeTier[] {
	if ( ! priceTiers?.length ) {
		return [];
	}

	const tiers = toUpgradeTiers( priceTiers, usage?.current_tier?.minimum_price ?? 0 );
	if ( ! usage ) {
		return tiers;
	}

	return withExtensionTiers( withoutLowerTiers( tiers, usage ), usage );
}
