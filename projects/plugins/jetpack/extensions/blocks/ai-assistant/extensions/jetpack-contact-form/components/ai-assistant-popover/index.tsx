/**
 * External dependencies
 */
import { useAiContext, AIControl } from '@automattic/jetpack-ai-client';
import { KeyboardShortcuts, Popover } from '@wordpress/components';
import { useContext } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import { PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, getPrompt } from '../../../../lib/prompt';
import { AiAssistantUiContext } from '../../ui-handler/context';
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
	const { toggle, isVisible, popoverProps, inputValue, setInputValue, width } =
		useContext( AiAssistantUiContext );

	const { requestSuggestion, requestingState } = useAiContext();

	const isLoading = requestingState === 'requesting' || requestingState === 'suggesting';

	const placeholder = __( 'Which form do you need?', 'jetpack' );

	const loadingPlaceholder = __( 'Creating your form. Please wait a few moments.', 'jetpack' );

	if ( ! isVisible ) {
		return null;
	}

	const onStop = () => {
		// TODO: Implement onStop
	};

	const onSend = () => {
		const prompt = getPrompt( PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, {
			request: inputValue,
			content: '',
		} );

		requestSuggestion( prompt );
	};

	return (
		<Popover { ...popoverProps } animate={ false }>
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					'mod+/': toggle,
				} }
			/>
			<div style={ { width } }>
				<AIControl
					loading={ isLoading }
					value={ isLoading ? undefined : inputValue }
					placeholder={ isLoading ? loadingPlaceholder : placeholder }
					onChange={ setInputValue }
					onSend={ onSend }
					onStop={ onStop }
				/>
			</div>
		</Popover>
	);
};
