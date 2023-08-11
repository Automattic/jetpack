/*
 * External dependencies
 */
import { aiAssistantIcon, useAiContext } from '@automattic/jetpack-ai-client';
import { KeyboardShortcuts, ToolbarButton } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useContext, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
/*
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../ui-handler/context';

export default function AiAssistantToolbarButton(): React.ReactElement {
	const { isVisible, toggle, setAssistantFixed, setAnchor } = useContext( AiAssistantUiContext );
	const { requestingState } = useAiContext();

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	/*
	 * Let's switch the anchor when the toolbar is fixed
	 * 1 - Pick the Dom element reference
	 * 2 - Find the closest block-editor-block-contextual-toolbar
	 * 3 - Check if the toolbar is fixed, based on `is-fixed` CSS class
	 */
	const anchorRef = useRef< HTMLElement | null >( null );
	useEffect( () => {
		if ( ! anchorRef.current ) {
			return;
		}

		const toolbar = anchorRef.current.closest(
			'.block-editor-block-contextual-toolbar'
		) as HTMLElement;
		if ( ! toolbar ) {
			return;
		}

		/*
		 * Let's create a slot just after the toolbar,
		 * in case it was not created yet.
		 */
		if ( toolbar?.nextElementSibling?.classList.contains( 'jetpack-ai-assistant-bar__slot' ) ) {
			return;
		}

		const slot = document.createElement( 'div' );
		slot.className = 'jetpack-ai-assistant-bar__slot';
		toolbar.after( slot );

		// Set the anchor where the Assistant Bar will be rendered.
		setAnchor( slot );

		// Fix the assistant toolbar in mobile
		setAssistantFixed( isMobileViewport );
	}, [ setAssistantFixed, isMobileViewport, setAnchor ] );

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
				ref={ anchorRef }
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
