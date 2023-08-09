/*
 * External dependencies
 */
import { aiAssistantIcon, useAiContext } from '@automattic/jetpack-ai-client';
import { ToolbarButton } from '@wordpress/components';
import { useContext, useRef, forwardRef, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useImperativeHandle } from 'react';
/*
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../ui-handler/context';
import { handleAiExtensionsBarBodyClass } from '../../ui-handler/with-ui-handler-data-provider';
import './style.scss';

function AiAssistantToolbarButton( props, ref ): React.ReactElement {
	const { isVisible, toggle, setAssistantFixed } = useContext( AiAssistantUiContext );
	const { requestingState } = useAiContext();

	/*
	 * Let's switch the anchor when the toolbar is fixed
	 * 1 - Pick the Dom element reference
	 * 2 - Find the closest block-editor-block-contextual-toolbar
	 * 3 - Check if the toolbar is fixed, based on `is-fixed` CSS class
	 */
	const toolbarButtonRef = useRef< HTMLElement | null >( null );
	const toolbarRef = useRef< HTMLElement | null >( null );

	// Pass the anchor ref to forwardRef
	useImperativeHandle( ref, () => toolbarRef.current );

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

		toolbarRef.current = toolbar;

		const isToolbarBlockFixed = toolbar.classList.contains( 'is-fixed' );

		setAssistantFixed( isToolbarBlockFixed );
		handleAiExtensionsBarBodyClass( isToolbarBlockFixed, isVisible );
	}, [ setAssistantFixed, isVisible ] );

	const isDisabled = requestingState === 'requesting' || requestingState === 'suggesting';

	return (
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
	);
}

export default forwardRef( AiAssistantToolbarButton );
