import { getMyJetpackWindowInitialState } from '../../../data/utils/get-my-jetpack-window-state';
import type { BulkTarget } from './partition-selection';

export type FeatureFilter = 'all' | 'active' | 'inactive' | 'recommended' | 'essential';

export const isFeatureFilter = ( value: string ): value is FeatureFilter =>
	[ 'all', 'active', 'inactive', 'recommended', 'essential' ].includes( value );

/**
 * Whether a target passes the current filter.
 *
 * `essential` is a property of the main features only, and `recommended` a tag Jetpack
 * puts on modules, so each filter naturally narrows to one of the two lists.
 *
 * @param target - The feature or module to test.
 * @param filter - The active filter.
 * @return True when the row should be shown.
 */
export function matchesFilter( target: BulkTarget, filter: FeatureFilter ): boolean {
	if ( filter === 'all' ) {
		return true;
	}

	const isActive =
		target.kind === 'feature' ? target.state.status === 'active' : target.module.activated;

	if ( filter === 'active' ) {
		return isActive;
	}

	if ( filter === 'inactive' ) {
		return ! isActive;
	}

	if ( filter === 'essential' ) {
		return target.kind === 'feature' && !! target.state.feature.essential;
	}

	const recommended = ( getMyJetpackWindowInitialState( 'recommendedModuleSlugs' ) ||
		[] ) as unknown as string[];

	const moduleSlug = target.kind === 'feature' ? target.state.module?.module : target.module.module;

	return !! moduleSlug && recommended.includes( moduleSlug );
}
