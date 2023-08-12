/*
 * External dependencies
 */
import { aiAssistantIcon, useAiContext } from '@automattic/jetpack-ai-client';
import { KeyboardShortcuts, ToolbarButton } from '@wordpress/components';
import { useContext, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
/*
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../ui-handler/context';

const AI_ASSISTANT_BAR_SLOT_CLASS = 'jetpack-ai-assistant-bar__slot';

/**
 * The toolbar button that toggles the Assistant Bar.
 * Also, it creates a slot just after the contextual toolbar
 * to be used as the anchor for the Assistant Bar.
 *
 * @returns {React.ReactElement} The toolbar button.
 */
export default function AiAssistantToolbarButton(): React.ReactElement {
	const { isVisible, toggle, setAnchor } = useContext( AiAssistantUiContext );
	const { requestingState } = useAiContext();

	const toolbarButtonRef = useRef< HTMLElement | null >( null );

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
		 * Let's create a slot just after the toolbar,
		 * in case it was not created yet.
		 */
		if ( toolbar?.nextElementSibling?.classList.contains( AI_ASSISTANT_BAR_SLOT_CLASS ) ) {
			return;
		}

		const slot = document.createElement( 'div' );
		slot.className = AI_ASSISTANT_BAR_SLOT_CLASS;
		toolbar.after( slot );

		// Set the anchor where the Assistant Bar will be rendered.
		setAnchor( slot );
	}, [ setAnchor ] );

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
				onClick={ toggle }
				aria-haspopup="true"
				aria-expanded={ isVisible }
				label={ __( 'Ask AI Assistant', 'jetpack' ) }
				icon={ aiAssistantIcon }
				disabled={ isDisabled }
				isActive={ isVisible }
			/>
		</>
	);
}
