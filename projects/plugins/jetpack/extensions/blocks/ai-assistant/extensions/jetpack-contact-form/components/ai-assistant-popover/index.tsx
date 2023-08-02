/**
 * External dependencies
 */
import { useAiContext } from '@automattic/jetpack-ai-client';
import { Button, KeyboardShortcuts, Popover, TextControl } from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, getPrompt } from '../../../../lib/prompt';
import { AiAssistantUiContext } from '../../ui-handler/context';
import './style.scss';
/*
 * Types
 */
import type React from 'react';

/**
 * useAiContext hook to provide access to
 * the AI Assistant data (from context),
 * and to subscribe to the request events (onDone, onSuggestion).
 *
 * @returns {React.Component}          the AI Assistant data context.
 */
export const AiAssistantPopover = () => {
	const { isVisible, hide, toggle, popoverProps, inputValue, setInputValue } =
		useContext( AiAssistantUiContext );

	const { requestSuggestion, requestingState } = useAiContext();

	const isDisabled = requestingState === 'requesting' || requestingState === 'suggesting';

	if ( ! isVisible ) {
		return null;
	}

	return (
		<Popover onClose={ hide } { ...popoverProps } className="jetpack-ai-assistant__popover">
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					'mod+/': toggle,
				} }
			>
				<div className="jetpack-ai-assistant__popover-container">
					<TextControl onChange={ setInputValue } value={ inputValue } disabled={ isDisabled } />

					<Button
						variant="primary"
						onClick={ () => {
							const prompt = getPrompt( PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, {
								request: inputValue,
								content: '',
							} );

							requestSuggestion( prompt );
						} }
						disabled={ isDisabled }
					>
						{ __( 'Ask', 'jetpack' ) }
					</Button>
				</div>
			</KeyboardShortcuts>
		</Popover>
	);
};
