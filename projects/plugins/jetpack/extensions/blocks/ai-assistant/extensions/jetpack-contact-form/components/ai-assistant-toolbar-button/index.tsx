/*
 * External dependencies
 */
import { aiAssistantIcon, useAiContext } from '@automattic/jetpack-ai-client';
import { ToolbarButton } from '@wordpress/components';
import { select } from '@wordpress/data';
import { useContext, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
/*
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../ui-handler/context';
import { handleAiExtensionsBarBodyClass } from '../../ui-handler/with-ui-handler-data-provider';

type AiAssistantToolbarButtonProps = {
	clientId?: string;
};

export function hasFormContent( clientId: string ): boolean {
	if ( ! clientId?.length ) {
		return false;
	}

	const block = select( 'core/block-editor' ).getBlock( clientId );
	if ( ! block ) {
		return false;
	}

	return !! block?.innerBlocks?.length;
}

export default function AiAssistantToolbarButton( {
	clientId,
}: AiAssistantToolbarButtonProps ): React.ReactElement {
	const { isVisible, toggle, setPopoverProps, setAssistantFixed } =
		useContext( AiAssistantUiContext );
	const { requestingState } = useAiContext();

	const hasContent = hasFormContent( clientId );

	/*
	 * *** AI Assistant bar anchor ***
	 *
	 * On this component onMount event:
	 * 1 - Pick the Dom toolbar-button DOM element reference.
	 * 2 - Find the Block Toolbar DOM element, based on a CSS class.
	 * 3 - Check if the toolbar is fixed, based on `is-fixed` CSS class.
	 * 4 - Anchot the AI Assistant Bar to it when:
	 *  - The toolbar is fixed.
	 *  - The toolbar is not fixed, but the block has content.
	 *
	 * Also, it set the isFixed UI context state
	 * Add/remove the `jetpack-ai-assistant-bar-is-fixed` class to the body.
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

		if ( ! isFixed && ! hasContent ) {
			return;
		}

		setPopoverProps( prev => ( {
			...prev,
			anchor: toolbar,
			offset: hasContent && ! isFixed ? 6 : 0,
			variant: 'toolbar',
		} ) );
	}, [ setAssistantFixed, setPopoverProps, isVisible, hasContent ] );

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
