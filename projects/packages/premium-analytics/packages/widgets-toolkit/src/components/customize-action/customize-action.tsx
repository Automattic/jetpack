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
 *
 * @param isCustomizing - Whether the page is in customize mode.
 * @return Refs for the actions' frame and the Customize button.
 */
export function useCustomizeFocus( isCustomizing: boolean ) {
	const frameRef = useRef< HTMLDivElement >( null );
	const customizeRef = useRef< HTMLButtonElement >( null );
	const wasCustomizing = useRef( isCustomizing );

	useEffect( () => {
		if ( wasCustomizing.current === isCustomizing ) {
			return;
		}
		wasCustomizing.current = isCustomizing;
		const frame = frameRef.current;

		if ( ! isCustomizing ) {
			// Falls back to the menu trigger where Customize is no longer offered.
			(
				customizeRef.current ?? frame?.querySelector< HTMLElement >( '[aria-haspopup="menu"]' )
			)?.focus();
			return;
		}

		// Only when the click that entered dropped focus; the command palette restores its own.
		if ( frame && frame.ownerDocument.activeElement === frame.ownerDocument.body ) {
			frame.querySelector< HTMLElement >( 'button:not(:disabled)' )?.focus();
		}
	}, [ isCustomizing ] );

	return { frameRef, customizeRef };
}
