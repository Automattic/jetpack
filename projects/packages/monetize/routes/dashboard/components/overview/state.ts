import { getSectionState } from '../../data/state';

/**
 * What `Sections\Overview::get_state()` prints.
 */
export interface OverviewState {
	hasWordAds: boolean;
	isWordAdsActive: boolean;
	hasSimplePayments: boolean;
	upgradeUrl: string;
}

const NONE: OverviewState = {
	hasWordAds: false,
	isWordAdsActive: false,
	hasSimplePayments: false,
	upgradeUrl: '',
};

/**
 * The Overview's state, or one that offers no paid features if PHP printed none.
 *
 * @return The state.
 */
export function getOverviewState(): OverviewState {
	return { ...NONE, ...getSectionState< Partial< OverviewState > >( 'overview' ) };
}
