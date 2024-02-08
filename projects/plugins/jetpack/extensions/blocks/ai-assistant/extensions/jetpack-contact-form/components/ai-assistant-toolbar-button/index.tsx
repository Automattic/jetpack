/*
 * External dependencies
 */
import { aiAssistantIcon, useAiContext } from '@automattic/jetpack-ai-client';
import { KeyboardShortcuts, ToolbarButton } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useContext, useRef, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
/*
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../ui-handler/context';
import { selectFormBlock } from '../../ui-handler/with-ui-handler-data-provider';

const AI_ASSISTANT_BAR_SLOT_CLASS = 'jetpack-ai-assistant-bar__slot';

/**
 * The toolbar button that toggles the Assistant Bar.
 * Also, it creates a slot just after the contextual toolbar
 * to be used as the anchor for the Assistant Bar.
 *
 * @param {object} props - The component props.
 * @param {string} props.jetpackFormClientId - The Jetpack Form block client ID.
 * @returns {React.ReactElement}               The toolbar button.
 */
export default function AiAssistantToolbarButton( {
	jetpackFormClientId,
}: {
	jetpackFormClientId?: string;
} ): React.ReactElement {
	const { isVisible, toggle, setAnchor, assistantAnchor } = useContext( AiAssistantUiContext );
	const { requestingState } = useAiContext();

	const toolbarButtonRef = useRef< HTMLElement | null >( null );

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	/*
	 * When the toolbar button is rendered, we need to find the
	 * contextual toolbar and create a slot just after it.
	 * This slot will be used as the anchor for the Assistant Bar.
	 */
	useEffect( () => {
		if ( ! toolbarButtonRef.current ) {
			return;
		}

		const toolbar = toolbarButtonRef.current.closest(
			'.block-editor-block-contextual-toolbar'
		) as HTMLElement;
		if ( ! toolbar ) {
			return;
		}

		/*
		 * AI Assistant bar slot element.
		 * When the viewport is in mobile mode,
		 * create an element just after the contextual toolbar
		 * to be used as the anchor for the Assistant Bar.
		 */

		/*
		 * Check if the slot already exists,
		 * quering from the block-toolbar parent element.
		 * It should not happend, since the slot removes
		 * when the viewport is not mobile.
		 */
		let slot = toolbar.parentElement?.querySelector(
			`.${ AI_ASSISTANT_BAR_SLOT_CLASS }`
		) as HTMLElement;

		if ( slot ) {
			// always move the slot right after the toolbar.
			toolbar.after( slot );
			return setAnchor( slot );
		}

		// Slot not found - create it.
		slot = document.createElement( 'div' );

		// Set role="toolbar" and Aria label
		slot.setAttribute( 'role', 'toolbar' );
		slot.setAttribute( 'aria-label', __( 'AI Assistant', 'jetpack' ) );
		slot.setAttribute( 'aria-orientation', 'horizontal' );
		slot.className = AI_ASSISTANT_BAR_SLOT_CLASS;

		// Set the top position based on the toolbar height.
		const toolbarHeight = toolbar.offsetHeight;
		slot.style.top = `${ toolbarHeight }px`;
		toolbar.after( slot );

		// Set the anchor where the Assistant Bar will be rendered.
		setAnchor( slot );
	}, [ setAnchor ] );

	// Remove the slot when the view is not mobile.
	useEffect( () => {
		if ( isMobileViewport ) {
			return;
		}

		assistantAnchor?.remove();
	}, [ isMobileViewport, assistantAnchor ] );

	const toggleFromToolbar = useCallback( () => {
		if ( ! jetpackFormClientId ) {
			return toggle();
		}

		selectFormBlock( jetpackFormClientId, toggle );
	}, [ jetpackFormClientId, toggle ] );

	const isDisabled = requestingState === 'requesting' || requestingState === 'suggesting';

	return (
		<>
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					'mod+/': toggle,
				} }
			/>

			<ToolbarButton
				ref={ toolbarButtonRef }
				showTooltip
				onClick={ toggleFromToolbar }
				aria-haspopup="true"
				aria-expanded={ isVisible }
				label={ __( 'Ask AI Assistant', 'jetpack' ) }
				icon={ aiAssistantIcon }
				disabled={ isDisabled }
			/>
		</>
	);
}
