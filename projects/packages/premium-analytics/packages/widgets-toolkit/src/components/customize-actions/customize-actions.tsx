/**
 * External dependencies
 */
import { Button, Stack } from '@jetpack-premium-analytics/externals';
import { useMergeRefs, useViewportMatch } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { forwardRef, useEffect, useRef } from 'react';
/**
 * Internal dependencies
 */
import { PageOptionsMenu } from '../page-options-menu';
import { ResetLayoutAction } from '../reset-layout';
import type { ReactNode, Ref } from 'react';

const CustomizeButton = forwardRef< HTMLButtonElement, { onCustomize: () => void } >(
	function CustomizeButtonWithRef( { onCustomize }, ref ) {
		return (
			<Button ref={ ref } variant="outline" tone="brand" size="compact" onClick={ onCustomize }>
				<Button.Icon icon={ pencil } />
				{ __( 'Customize', 'jetpack-premium-analytics-pkg' ) }
			</Button>
		);
	}
);

/**
 * Keeps focus inside the frame across customize mode, which swaps out the button that had it.
 *
 * @param isCustomizing - Whether the page is in customize mode.
 * @param onCustomize   - Enters customize mode; omitted where Customize is not offered.
 * @return Refs for the frame and the buttons it focuses, and the `onCustomize` Customize must use.
 */
function useCustomizeFocus( isCustomizing: boolean, onCustomize?: () => void ) {
	const frameRef = useRef< HTMLDivElement >( null );
	const customizeRef = useRef< HTMLButtonElement >( null );
	const menuTriggerRef = useRef< HTMLButtonElement >( null );
	const wasCustomizing = useRef( isCustomizing );
	const isEnteringFromButton = useRef( false );

	const customize =
		onCustomize &&
		( () => {
			isEnteringFromButton.current = true;
			onCustomize();
		} );

	useEffect( () => {
		if ( wasCustomizing.current === isCustomizing ) {
			return;
		}
		wasCustomizing.current = isCustomizing;
		const fromButton = isEnteringFromButton.current;
		isEnteringFromButton.current = false;
		const frame = frameRef.current;

		// Only where the swap dropped focus: a tab switch or the command palette keeps its own.
		if ( ! frame || frame.ownerDocument.activeElement !== frame.ownerDocument.body ) {
			return;
		}

		if ( isCustomizing ) {
			// An empty layout enters on its own at load, where nothing had focus to lose.
			if ( fromButton ) {
				frame.querySelector< HTMLElement >( 'button:not(:disabled)' )?.focus();
			}
			return;
		}

		// Falls back to the menu trigger where Customize is no longer offered.
		( customizeRef.current ?? menuTriggerRef.current )?.focus();
	}, [ isCustomizing ] );

	return { frameRef, customizeRef, menuTriggerRef, onCustomize: customize };
}

export type CustomizeActionsProps = {
	isCustomizing: boolean;
	/** Enters customize mode; Customize is on offer only when given. */
	onCustomize?: () => void;
	/** Resets the layout to default; the Reset button shows while customizing, only when given. */
	onReset?: () => void | Promise< void >;
	/**
	 * The dashboard's own actions, `<WidgetDashboard.Actions />`, shown while customizing only,
	 * since at rest they add a second Customize. The route creates them: each bundle carries its
	 * own `@wordpress/widget-dashboard`, whose context one made here would never see.
	 */
	editingActions: ReactNode;
	/** The page's own actions, shown ahead of Customize while not customizing. */
	children?: ReactNode;
	/** The Customize button, for a caller that anchors on it. */
	customizeRef?: Ref< HTMLButtonElement >;
	/** The page options menu trigger, for a caller that anchors on it. */
	optionsMenuRef?: Ref< HTMLButtonElement >;
};

/**
 * The header actions of a page with a layout: Customize and the page options menu at rest,
 * the dashboard's Cancel and Done with Reset to default while customizing.
 *
 * @param props                - Component props.
 * @param props.isCustomizing  - Whether the page is in customize mode.
 * @param props.onCustomize    - Called when the reader selects Customize.
 * @param props.onReset        - Called when the reader confirms Reset to default.
 * @param props.editingActions - The dashboard's own actions, shown while customizing.
 * @param props.children       - The page's own actions.
 * @param props.customizeRef   - The Customize button.
 * @param props.optionsMenuRef - The page options menu trigger.
 * @return The actions.
 */
export function CustomizeActions( {
	isCustomizing,
	onCustomize,
	onReset,
	editingActions,
	children,
	customizeRef,
	optionsMenuRef,
}: CustomizeActionsProps ) {
	const focus = useCustomizeFocus( isCustomizing, onCustomize );
	const customizeButtonRef = useMergeRefs( [ focus.customizeRef, customizeRef ] );
	const menuTriggerRef = useMergeRefs( [ focus.menuTriggerRef, optionsMenuRef ] );
	// On a phone the button squeezes the breadcrumb trail under the actions.
	const isNarrow = useViewportMatch( 'small', '<' );
	const offersCustomize = ! isCustomizing && focus.onCustomize;

	return (
		<Stack ref={ focus.frameRef } direction="row" align="center" gap="sm">
			{ isCustomizing ? editingActions : children }
			{ offersCustomize && ! isNarrow && (
				<CustomizeButton ref={ customizeButtonRef } onCustomize={ focus.onCustomize } />
			) }
			{ isCustomizing && onReset && <ResetLayoutAction onReset={ onReset } /> }
			<PageOptionsMenu
				triggerRef={ menuTriggerRef }
				onCustomize={ offersCustomize && isNarrow ? focus.onCustomize : undefined }
			/>
		</Stack>
	);
}
