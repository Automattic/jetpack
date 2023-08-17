/*
 * External dependencies
 */
import { useAiContext, withAiDataProvider } from '@automattic/jetpack-ai-client';
import { BlockControls } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { createHigherOrderComponent } from '@wordpress/compose';
import { select, useSelect } from '@wordpress/data';
import { useEffect, useCallback } from '@wordpress/element';
import { addFilter } from '@wordpress/hooks';
/*
 * Internal dependencies
 */
import { AI_Assistant_Initial_State } from '../../hooks/use-ai-feature';
import { isUserConnected } from '../../lib/connection';
import AiAssistantBar from './components/ai-assistant-bar';
import AiAssistantToolbarButton from './components/ai-assistant-toolbar-button';
import { isJetpackFromBlockAiCompositionAvailable } from './constants';
import { JETPACK_FORM_CHILDREN_BLOCKS } from './constants';
import withUiHandlerDataProvider from './ui-handler/with-ui-handler-data-provider';

/**
 * Check if it is possible to extend the block.
 *
 * @param {string} blockName            - The block name.
 * @param {boolean} checkChildrenBlocks - Check if the block is a child of a Jetpack Form block.
 * @returns {boolean}                     True if it is possible to extend the block.
 */
export function isPossibleToExtendJetpackFormBlock(
	blockName: string | undefined,
	checkChildrenBlocks?: boolean
): boolean {
	// Check if the AI Assistant block is registered.
	const isBlockRegistered = getBlockType( 'jetpack/ai-assistant' );
	if ( ! isBlockRegistered ) {
		return false;
	}

	// Check if Jetpack extension is enabled.
	if ( ! isJetpackFromBlockAiCompositionAvailable ) {
		return false;
	}

	// Only extend allowed blocks.
	if ( checkChildrenBlocks ) {
		// First, check if it should check for children blocks. (false by default)
		if ( ! JETPACK_FORM_CHILDREN_BLOCKS.includes( blockName ) ) {
			return false;
		}
	} else if ( blockName !== 'jetpack/contact-form' ) {
		// If it is not a child block, check if it is the Jetpack Form block.
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

		return (
			<>
				<BlockEdit { ...props } />

				<AiAssistantBar clientId={ props.clientId } />

				<BlockControls { ...blockControlsProps }>
					<AiAssistantToolbarButton />
				</BlockControls>
			</>
		);
	};
}, 'withAiAssistantComponents' );

addFilter( 'editor.BlockEdit', 'jetpack/jetpack-form-block-edit', withAiAssistantComponents, 100 );

/**
 * Add the AI Assistant button to the toolbar.
 * This HOC should be used only for children blocks of the Jetpack Form block.
 */
const withAiToolbarButton = createHigherOrderComponent( BlockEdit => {
	return props => {
		if ( ! isPossibleToExtendJetpackFormBlock( props?.name, true ) ) {
			return <BlockEdit { ...props } />;
		}

		// Get clientId of the parent block.
		const parentClientId = useSelect(
			selectData => {
				const { getBlockParentsByBlockName } = selectData( 'core/block-editor' );
				return getBlockParentsByBlockName( props.clientId, 'jetpack/contact-form' )?.[ 0 ];
			},
			[ props.clientId ]
		);
		const blockControlsProps = {
			group: 'parent',
		};

		return (
			<>
				<BlockEdit { ...props } />

				<BlockControls { ...blockControlsProps }>
					<AiAssistantToolbarButton jetpackFormClientId={ parentClientId } />
				</BlockControls>
			</>
		);
	};
}, 'withAiToolbarButton' );

addFilter( 'editor.BlockEdit', 'jetpack/jetpack-form-block-edit', withAiToolbarButton );

// Provide the UI Handler data context to the block.
addFilter(
	'editor.BlockListBlock',
	'jetpack/ai-assistant-support',
	withUiHandlerDataProvider,
	100
);

addFilter( 'editor.BlockListBlock', 'jetpack/ai-assistant-block-list', withAiDataProvider, 110 );
