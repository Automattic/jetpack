/*
 * External dependencies
 */
import { aiAssistantIcon, useAiContext } from '@automattic/jetpack-ai-client';
import { ToolbarButton } from '@wordpress/components';
import { useContext, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
/*
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../ui-handler/context';
import { handleAiExtensionsBarBodyClass } from '../../ui-handler/with-ui-handler-data-provider';

export default function AiAssistantToolbarButton(): React.ReactElement {
	const { isVisible, toggle, setPopoverProps, setAssistantFixed } =
		useContext( AiAssistantUiContext );
	const { requestingState } = useAiContext();

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
		const isFixed = toolbar.classList.contains( 'is-fixed' );
		setAssistantFixed( isFixed );
		handleAiExtensionsBarBodyClass( isFixed, isVisible );

		if ( ! isFixed ) {
			return;
		}

		/*
		 * There is a race condition between the toolbar and component onMount.
		 * We need to wait a bit to set the popover props.
		 */
		setTimeout( () => {
			setPopoverProps( prev => ( {
				...prev,
				anchor: toolbar,
				offset: 0,
				variant: 'toolbar',
			} ) );
		}, 100 );
	}, [ setAssistantFixed, setPopoverProps, isVisible ] );

	const isDisabled = requestingState === 'requesting' || requestingState === 'suggesting';

	return (
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
	);
}
