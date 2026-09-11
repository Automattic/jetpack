import { __ } from '@wordpress/i18n';
import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import type { FeatureState } from './feature-state';

export type FeatureFilter =
	| 'all'
	| 'active'
	| 'inactive'
	| 'recommended'
	| 'essential'
	| 'security'
	| 'complete'
	| 'growth';

const PLANS = [ 'security', 'complete', 'growth' ];

export const isFeatureFilter = ( value: string ): value is FeatureFilter =>
	[ 'all', 'active', 'inactive', 'recommended', 'essential', ...PLANS ].includes( value );

/**
 * The filters offered as pills, in the order they are shown.
 *
 * @return One entry per filter, each with its label.
 */
export const getFeatureFilters = (): Array< { value: FeatureFilter; label: string } > => [
	{ value: 'all', label: __( 'All', 'jetpack-my-jetpack' ) },
	{ value: 'active', label: __( 'Active', 'jetpack-my-jetpack' ) },
	{ value: 'inactive', label: __( 'Inactive', 'jetpack-my-jetpack' ) },
	{ value: 'recommended', label: __( 'Recommended', 'jetpack-my-jetpack' ) },
	{ value: 'essential', label: __( 'Essential', 'jetpack-my-jetpack' ) },
	{ value: 'security', label: __( 'Security', 'jetpack-my-jetpack' ) },
	{ value: 'complete', label: __( 'Complete', 'jetpack-my-jetpack' ) },
	{ value: 'growth', label: __( 'Growth', 'jetpack-my-jetpack' ) },
];

/**
 * Whether a feature passes the current filter.
 *
 * @param state  - Live state for the feature to test.
 * @param filter - The active filter.
 * @return True when the card should be shown.
 */
export function matchesFilter( state: FeatureState, filter: FeatureFilter ): boolean {
	if ( filter === 'all' ) {
		return true;
	}

	if ( filter === 'active' ) {
		return state.status === 'active';
	}

	if ( filter === 'inactive' ) {
		return state.status !== 'active';
	}

	if ( PLANS.includes( filter ) ) {
		return !! state.feature.plans?.some( plan => plan.slug === filter );
	}

	if ( filter === 'essential' ) {
		return !! state.feature.essential;
	}

	// `Recommended` is a tag Jetpack puts on the module behind a feature, and never
	// reaches the browser on the feature itself.
	const recommended = ( getMyJetpackWindowInitialState( 'recommendedModuleSlugs' ) ||
		[] ) as unknown as string[];

	return !! state.module?.module && recommended.includes( state.module.module );
}
