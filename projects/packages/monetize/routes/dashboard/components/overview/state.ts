import { getSectionState } from '../../data/state';

/**
 * What `Sections\Overview::get_state()` prints.
 */
export interface OverviewState {
	hasWordAds: boolean;
	isWordAdsActive: boolean;
	hasSimplePayments: boolean;
	upgradeUrl: string;
	/** The payments fee, as a fraction, the upgrade brings. */
	upgradeCommission: number;
}

const NONE: OverviewState = {
	hasWordAds: false,
	isWordAdsActive: false,
	hasSimplePayments: false,
	upgradeUrl: '',
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
