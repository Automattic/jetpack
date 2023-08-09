/*
 * External dependencies
 */
import { aiAssistantIcon, useAiContext } from '@automattic/jetpack-ai-client';
import { KeyboardShortcuts, Popover, ToolbarButton } from '@wordpress/components';
import { useContext, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import React, { useEffect } from 'react';
/*
 * Internal dependencies
 */
import { AiAssistantUiContext } from '../../ui-handler/context';
import { handleAiExtensionsBarBodyClass } from '../../ui-handler/with-ui-handler-data-provider';
import AiAssistantBar from '../ai-assistant-bar';
import './style.scss';

export default function AiAssistantToolbarButton( {
	clientId,
}: {
	clientId: string;
} ): React.ReactElement {
	const { isVisible, toggle, setPopoverProps, setAssistantFixed, isFixed } =
		useContext( AiAssistantUiContext );
	const { requestingState } = useAiContext();

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

		setBarAnchor( toolbar );

		const isToolbarBlockFixed = toolbar.classList.contains( 'is-fixed' );
		setAssistantFixed( isToolbarBlockFixed );
		handleAiExtensionsBarBodyClass( isToolbarBlockFixed, isVisible );
	}, [ setAssistantFixed, setPopoverProps, isVisible ] );

	const isDisabled = requestingState === 'requesting' || requestingState === 'suggesting';
	return (
		<>
			{ isVisible && isFixed && barAnchor && (
				<Popover
					anchor={ barAnchor }
					variant="toolbar"
					placement="bottom"
					offset={ 0 }
					animate={ false }
					className="jetpack-ai-assistant-bar is-fixed"
				>
					<KeyboardShortcuts
						bindGlobal
						shortcuts={ {
							'mod+/': toggle,
						} }
					/>

					<div style={ { width: '100%' } }>
						<AiAssistantBar clientId={ clientId } />
					</div>
				</Popover>
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
