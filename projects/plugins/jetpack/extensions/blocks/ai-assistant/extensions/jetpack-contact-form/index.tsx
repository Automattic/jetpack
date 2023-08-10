/*
 * External dependencies
 */
import { useAiContext, withAiDataProvider } from '@automattic/jetpack-ai-client';
import { BlockControls } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { createHigherOrderComponent, useViewportMatch } from '@wordpress/compose';
import { select } from '@wordpress/data';
import { useEffect, useCallback, useContext } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
/*
 * Internal dependencies
 */
import { AI_Assistant_Initial_State } from '../../hooks/use-ai-feature';
import { isUserConnected } from '../../lib/connection';
import AiAssistantAnchor from './components/ai-assistant-anchor';
import AiAssistantToolbarButton from './components/ai-assistant-toolbar-button';
import { isJetpackFromBlockAiCompositionAvailable } from './constants';
import { AiAssistantUiContext } from './ui-handler/context';
import withUiHandlerDataProvider, {
	handleAiExtensionsBarBodyClass,
} from './ui-handler/with-ui-handler-data-provider';

/**
 * Check if it is possible to extend the block.
 *
 * @param {string} blockName - The block name.
 * @returns {boolean}          True if it is possible to extend the block.
 */
export function isPossibleToExtendJetpackFormBlock( blockName: string | undefined ): boolean {
	// Check if the AI Assistant block is registered.
	const isBlockRegistered = getBlockType( 'jetpack/ai-assistant' );
	if ( ! isBlockRegistered ) {
		return false;
	}

	// Check if Jetpack extension is enabled.
	if ( ! isJetpackFromBlockAiCompositionAvailable ) {
		return false;
	}

	// Only extend Jetpack Form block.
	if ( blockName !== 'jetpack/contact-form' ) {
		return false;
	}

	// Do not extend the block if the site is not connected.
	const connected = isUserConnected();
	if ( ! connected ) {
		return false;
	}

	// Do not extend if there is an error getting the feature.
	if ( AI_Assistant_Initial_State.errorCode ) {
		return false;
	}

	/*
	 * Do not extend if the AI Assistant block is hidden
	 * Todo: Do we want to make the extension depend on the block visibility?
	 * ToDo: the `editPostStore` is undefined for P2 sites.
	 * Let's find a way to check if the block is hidden.
	 */
	const { getHiddenBlockTypes } = select( 'core/edit-post' ) || {};
	const hiddenBlocks = getHiddenBlockTypes?.() || []; // It will extend the block if the function is undefined.
	if ( hiddenBlocks.includes( blockName ) ) {
		return false;
	}

	return true;
}

const withAiAssistantComponents = createHigherOrderComponent( BlockEdit => {
	return props => {
		if ( ! isPossibleToExtendJetpackFormBlock( props?.name ) ) {
			return <BlockEdit { ...props } />;
		}
		const { eventSource } = useAiContext();
		const { isVisible } = useContext( AiAssistantUiContext );

		const stopSuggestion = useCallback( () => {
			if ( ! eventSource ) {
				return;
			}
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

		const blockControlsProps = {
			group: 'block',
		};

		const isMobileViewport = useViewportMatch( 'medium', '<' );
		useEffect( () => {
			handleAiExtensionsBarBodyClass( isMobileViewport, isVisible );
		}, [ isMobileViewport, isVisible ] );

		return (
			<>
				<BlockEdit { ...props } />

				<AiAssistantAnchor clientId={ props.clientId } />

				<BlockControls { ...blockControlsProps }>
					<AiAssistantToolbarButton clientId={ props.clientId } />
				</BlockControls>
			</>
		);
	};
}, 'withAiAssistantComponents' );

addFilter( 'editor.BlockEdit', 'jetpack/jetpack-form-block-edit', withAiAssistantComponents, 100 );

// Provide the UI Handler data context to the block.
addFilter(
	'editor.BlockListBlock',
	'jetpack/ai-assistant-support',
	withUiHandlerDataProvider,
	100
);

addFilter( 'editor.BlockListBlock', 'jetpack/ai-assistant-block-list', withAiDataProvider, 110 );
