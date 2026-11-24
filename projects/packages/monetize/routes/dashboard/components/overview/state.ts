import { getSectionState } from '../../data/state';

/**
 * Whether the site can refer friends, which only WordPress.com sites offer.
 */
export interface ReferralState {
	/** On a paid annual WordPress.com plan. */
	eligible: boolean;
	upgradeUrl: string;
}

/**
 * What `Sections\Overview::get_state()` prints.
 */
export interface OverviewState {
	hasWordAds: boolean;
	isWordAdsActive: boolean;
	hasSimplePayments: boolean;
	/** The payments fee, as a fraction, the upgrade brings. */
	upgradeCommission: number;
	/** Only on WordPress.com sites, for a user WordPress.com knows. */
	referral?: ReferralState;
}

const NONE: OverviewState = {
	hasWordAds: false,
	isWordAdsActive: false,
	hasSimplePayments: false,
	upgradeCommission: 0,
};

/**
 * The Overview's state, or one that offers no paid features if PHP printed none.
 *
 * @return The state.
 */
export function getOverviewState(): OverviewState {
	return { ...NONE, ...getSectionState< Partial< OverviewState > >( 'overview' ) };
}
