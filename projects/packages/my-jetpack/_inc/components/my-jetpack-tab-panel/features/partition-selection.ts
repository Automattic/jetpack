import type { FeatureState } from './feature-state';

export type BulkSelection = {
	toInstall: string[];
	toActivate: string[];
	toDeactivate: string[];
	modulesOn: string[];
	modulesOff: string[];
};

/**
 * Split a selection into the calls needed to switch it all on, or all off.
 *
 * Unswitchable features are dropped rather than trusted: their checkbox is disabled,
 * but a selection is held by slug and outlives a state change, so a row can become
 * unswitchable while still selected.
 *
 * @param states   - Every feature on the page.
 * @param selected - Slugs of the selected features.
 * @return The product and module slugs each bulk call needs.
 */
export function partitionSelection( states: FeatureState[], selected: string[] ): BulkSelection {
	const chosen = states.filter(
		state => state.switchable && selected.includes( state.feature.slug )
	);

	return {
		toInstall: chosen.filter( s => s.action === 'install' ).map( s => s.feature.product ),
		toActivate: chosen
			.filter( s => s.action === 'activate' && s.feature.product )
			.map( s => s.feature.product ),
		toDeactivate: chosen
			.filter( s => s.action === 'running' && s.feature.product )
			.map( s => s.feature.product ),
		// The store is dispatched by module slug, which is not the feature's own slug.
		modulesOn: chosen.filter( s => s.module && ! s.module.activated ).map( s => s.module!.module ),
		modulesOff: chosen.filter( s => s.module && s.module.activated ).map( s => s.module!.module ),
	};
}
