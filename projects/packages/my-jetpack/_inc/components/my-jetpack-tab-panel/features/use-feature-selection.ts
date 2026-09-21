import { useCallback, useMemo, useState } from 'react';
import { isBulkSwitchable, useBulkFeatureSwitch } from './use-bulk-feature-switch';
import type { FeatureState } from './feature-state';

export type FeatureSelection = {
	isSelected: ( slug: string ) => boolean;
	onSelect: ( slug: string, selected: boolean ) => void;
	onSelectAll: ( selected: boolean ) => void;
	selectedCount: number;
	selectableCount: number;
	allSelected: boolean;
	isBusy: boolean;
	toActivate: FeatureState[];
	toDeactivate: FeatureState[];
	pluginsHeldBack: boolean;
	onActivate: () => void;
	onDeactivate: () => void;
};

/**
 * What the bulk bar is switching, over every row on the tab.
 *
 * Held here rather than in either list, so the features and the modules below them share
 * one selection and one bar.
 *
 * @param states               - Every row on screen, in both lists.
 * @param canDeactivatePlugins - Whether plugins may be switched off in bulk, which the site allows only while Jetpack is active.
 * @return The selection, and the bulk actions over it.
 */
export function useFeatureSelection(
	states: FeatureState[],
	canDeactivatePlugins = true
): FeatureSelection {
	const [ selected, setSelected ] = useState< Set< string > >( () => new Set() );
	const { run, isRunning } = useBulkFeatureSwitch();
	// Rows in flight also count, so a run started before the view last changed still holds the bar.
	const isBusy = isRunning || states.some( state => state.isSwitching );

	const selectable = useMemo( () => states.filter( isBulkSwitchable ), [ states ] );
	// Only what is on screen and still switchable: a filter or search hides the rest.
	const picked = useMemo(
		() => selectable.filter( state => selected.has( state.feature.slug ) ),
		[ selectable, selected ]
	);

	const onSelect = useCallback( ( slug: string, isPicked: boolean ) => {
		setSelected( previous => {
			const next = new Set( previous );

			if ( isPicked ) {
				next.add( slug );
			} else {
				next.delete( slug );
			}

			return next;
		} );
	}, [] );

	const onSelectAll = useCallback(
		( checked: boolean ) =>
			setSelected( checked ? new Set( selectable.map( state => state.feature.slug ) ) : new Set() ),
		[ selectable ]
	);

	const toActivate = picked.filter( state => state.status !== 'active' );
	const toDeactivate = picked.filter(
		state =>
			state.status === 'active' && ( canDeactivatePlugins || state.control.kind !== 'plugin' )
	);

	// Clears only what was sent, so a row picked mid-run survives, and keeps failures for a retry.
	const switchStates = useCallback(
		async ( targets: FeatureState[], active: boolean ) => {
			const failed = await run( targets, active );
			setSelected( previous => {
				const next = new Set( previous );
				targets.forEach( state => next.delete( state.feature.slug ) );
				failed.forEach( slug => next.add( slug ) );
				return next;
			} );
		},
		[ run ]
	);

	return {
		isSelected: useCallback( ( slug: string ) => selected.has( slug ), [ selected ] ),
		onSelect,
		onSelectAll,
		selectedCount: picked.length,
		selectableCount: selectable.length,
		allSelected: selectable.length > 0 && picked.length === selectable.length,
		isBusy,
		toActivate,
		toDeactivate,
		pluginsHeldBack:
			! canDeactivatePlugins &&
			picked.some( state => state.status === 'active' && state.control.kind === 'plugin' ),

		onActivate: useCallback( () => switchStates( toActivate, true ), [ switchStates, toActivate ] ),

		onDeactivate: useCallback(
			() => switchStates( toDeactivate, false ),
			[ switchStates, toDeactivate ]
		),
	};
}
