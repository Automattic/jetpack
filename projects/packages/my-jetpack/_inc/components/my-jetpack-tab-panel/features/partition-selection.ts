import type { FeatureState } from './feature-state';
import type { MyJetpackModule } from '../../../types';

/**
 * Anything the toolbar can act on: a main feature, or one of the modules grouped
 * beneath them. One selection spans both lists, so one partition has to understand both.
 */
export type BulkTarget =
	| { kind: 'feature'; slug: string; state: FeatureState }
	| { kind: 'module'; slug: string; module: MyJetpackModule };

export type BulkSelection = {
	toInstall: string[];
	toActivate: string[];
	toDeactivate: string[];
	modulesOn: string[];
	modulesOff: string[];
};

/**
 * Whether a target can take part in a bulk action at all.
 *
 * A feature needing a paid plan, and a module pinned by a filter, have no state the
 * toolbar could put them into.
 *
 * @param target - The target to test.
 * @return True when it can be selected.
 */
export function isSelectable( target: BulkTarget ): boolean {
	if ( target.kind === 'feature' ) {
		return target.state.selectable;
	}

	return target.module.available && ! target.module.override;
}

/**
 * Split a selection into the calls needed to switch it all on, or all off.
 *
 * Unselectable targets are dropped rather than trusted: the checkbox that would have
 * selected one is disabled, but the selection is held by slug and outlives a state
 * change, so a row can become unselectable while still selected.
 *
 * @param targets  - Every target on the page.
 * @param selected - Slugs of the selected targets.
 * @return The product and module slugs each bulk call needs.
 */
export function partitionSelection( targets: BulkTarget[], selected: string[] ): BulkSelection {
	const chosen = targets.filter(
		target => isSelectable( target ) && selected.includes( target.slug )
	);

	const features = chosen.filter( t => t.kind === 'feature' ) as Extract<
		BulkTarget,
		{ kind: 'feature' }
	>[];
	const modules = chosen.filter( t => t.kind === 'module' ) as Extract<
		BulkTarget,
		{ kind: 'module' }
	>[];

	return {
		toInstall: features
			.filter( t => t.state.action === 'install' )
			.map( t => t.state.feature.product ),
		toActivate: features
			.filter( t => t.state.action === 'activate' && t.state.feature.product )
			.map( t => t.state.feature.product ),
		toDeactivate: features
			.filter( t => t.state.action === 'running' && t.state.feature.product )
			.map( t => t.state.feature.product ),
		// The store is dispatched by module slug, which is not the feature's own slug.
		modulesOn: [
			...features
				.filter( t => t.state.module && ! t.state.module.activated )
				.map( t => t.state.module!.module ),
			...modules.filter( t => ! t.module.activated ).map( t => t.module.module ),
		],
		modulesOff: [
			...features
				.filter( t => t.state.module && t.state.module.activated )
				.map( t => t.state.module!.module ),
			...modules.filter( t => t.module.activated ).map( t => t.module.module ),
		],
	};
}
