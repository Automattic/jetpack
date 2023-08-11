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

	const toolbarButtonRef = useRef< HTMLElement | null >( null );

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
