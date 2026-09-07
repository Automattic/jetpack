import { Badge, Icon, IconButton, Menu, Stack } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { moreVertical, pencil } from '@wordpress/icons';
import { useCallback, useState } from 'react';
import type { CanPerformDashboardOperation, DashboardWidget } from '@wordpress/widget-dashboard';
import type { ReactNode } from 'react';

export type DetailPageCustomize = {
	/** Whether the page is in customize mode. */
	isCustomizing: boolean;
	/** The policy for `WidgetDashboard.Policy`. */
	canPerform: CanPerformDashboardOperation;
	/** Enters customize mode; the page options menu's Customize entry. */
	startCustomizing: () => void;
	/**
	 * Leaves customize mode without committing. The dashboard rebuilds its staged
	 * edits from the committed layout, so call this before swapping the layout
	 * out from under it, as a tab change does.
	 */
	stopCustomizing: () => void;
	/** For `WidgetDashboard`'s `onEditChange`: its Cancel and Done report back here. */
	onEditChange: ( nextEditMode: boolean ) => void;
};

/**
 * Customize mode for a detail page: the reader may rearrange the fixed
 * composition's cards, never add or remove them (WOOA7S-1622). Customize is
 * offered by the page options menu, not the dashboard's own button, and Reset
 * only joins Cancel and Done while customizing (WOOA7S-2033).
 *
 * @param layout - The layout on show; while empty, edit mode cannot be entered.
 * @return The mode, the policy, and the transitions.
 */
export function useDetailPageCustomize( layout: DashboardWidget[] ): DetailPageCustomize {
	const [ isCustomizing, setIsCustomizing ] = useState( false );

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

	const startCustomizing = useCallback( () => setIsCustomizing( true ), [] );
	const stopCustomizing = useCallback( () => setIsCustomizing( false ), [] );

	const onEditChange = useCallback(
		( nextEditMode: boolean ) => {
			// An empty layout makes the dashboard request edit mode on its own (its
			// empty state invites customization); a detail page is only empty while
			// a gate resolves, so that request is ignored here.
			if ( nextEditMode && layout.length === 0 ) {
				return;
			}
			setIsCustomizing( nextEditMode );
		},
		[ layout ]
	);

	return { isCustomizing, canPerform, startCustomizing, stopCustomizing, onEditChange };
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
	onCustomize: () => void;
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
 * and the page options menu with Customize; customizing, the dashboard's own
 * Cancel, Done and overflow (with Reset to default) take it over.
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
	if ( isCustomizing ) {
		return <>{ editingActions }</>;
	}

	return (
		<Stack direction="row" align="center" gap="sm">
			{ children }
			<Menu.Root>
				<Menu.Trigger
					render={
						<IconButton
							icon={ moreVertical }
							label={ __( 'Page options', 'jetpack-premium-analytics-pkg' ) }
							variant="minimal"
							tone="brand"
							size="compact"
						/>
					}
				/>
				<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
					<Menu.Item prefix={ <Icon icon={ pencil } /> } onClick={ onCustomize }>
						<Menu.ItemLabel>{ __( 'Customize', 'jetpack-premium-analytics-pkg' ) }</Menu.ItemLabel>
					</Menu.Item>
				</Menu.Popup>
			</Menu.Root>
		</Stack>
	);
}
