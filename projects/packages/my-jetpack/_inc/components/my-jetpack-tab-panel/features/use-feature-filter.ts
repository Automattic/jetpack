import { __ } from '@wordpress/i18n';
import type { FeatureState } from './feature-state';

export type FeatureFilter =
	'all' | 'active' | 'inactive' | 'included' | 'essential' | 'security' | 'complete' | 'growth';

const PLANS = [ 'security', 'complete', 'growth' ];

export const isFeatureFilter = ( value: string ): value is FeatureFilter =>
	[ 'all', 'active', 'inactive', 'included', 'essential', ...PLANS ].includes( value );

/**
 * The filters offered as pills, in the order they are shown.
 *
 * Complete earns no pill of its own, but an old link can still select it — so it joins the
 * list while it is the active one, or the narrow layout's select would have nothing to show.
 * Included in plan only shows for a site that pays for something, or when a link selects it.
 * A visit that arrived on Included in plan is about what the site owns, so it drops the
 * category pills.
 *
 * @param active      - The filter in play, if any.
 * @param hasIncluded - Whether the site pays for any feature.
 * @param ownedView   - Whether the visit arrived on Included in plan.
 * @return One entry per filter, each with its label.
 */
export const getFeatureFilters = (
	active?: FeatureFilter,
	hasIncluded = false,
	ownedView = false
): Array< { value: FeatureFilter; label: string } > => [
	{ value: 'all', label: __( 'All', 'jetpack-my-jetpack' ) },
	{ value: 'active', label: __( 'Active', 'jetpack-my-jetpack' ) },
	{ value: 'inactive', label: __( 'Inactive', 'jetpack-my-jetpack' ) },
	...( hasIncluded || ownedView || 'included' === active
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
	...( 'complete' === active
		? [ { value: 'complete' as FeatureFilter, label: __( 'Complete', 'jetpack-my-jetpack' ) } ]
		: [] ),
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
