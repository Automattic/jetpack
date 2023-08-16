/**
 * External dependencies
 */
import { ERROR_QUOTA_EXCEEDED, useAiContext } from '@automattic/jetpack-ai-client';
import { createBlock } from '@wordpress/blocks';
import { KeyboardShortcuts } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect, dispatch } from '@wordpress/data';
import { useState, useMemo, useCallback, useEffect, useRef } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { jsonrepair } from 'jsonrepair';
/**
 * Internal dependencies
 */
import { isPossibleToExtendJetpackFormBlock } from '..';
import { AiAssistantUiContextProvider } from './context';
/**
 * Types
 */
import type { RequestingErrorProps } from '@automattic/jetpack-ai-client';
type blockName = string;
type BlockData = [ blockName, Record< string, unknown >, Array< BlockData > | undefined ];

// An identifier to use on the extension error notices,
export const AI_ASSISTANT_JETPACK_FORM_NOTICE_ID = 'ai-assistant';

function parseBlocksFromJson( jsonContent: Array< BlockData > | BlockData ): Array< BlockData > {
	/*
	 * JsonContent can be an array of blocks or a single block (array)
	 * If it's a single block, we need to wrap it in an array.
	 *
	 * Array of blocks:
	 * [
	 * 		[ 'core/paragraph', { content: 'Hello World!' } ],
	 * 		[ 'core/paragraph', { content: 'Hello World!' } ],...
	 * ]
	 *
	 * Single block:
	 * [ 'core/paragraph', { content: 'Hello World!' } ]
	 *
	 * When it's a single block,
	 * the first eement of the array is the block name (string),
	 * so let's check if the first element is a string.
	 * Is so, wrap the array in another array.
	 */
	if ( typeof jsonContent[ 0 ] === 'string' ) {
		console.warn( 'Single block detected. Wrapping in an array.' ); // eslint-disable-line no-console

		// Validate single block before wrapping it in an array
		const [ name, attributes, innerBlocks ] = jsonContent;
		if ( ! name ) {
			console.error( 'Block name is missing.' ); // eslint-disable-line no-console
			debugger;
			return [];
		}

		if ( ! attributes ) {
			console.error( 'Block attributes are missing.' ); // eslint-disable-line no-console
			debugger;
			return [];
		}

		if ( innerBlocks && ! Array.isArray( innerBlocks ) ) {
			console.error( 'Block innerBlocks is not an array.' ); // eslint-disable-line no-console
			debugger;
			return [];
		}

		jsonContent = [ name, attributes, innerBlocks ];
	}

	const blocks = [];
	for ( let i = 0; i < jsonContent.length; i++ ) {
		const blockData = jsonContent[ i ];
		const [ name, attributes, innerBlocks ] = blockData;

		let block;

		try {
			if ( innerBlocks?.length ) {
				const parsedInnerBlocks = parseBlocksFromJson( innerBlocks );
				block = createBlock( name, attributes, parsedInnerBlocks );
			} else {
				block = createBlock( name, attributes );
			}

			blocks.push( block );
		} catch ( e ) {
			console.error( 'Create block error: ', e ); // eslint-disable-line no-console
			console.warn( 'Block data: ', blockData ); // eslint-disable-line no-console
		}
	}

	return blocks;
}

const withUiHandlerDataProvider = createHigherOrderComponent( BlockListBlock => {
	return props => {
		const { clientId, isSelected } = props;

		// const [ inputValue, setInputValue ] = useState(
		// 	'Write a complete article about the CZSpectrum, split in three columns. In the first one, create an introductory content. In the second one, talk about the most important companies around it. In the third one, create a list with the best ten games of it. Use all resources you need to create a beautiful content.'
		// );

		// const [ inputValue, setInputValue ] = useState(
		// 	'Write a large article about Johannes Gutenberg. Please organize the content in three columns. Feel free to add Headers, Lists, quotes, etc.'
		// );

		// 		const [ inputValue, setInputValue ] = useState(
		// 			`Generate content about Mariana Enriquez.
		// In a first column, add a profile picture, create a large text about her biography, some quotes.

		// In a second column, create a list with her best books. In a third column, create a complete form to sell her books.

		// Add header, images, and other resources to make a beautiful composition. And please, the content in Spanish.`
		// 		);

// 		const [ inputValue, setInputValue ] =
// 			useState( `Create a motivation message about reading books.

// In a first column, add a title (uppercase font), some text to make the learners reflect on reading, three quotes of famous people about reading.
// Ensure to set a background image behind the column.

// In the second column, a complete form to sell books. Add a list of ten best-sellers books. Also, set background image behind the form.` );

		// const [ inputValue, setInputValue ] = useState(
		// 	`Create a motivation message about reading books. Wrap the content in a Row group variant.

		// In a first Stack, add a title (in uppercase) that captures the essence of the message. Then, add a thought-provoking text designed to encourage learners to think deeply about the benefits of reading. Add three quotes of famous people about reading, and ensure to put a background image behind the text.

		// In the second Stack, a complete form to sell books. Add a list of ten best-sellers books. Also, ensure to put a background image behind the form.`
		// );
		// AI Assistant component visibility
		const [ isVisible, setAssistantVisibility ] = useState( false );

		const [ inputValue, setInputValue ] = useState( `Create a motivation message about fruits.
Share the benefits of eating fruits. Add a list of ten fruits.
Organize the content by using a layout with two columns.
Feel free to add some tips, quotes, and other resources to make a beautiful composition (images, headers, etc).` );

		// AI Assistant component is-fixed state
		const [ isFixed, setAssistantFixed ] = useState( false );

		const [ assistantAnchor, setAssistantAnchor ] = useState< HTMLElement | null >( null );

		const { replaceInnerBlocks, insertBlocks } = useDispatch( 'core/block-editor' );
		const coreEditorSelect = useSelect( select => select( 'core/editor' ), [] ) as {
			getCurrentPostId: () => number;
		};
		const postId = coreEditorSelect.getCurrentPostId();

		/**
		 * Show the AI Assistant
		 *
		 * @returns {void}
		 */
		const show = useCallback( () => {
			setAssistantVisibility( true );
		}, [] );

		/**
		 * Hide the AI Assistant
		 *
		 * @returns {void}
		 */
		const hide = useCallback( () => {
			setAssistantVisibility( false );
		}, [] );

		/**
		 * Toggle the AI Assistant visibility
		 *
		 * @returns {void}
		 */
		const toggle = useCallback( () => {
			setAssistantVisibility( ! isVisible );
		}, [ isVisible ] );

		/**
		 * Set the AI Assistant anchor
		 *
		 * @param {HTMLElement} anchor
		 */
		const setAnchor = useCallback( ( anchor: HTMLElement | null ) => {
			setAssistantAnchor( anchor );
		}, [] );

		/**
		 * Select the Jetpack Form block
		 *
		 * @returns {void}
		 */
		const selectFormBlock = useCallback( () => {
			dispatch( 'core/block-editor' ).selectBlock( clientId ).then( toggle );
		}, [ clientId, toggle ] );

		const { createNotice } = useDispatch( noticesStore );

		/**
		 * Show the error notice
		 *
		 * @param {RequestingErrorProps} suggestionError
		 * @returns {void}
		 */
		const showSuggestionError = useCallback(
			( { severity, message, code }: RequestingErrorProps ) => {
				if ( code !== ERROR_QUOTA_EXCEEDED ) {
					createNotice( severity, message, {
						isDismissible: true,
						id: AI_ASSISTANT_JETPACK_FORM_NOTICE_ID,
					} );
				}
			},
			[ createNotice ]
		);

		// Show/hide the assistant based on the block selection.
		useEffect( () => {
			if ( isSelected ) {
				return;
			}
			hide();
		}, [ isSelected, hide ] );

		// Build the context value to pass to the provider.
		const contextValue = useMemo(
			() => ( {
				// Value of the input element.
				inputValue,
				setInputValue,

				// Assistant bar visibility.
				isVisible,
				show,
				hide,
				toggle,

				// Assistant bar position and size.
				isFixed,
				setAssistantFixed,

				// Assistant bar anchor.
				assistantAnchor,
				setAnchor,
			} ),
			[ inputValue, isVisible, show, hide, toggle, isFixed, assistantAnchor, setAnchor ]
		);

		// Create a temporary block to use like a container
		const containerBlock = createBlock( 'core/group', { type: 'constrained', align: 'wide' }, [] );
		const { clientId: containerBlockId } = containerBlock;
		const containerBlockWasInserted = useRef( false );

		const setContent = useCallback(
			( newContent: string ) => {
				if ( ! containerBlockWasInserted?.current ) {
					// Insert the container block
					insertBlocks( containerBlock, clientId );
					containerBlockWasInserted.current = true;
				}

				let jsonContent = [];
				try {
					const repairedContent = jsonrepair( newContent );
					jsonContent = JSON.parse( repairedContent );
				} catch ( e ) {
					console.error( 'Error parsing JSON: ', e ); // eslint-disable-line no-console
				}

				let parsedBlocks = [];
				try {
					parsedBlocks = parseBlocksFromJson( jsonContent );
					// Filter out invalid blocks
					parsedBlocks = parsedBlocks?.length
						? parsedBlocks.filter( block => {
								return block.isValid && block.name !== 'core/freeform';
						  } )
						: [];
				} catch ( e ) {
					console.error( 'Error parsing blocks: ', e ); // eslint-disable-line no-console
				}

				// console.log( { parsedBlocks } );
				if ( parsedBlocks?.length ) {
					// Only update the valid blocks
					replaceInnerBlocks( containerBlockId, parsedBlocks );
					// insertBlocks( parsedBlocks, clientId );

					// Update the list of current valid blocks
					// currentListOfValidBlocks.current = parsedBlocks;
				}
			},
			[ clientId, containerBlock, containerBlockId, insertBlocks, replaceInnerBlocks ]
		);

		useAiContext( {
			askQuestionOptions: { postId },
			onDone: setContent,
			onSuggestion: setContent,
			onError: showSuggestionError,
		} );

		/*
		 * Ensure to provide data context,
		 * and the AI Assistant component (popover)
		 * only if is't possible to extend the block.
		 */
		if ( ! isPossibleToExtendJetpackFormBlock( props.name ) ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<AiAssistantUiContextProvider value={ contextValue }>
				<KeyboardShortcuts
					shortcuts={ {
						'mod+/': selectFormBlock,
					} }
				>
					<BlockListBlock { ...props } />
				</KeyboardShortcuts>
			</AiAssistantUiContextProvider>
		);
	};
}, 'withUiHandlerDataProvider' );

export default withUiHandlerDataProvider;
