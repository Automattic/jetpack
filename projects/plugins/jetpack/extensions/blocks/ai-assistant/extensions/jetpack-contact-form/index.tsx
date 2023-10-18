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
import AiAssistantBar from './components/ai-assistant-bar';
import AiAssistantToolbarButton from './components/ai-assistant-toolbar-button';
import { isJetpackFromBlockAiCompositionAvailable } from './constants';
import { JETPACK_FORM_CHILDREN_BLOCKS } from './constants';
import withUiHandlerDataProvider from './ui-handler/with-ui-handler-data-provider';

type IsPossibleToExtendJetpackFormBlockProps = {
	checkChildrenBlocks?: boolean;
	clientId: string;
};

/**
 * Check if it is possible to extend the block.
 *
 * @param {string} blockName            - The block name.
 * @param {boolean} checkChildrenBlocks - Check if the block is a child of a Jetpack Form block.
 * @returns {boolean}                     True if it is possible to extend the block.
 */
export function isPossibleToExtendJetpackFormBlock(
	blockName: string | undefined,
	{ checkChildrenBlocks = false, clientId }: IsPossibleToExtendJetpackFormBlockProps = {
		clientId: '',
	}
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

	// clientId is required
	if ( ! clientId?.length ) {
		return false;
	}

	// Do not extend when the block is inside of a core/query block.
	const { getBlockParentsByBlockName } = select( 'core/block-editor' );
	const isChildOfQueryBlock = getBlockParentsByBlockName( clientId, 'core/query' )?.length > 0;
	if ( isChildOfQueryBlock ) {
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

/**
 * HOC to populate the Jetpack Form edit component
 * with the AI Assistant bar and button.
 */
const jetpackFormEditWithAiComponents = createHigherOrderComponent( BlockEdit => {
	return props => {
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
				// Only stop when the parent block is unmouted.
				if ( props?.name !== 'jetpack/contact-form' ) {
					return;
				}

				stopSuggestion();
			};
		}, [ stopSuggestion, props?.name ] );

		// Only extend Jetpack Form block (children not included).
		if ( ! isPossibleToExtendJetpackFormBlock( props?.name, { clientId: props.clientId } ) ) {
			return <BlockEdit { ...props } />;
		}

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
}, 'jetpackFormEditWithAiComponents' );

/**
 * Function used to extend the registerBlockType settings.
 *
 * - Populate the Jetpack Form edit component
 * with the AI Assistant bar and button (jetpackFormEditWithAiComponents).
 *
 * @param {object} settings - The block settings.
 * @param {string} name     - The block name.
 * @returns {object}          The block settings.
 */
function jetpackFormWithAiSupport( settings, name: string ) {
	// Only extend Jetpack Form block type.
	if ( name !== 'jetpack/contact-form' ) {
		return settings;
	}

	return {
		...settings,
		edit: jetpackFormEditWithAiComponents( settings.edit ),
	};
}

addFilter(
	'blocks.registerBlockType',
	'jetpack/ai-assistant-support',
	jetpackFormWithAiSupport,
	100
);

/**
 * HOC to populate the Jetpack Form children blocks edit components:
 * - AI Assistant toolbar button.
 *
 * This HOC must be used only for children blocks of the Jetpack Form block.
 */
const jetpackFormChildrenEditWithAiComponents = createHigherOrderComponent( BlockEdit => {
	return props => {
		// Get clientId of the parent block.
		const parentClientId = useSelect(
			selectData => {
				const { getBlockParentsByBlockName } = selectData( 'core/block-editor' );
				return getBlockParentsByBlockName( props.clientId, 'jetpack/contact-form' )?.[ 0 ];
			},
			[ props.clientId ]
		);

		if (
			! isPossibleToExtendJetpackFormBlock( props?.name, {
				checkChildrenBlocks: true,
				clientId: parentClientId,
			} )
		) {
			return <BlockEdit { ...props } />;
		}

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
}, 'jetpackFormChildrenEditWithAiComponents' );

/*
 * Extend children blocks of Jetpack Form block
 * with the AI Assistant components.
 */
function jetpackFormChildrenEditWithAiSupport( settings, name ) {
	// Only extend allowed blocks (Jetpack form and its children)
	if ( ! JETPACK_FORM_CHILDREN_BLOCKS.includes( name ) ) {
		return settings;
	}

	return {
		...settings,
		edit: jetpackFormChildrenEditWithAiComponents( settings.edit ),
	};
}

addFilter(
	'blocks.registerBlockType',
	'jetpack/ai-assistant-support',
	jetpackFormChildrenEditWithAiSupport
);

// Provide the UI Handler data context to the block.
addFilter(
	'editor.BlockListBlock',
	'jetpack/ai-assistant-support',
	withUiHandlerDataProvider,
	100
);

addFilter( 'editor.BlockListBlock', 'jetpack/ai-assistant-block-list', withAiDataProvider, 110 );
