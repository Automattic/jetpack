/**
 * External dependencies
 */
import { useAiContext, AIControl } from '@automattic/jetpack-ai-client';
import { serialize } from '@wordpress/blocks';
import { KeyboardShortcuts, Popover } from '@wordpress/components';
import { select } from '@wordpress/data';
import { useContext, useCallback, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import UpgradePrompt from '../../../../components/upgrade-prompt';
import useAIFeature from '../../../../hooks/use-ai-feature';
import { PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, getPrompt } from '../../../../lib/prompt';
import { AiAssistantUiContext } from '../../ui-handler/context';
/*
 * Types
 */
import type React from 'react';

import './style.scss';

type AiAssistantPopoverProps = {
	clientId?: string;
};

const debug = debugFactory( 'jetpack-ai-assistant:form-assistant' );

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

/**
 * useAiContext hook to provide access to
 * the AI Assistant data (from context),
 * and to subscribe to the request events (onDone, onSuggestion).
 *
 * @param {string} clientId  - The block client ID. Optional.
 * @returns {React.Component} the AI Assistant data context.
 */

export const AiAssistantPopover = ( {
	clientId = '',
}: AiAssistantPopoverProps ): React.ReactNode => {
	const { isVisible, isFixed, toggle, show, hide, popoverProps, inputValue, setInputValue, width } =
		useContext( AiAssistantUiContext );

	const { requestSuggestion, requestingState, eventSource } = useAiContext();

	const { requireUpgrade } = useAIFeature();

	const stopSuggestion = useCallback( () => {
		if ( ! eventSource ) {
			return;
		}
		debug( 'Stopping suggestion' );
		eventSource?.close();
	}, [ eventSource ] );

	useEffect( () => {
		/*
		 * Cleanup function to remove the event listeners
		 * and close the event source.
		 */
		return () => {
			stopSuggestion();
		};
	}, [ stopSuggestion ] );

	const isLoading = requestingState === 'requesting' || requestingState === 'suggesting';

	const placeholder = __( 'Ask Jetpack AI to create your form', 'jetpack' );

	const loadingPlaceholder = __( 'Creating your form. Please wait a few moments.', 'jetpack' );

	const onStop = () => {
		// TODO: Implement onStop
	};

	const onSend = useCallback( () => {
		const prompt = getPrompt( PROMPT_TYPE_JETPACK_FORM_CUSTOM_PROMPT, {
			request: inputValue,
			content: getSerializedContentFromBlock( clientId ),
		} );

		requestSuggestion( prompt, { feature: 'jetpack-form-ai-extension' } );
	}, [ clientId, inputValue, requestSuggestion ] );

	const [ anchor, setAnchor ] = useState< HTMLElement | null >( null );

	/*
	 * Hack to deal with a race condition
	 * that happens where the popover anchor changes:
	 * - Keeps the anchor reference in the local state of the component.
	 * - When the popoverProps.anchor changes, it updates the local state.
	 */
	useEffect( () => {
		setTimeout( () => {
			setAnchor( popoverProps.anchor );
		}, 0 );
	}, [ popoverProps.anchor, show, hide ] );

	if ( ! isVisible ) {
		return null;
	}

	return (
		<Popover
			{ ...popoverProps }
			anchor={ anchor }
			animate={ false }
			className={ classNames( 'jetpack-ai-assistant__popover', {
				'is-fixed': isFixed,
			} ) }
		>
			<KeyboardShortcuts
				bindGlobal
				shortcuts={ {
					'mod+/': toggle,
				} }
			/>

			<div style={ { width } }>
				{ requireUpgrade && <UpgradePrompt /> }
				<AIControl
					disabled={ requireUpgrade }
					value={ isLoading ? undefined : inputValue }
					placeholder={ isLoading ? loadingPlaceholder : placeholder }
					onChange={ setInputValue }
					onSend={ onSend }
					onStop={ onStop }
					state={ requestingState }
					isOpaque={ requireUpgrade }
				/>
			</div>
		</Popover>
	);
};
