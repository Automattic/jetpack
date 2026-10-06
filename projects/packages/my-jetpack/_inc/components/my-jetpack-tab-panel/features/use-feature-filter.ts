import { __ } from '@wordpress/i18n';
import type { FeatureState } from './feature-state';

export type FeatureFilter =
	'all' | 'active' | 'inactive' | 'included' | 'essential' | 'security' | 'growth';

const PLANS = [ 'security', 'growth' ];

export const isFeatureFilter = ( value: string ): value is FeatureFilter =>
	[ 'all', 'active', 'inactive', 'included', 'essential', ...PLANS ].includes( value );

/**
 * The filters offered as pills, in the order they are shown.
 *
 * Included in plan earns no pill of its own, but a link can still select it — so it joins
 * the list while it is the active one, or the narrow layout's select would have nothing to
 * show. A visit that arrived on it is about what the site owns, so it swaps the category
 * pills for that one.
 *
 * @param active    - The filter in play, if any.
 * @param ownedView - Whether the visit arrived on Included in plan.
 * @return One entry per filter, each with its label.
 */
export const getFeatureFilters = (
	active?: FeatureFilter,
	ownedView = false
): Array< { value: FeatureFilter; label: string } > => [
	{ value: 'all', label: __( 'All', 'jetpack-my-jetpack' ) },
	{ value: 'active', label: __( 'Active', 'jetpack-my-jetpack' ) },
	{ value: 'inactive', label: __( 'Inactive', 'jetpack-my-jetpack' ) },
	...( ownedView || 'included' === active
		? [
				{
					value: 'included' as FeatureFilter,
					label: __( 'Included in plan', 'jetpack-my-jetpack' ),
				},
			]
		: [] ),
	...( ownedView
		? []
		: [
				{ value: 'essential' as FeatureFilter, label: __( 'Essential', 'jetpack-my-jetpack' ) },
				{ value: 'security' as FeatureFilter, label: __( 'Security', 'jetpack-my-jetpack' ) },
				{ value: 'growth' as FeatureFilter, label: __( 'Growth', 'jetpack-my-jetpack' ) },
			] ),
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

	if ( filter === 'included' ) {
		return Boolean( state.feature.included );
	}

	if ( PLANS.includes( filter ) ) {
		return state.feature.plans.some( plan => plan.slug === filter );
	}

	return state.feature.essential;
}
