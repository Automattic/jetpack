import { Badge, Stack } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PageOptionsMenu } from '../page-options-menu';
import type { CanPerformDashboardOperation, DashboardWidget } from '@wordpress/widget-dashboard';
import type { ReactNode } from 'react';

export type DetailPageCustomize = {
	/** Whether the page is in customize mode. */
	isCustomizing: boolean;
	/** Whether Customize is on offer: a layout on show, and customization enabled. */
	canCustomize: boolean;
	/** The policy for `WidgetDashboard.Policy`. */
	canPerform: CanPerformDashboardOperation;
	/** Enters customize mode; the page options menu's Customize entry. */
	startCustomizing: () => void;
	/** For `WidgetDashboard`'s `onEditChange`: its Cancel and Done report back here. */
	onEditChange: ( nextEditMode: boolean ) => void;
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
};

/**
 * Customize mode for a detail page: the reader may rearrange the fixed
 * composition's cards, never add or remove them (WOOA7S-1622). Customize is
 * offered by the page options menu, not the dashboard's own button, and Reset
 * only joins Cancel and Done while customizing (WOOA7S-2033).
 *
 * @param layout           - The layout on show; while empty, edit mode cannot be entered.
 * @param options          - Which layout this is, and whether it can be customized at all.
 * @param options.layoutId - Names the layout on show; a change ends customize mode.
 * @param options.enabled  - Whether there is anything to customize.
 * @return The mode, the policy, and the transitions.
 */
export function useDetailPageCustomize(
	layout: DashboardWidget[],
	{ layoutId, enabled = true }: DetailPageCustomizeOptions = {}
): DetailPageCustomize {
	const [ isCustomizing, setIsCustomizing ] = useState( false );

	// An empty layout makes the dashboard request edit mode on its own (its
	// empty state invites customization); a detail page is only empty while a
	// gate resolves, so neither that request nor the menu may open the chrome.
	const canCustomize = enabled && layout.length > 0;

	useEffect( () => {
		setIsCustomizing( false );
	}, [ layoutId ] );

	useEffect( () => {
		if ( ! canCustomize ) {
			setIsCustomizing( false );
		}
	}, [ canCustomize ] );

	const canPerform = useCallback< CanPerformDashboardOperation >(
		request => {
			switch ( request.operation ) {
				case 'customize':
				case 'insert':
				case 'remove':
					return false;
				case 'reset':
					return isCustomizing;
				default:
					return true;
			}
		},
		[ isCustomizing ]
	);

	const startCustomizing = useCallback( () => {
		if ( canCustomize ) {
			setIsCustomizing( true );
		}
	}, [ canCustomize ] );

	const onEditChange = useCallback(
		( nextEditMode: boolean ) => {
			if ( nextEditMode && ! canCustomize ) {
				return;
			}
			setIsCustomizing( nextEditMode );
		},
		[ canCustomize ]
	);

	return { isCustomizing, canCustomize, canPerform, startCustomizing, onEditChange };
}

export type DetailPageBreadcrumbsProps = {
	isCustomizing: boolean;
	/** The page's breadcrumbs. */
	children: ReactNode;
};

/**
 * The breadcrumbs slot of a detail page: the trail, with a Customizing badge
 * beside it while customize mode is on.
 *
 * @param props               - Component props.
 * @param props.isCustomizing - Whether the page is in customize mode.
 * @param props.children      - The page's breadcrumbs.
 * @return The slot content.
 */
export function DetailPageBreadcrumbs( { isCustomizing, children }: DetailPageBreadcrumbsProps ) {
	if ( ! isCustomizing ) {
		return <>{ children }</>;
	}

	return (
		<Stack direction="row" align="center" gap="sm">
			{ children }
			<Badge intent="informational">{ __( 'Customizing', 'jetpack-premium-analytics-pkg' ) }</Badge>
		</Stack>
	);
}

export type DetailPageActionsProps = {
	isCustomizing: boolean;
	/** Enters customize mode; Customize is on offer only when given. */
	onCustomize?: () => void;
	/**
	 * The dashboard's own actions, `<WidgetDashboard.Actions />`, created by the route.
	 * Each bundle carries its own copy of `@wordpress/widget-dashboard`, so one rendered
	 * from here would read a context the route's `WidgetDashboard` never provides.
	 */
	editingActions: ReactNode;
	/** The page's own actions, shown ahead of the menu while not customizing. */
	children?: ReactNode;
};

/**
 * The actions slot of a detail page. Idle, it holds the page's own actions
 * and the page options menu, Customize included; customizing, the dashboard's
 * own Cancel, Done and overflow (with Reset to default) take the actions' place
 * and the menu stays, less Customize. Leaving unmounts the focused control, so
 * focus is moved back onto the menu trigger.
 *
 * @param props                - Component props.
 * @param props.isCustomizing  - Whether the page is in customize mode.
 * @param props.onCustomize    - Called when the reader picks Customize.
 * @param props.editingActions - The dashboard's own actions, shown while customizing.
 * @param props.children       - The page's own actions.
 * @return The slot content.
 */
export function DetailPageActions( {
	isCustomizing,
	onCustomize,
	editingActions,
	children,
}: DetailPageActionsProps ) {
	const frame = useRef< HTMLDivElement >( null );
	const wasCustomizing = useRef( isCustomizing );

	useEffect( () => {
		if ( wasCustomizing.current === isCustomizing ) {
			return;
		}
		wasCustomizing.current = isCustomizing;
		// Entering, the menu closes onto its own trigger; leaving needs a hand.
		if ( ! isCustomizing ) {
			frame.current?.querySelector< HTMLElement >( '[aria-haspopup="menu"]' )?.focus();
		}
	}, [ isCustomizing ] );

	return (
		<Stack ref={ frame } direction="row" align="center" gap="sm">
			{ isCustomizing ? editingActions : children }
			<PageOptionsMenu onCustomize={ isCustomizing ? undefined : onCustomize } />
		</Stack>
	);
}
