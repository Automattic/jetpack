/*
 * External dependencies
 */
import { aiAssistantIcon, useAiContext } from '@automattic/jetpack-ai-client';
import { KeyboardShortcuts, ToolbarButton } from '@wordpress/components';
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { createPortal, useContext, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
/*
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../ui-handler/context';
import AiAssistantBar from '../ai-assistant-bar';
import './style.scss';

export default function AiAssistantToolbarButton( {
	clientId,
}: {
	clientId: string;
} ): React.ReactElement {
	const { isVisible, toggle, setAssistantFixed, isFixed } = useContext( AiAssistantUiContext );
	const { requestingState } = useAiContext();

	// Check if the sidebar is Opened
	const isSidebarOpened = useSelect(
		select => select( 'core/edit-post' )?.isEditorSidebarOpened(), // 'core/edit-post' could not exist in some cases (P2s, full site editing)
		[]
	);

	const isMobileViewport = useViewportMatch( 'medium', '<' );

	const [ barAnchor, setBarAnchor ] = React.useState< HTMLElement | null >( null );

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

		// Set the anxhor where the Assistant Bar will be rendered.
		setBarAnchor( toolbar );

		// Fix the assistant toolbar in mobile
		setAssistantFixed( isMobileViewport );
	}, [ setAssistantFixed, isVisible, isMobileViewport ] );

	const isDisabled = requestingState === 'requesting' || requestingState === 'suggesting';
	const showAiToolbar = isVisible && isFixed && barAnchor && ! isSidebarOpened;
	return (
		<>
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					'mod+/': toggle,
				} }
			/>

			{ showAiToolbar &&
				createPortal(
					<div className="jetpack-ai-assistant-bar is-fixed">
						<AiAssistantBar clientId={ clientId } />
					</div>,
					barAnchor
				) }

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
