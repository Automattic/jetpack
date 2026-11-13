import { useCallback, useEffect, useState } from 'react';
import { useTrackCustomize, type TrackingSurface } from '../../hooks/use-track-event';
import type { CanPerformDashboardOperation, DashboardWidget } from '@wordpress/widget-dashboard';

export type DetailPageCustomize = {
	/** Whether the page is in customize mode. */
	isCustomizing: boolean;
	/** Whether Customize is on offer: a layout on show, and customization enabled. */
	canCustomize: boolean;
	/** The policy for `WidgetDashboard.Policy`. */
	canPerform: CanPerformDashboardOperation;
	/** Enters customize mode; the header's Customize button. */
	startCustomizing: () => void;
	/** Resets the layout on show and leaves customize mode; the header's Reset to default button. */
	resetToDefault: () => void;
	/** For `WidgetDashboard`'s `onEditChange`: its Cancel and Done report back here. */
	onEditChange: ( nextEditMode: boolean ) => void;
	/** For `WidgetDashboard`'s `onLayoutChange`: stores the layout via `options.onLayoutChange`. */
	onLayoutChange: ( nextLayout: DashboardWidget[] ) => void;
};

export type DetailPageCustomizeOptions = {
	/**
	 * Names the layout on show. When it changes, customize mode ends: the dashboard
	 * rebuilds its staged edits from the new committed layout, so they are lost
	 * either way, and a change the reader did not make here (Back, a deep link)
	 * must not leave the chrome open on a layout they did not pick.
	 */
	layoutId?: string;
	/** Whether there is anything to customize; going false ends customize mode. */
	enabled?: boolean;
	/** Resets the stored layout; what `resetToDefault` calls before leaving customize mode. */
	onLayoutReset?: () => void;
	/** Stores a committed layout. */
	onLayoutChange?: ( nextLayout: DashboardWidget[] ) => void;
	/** The page, for the customize Tracks events. */
	surface?: TrackingSurface;
};

/**
 * Customize mode for a detail page: the reader may rearrange the fixed
 * composition's cards, never add or remove them (WOOA7S-1622). Customize and
 * Reset to default are the page header's, not the dashboard's own actions;
 * Reset is offered while customizing only, and leaves the mode (WOOA7S-2033).
 *
 * @param {DashboardWidget[]}          layout  - The layout on show; while empty, edit mode cannot be entered.
 * @param {DetailPageCustomizeOptions} options - Which layout this is, and whether it can be customized at all.
 * @return The mode, the policy, and the transitions.
 */
export function useDetailPageCustomize(
	layout: DashboardWidget[],
	{
		layoutId,
		enabled = true,
		onLayoutReset,
		onLayoutChange,
		surface,
	}: DetailPageCustomizeOptions = {}
): DetailPageCustomize {
	const [ isCustomizing, setIsCustomizing ] = useState( false );
	const track = useTrackCustomize( surface );

	// An empty layout makes the dashboard request edit mode on its own (its
	// empty state invites customization); a detail page is only empty while a
	// gate resolves, so neither that request nor the Customize button may open the chrome.
	const canCustomize = enabled && layout.length > 0;

	useEffect( () => {
		setIsCustomizing( false );
	}, [ layoutId ] );

	useEffect( () => {
		if ( ! canCustomize ) {
			setIsCustomizing( false );
		}
	}, [ canCustomize ] );

	const canPerform = useCallback< CanPerformDashboardOperation >( request => {
		switch ( request.operation ) {
			case 'customize':
			case 'insert':
			case 'remove':
			case 'reset':
				return false;
			default:
				return true;
		}
	}, [] );

	const onEditChange = useCallback(
		( nextEditMode: boolean ) => {
			if ( nextEditMode && ! canCustomize ) {
				return;
			}
			if ( nextEditMode ) {
				track.start();
			} else {
				track.exit();
			}
			setIsCustomizing( nextEditMode );
		},
		[ canCustomize, track ]
	);

	const startCustomizing = useCallback( () => onEditChange( true ), [ onEditChange ] );

	const handleLayoutChange = useCallback(
		( nextLayout: DashboardWidget[] ) => {
			track.layoutChange( layout, nextLayout );
			onLayoutChange?.( nextLayout );
		},
		[ layout, onLayoutChange, track ]
	);

	// The dashboard's own reset did the same: reset, then leave the mode.
	const resetToDefault = useCallback( () => {
		track.reset();
		onLayoutReset?.();
		setIsCustomizing( false );
	}, [ onLayoutReset, track ] );

	return {
		isCustomizing,
		canCustomize,
		canPerform,
		startCustomizing,
		resetToDefault,
		onEditChange,
		onLayoutChange: handleLayoutChange,
	};
}
