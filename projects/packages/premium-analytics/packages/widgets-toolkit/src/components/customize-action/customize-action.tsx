/**
 * External dependencies
 */
import { Button } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { forwardRef, useEffect, useRef } from 'react';

export type CustomizeActionProps = {
	/** Enters customize mode. */
	onCustomize: () => void;
};

/**
 * The page header's Customize button, shown while a page with a layout is at rest.
 */
export const CustomizeAction = forwardRef< HTMLButtonElement, CustomizeActionProps >(
	function CustomizeActionButton( { onCustomize }, ref ) {
		return (
			<Button ref={ ref } variant="outline" tone="brand" size="compact" onClick={ onCustomize }>
				<Button.Icon icon={ pencil } />
				{ __( 'Customize', 'jetpack-premium-analytics-pkg' ) }
			</Button>
		);
	}
);

/**
 * Keeps focus in the header actions across customize mode, which swaps out the button that had it.
 * `frameRef` must hold Customize, the editing actions and the page options menu: focus moves within it.
 *
 * @param isCustomizing - Whether the page is in customize mode.
 * @param onCustomize   - Enters customize mode; omitted where Customize is not offered.
 * @return Refs for the frame and the Customize button, and the `onCustomize` that button must use.
 */
export function useCustomizeFocus( isCustomizing: boolean, onCustomize?: () => void ) {
	const frameRef = useRef< HTMLDivElement >( null );
	const customizeRef = useRef< HTMLButtonElement >( null );
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
		(
			customizeRef.current ?? frame.querySelector< HTMLElement >( '[aria-haspopup="menu"]' )
		)?.focus();
	}, [ isCustomizing ] );

	return { frameRef, customizeRef, onCustomize: customize };
}
