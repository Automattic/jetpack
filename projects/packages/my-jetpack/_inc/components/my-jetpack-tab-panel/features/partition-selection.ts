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
 * Unselectable features are dropped rather than trusted: the checkbox that would have
 * selected one is disabled, but the selection is held by slug and outlives a state
 * change, so a row can become unselectable while still selected.
 *
 * @param states   - Live state for every feature.
 * @param selected - Slugs of the selected features.
 * @return The product and module slugs each bulk call needs.
 */
export function partitionSelection( states: FeatureState[], selected: string[] ): BulkSelection {
	const chosen = states.filter(
		state => state.selectable && selected.includes( state.feature.slug )
	);

	return {
		toInstall: chosen.filter( s => s.action === 'install' ).map( s => s.feature.product ),
		toActivate: chosen
			.filter( s => s.action === 'activate' && s.feature.product )
			.map( s => s.feature.product ),
		toDeactivate: chosen
			.filter( s => s.action === 'running' && s.feature.product )
			.map( s => s.feature.product ),
		modulesOn: chosen.filter( s => s.module && ! s.module.activated ).map( s => s.feature.module ),
		modulesOff: chosen.filter( s => s.module && s.module.activated ).map( s => s.feature.module ),
	};
}
