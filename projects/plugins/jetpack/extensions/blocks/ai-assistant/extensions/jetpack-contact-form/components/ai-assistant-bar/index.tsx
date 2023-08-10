/**
 * External dependencies
 */
import { useAiContext, AIControl } from '@automattic/jetpack-ai-client';
import { serialize } from '@wordpress/blocks';
import { select } from '@wordpress/data';
import { useContext, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import classNames from 'classnames';
import UpgradePrompt from '../../../../components/upgrade-prompt';
import useAIFeature from '../../../../hooks/use-ai-feature';
import { PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, getPrompt } from '../../../../lib/prompt';
import { AiAssistantUiContext } from '../../ui-handler/context';

/**
 * Return the serialized content from the childrens block.
 *
 * @param {string} clientId - The block client ID.
 * @returns {string}          The serialized content.
 */
function getSerializedContentFromBlock( clientId: string ): string {
	if ( ! clientId?.length ) {
		return '';
	}

	const block = select( 'core/block-editor' ).getBlock( clientId );
	if ( ! block ) {
		return '';
	}

	const { innerBlocks } = block;
	if ( ! innerBlocks?.length ) {
		return '';
	}

	return innerBlocks.reduce( ( acc, innerBlock ) => {
		return acc + serialize( innerBlock ) + '\n\n';
	}, '' );
}

export default function AiAssistantBar( {
	clientId,
	className = '',
}: {
	clientId: string;
	className?: string;
} ) {
	const { requireUpgrade } = useAIFeature();

	const { inputValue, setInputValue, isFixed } = useContext( AiAssistantUiContext );

	const { requestSuggestion, requestingState, stopSuggestion } = useAiContext();

	const isLoading = requestingState === 'requesting' || requestingState === 'suggesting';

	const placeholder = __( 'Ask Jetpack AI to create your form', 'jetpack' );

	const loadingPlaceholder = __( 'Creating your form. Please wait a few moments.', 'jetpack' );

	const onSend = useCallback( () => {
		const prompt = getPrompt( PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, {
			request: inputValue,
			content: getSerializedContentFromBlock( clientId ),
		} );

		requestSuggestion( prompt, { feature: 'jetpack-form-ai-extension' } );
	}, [ clientId, inputValue, requestSuggestion ] );

	return (
		<div className={ classNames( 'jetpack-ai-assistant__bar', className ) }>
			{ requireUpgrade && <UpgradePrompt /> }
			<AIControl
				disabled={ requireUpgrade }
				value={ isLoading ? undefined : inputValue }
				placeholder={ isLoading ? loadingPlaceholder : placeholder }
				onChange={ setInputValue }
				onSend={ onSend }
				onStop={ stopSuggestion }
				state={ requestingState }
				isOpaque={ requireUpgrade }
				showButtonsLabel={ ! isFixed }
			/>
		</div>
	);
}
