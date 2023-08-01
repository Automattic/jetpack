/**
 * External dependencies
 */
import { parse } from '@wordpress/blocks';
import { KeyboardShortcuts } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useDispatch, useSelect } from '@wordpress/data';
import { useState, useMemo, useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { isPossibleToExtendJetpackFormBlock } from '..';
import { AiAssistantPopover } from '../components/ai-assistant-popover';
import { AiAssistantUiContextProps, AiAssistantUiContextProvider } from './context';

const withUiHandlerDataProvider = createHigherOrderComponent( BlockListBlock => {
	return props => {
		const { clientId } = props;
		// AI Assistant input value
		const [ inputValue, setInputValue ] = useState( '' );

		// AI Assistant component visibility
		const [ isVisible, setAssistantVisibility ] = useState( false );
		const [ popoverProps, setPopoverProps ] = useState<
			AiAssistantUiContextProps[ 'popoverProps' ]
		>( {
			anchor: null,
			placement: 'bottom',
		} );

		const { replaceInnerBlocks } = useDispatch( 'core/block-editor' );
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

		// Build the context value to pass to the provider.
		const contextValue = useMemo(
			() => ( {
				inputValue,
				isVisible,
				popoverProps,

				setInputValue,
				show,
				hide,
				toggle,
				setPopoverProps,
			} ),
			[ inputValue, isVisible, popoverProps, show, hide, toggle ]
		);

		const setContent = useCallback(
			( newContent: string ) => {
				// Remove the Jetpack Form block from the content.
				const processedContent = newContent.replace(
					/<!-- (\/)*wp:jetpack\/(contact-)*form ({.*} )*(\/)*-->/g,
					''
				);
				const newContentBlocks = parse( processedContent );

				// Check if the generated blocks are valid.
				const validBlocks = newContentBlocks.filter( block => {
					return block.isValid && block.name !== 'core/freeform';
				} );
				// Only update the valid blocks
				replaceInnerBlocks( clientId, validBlocks );
			},
			[ clientId, replaceInnerBlocks ]
		);

		/*
		 * Ensure to provide data context
		 * only if is't possible to extend the block.
		 */
		if ( ! isPossibleToExtendJetpackFormBlock( props.name ) ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<AiAssistantUiContextProvider value={ contextValue }>
				<KeyboardShortcuts
					shortcuts={ {
						'mod+/': () => {
							toggle();
						},
					} }
				>
					<AiAssistantPopover
						onDone={ setContent }
						onSuggestion={ setContent }
						askQuestionOptions={ postId }
					/>
					<BlockListBlock { ...props } />
				</KeyboardShortcuts>
			</AiAssistantUiContextProvider>
		);
	};
}, 'withUiHandlerDataProvider' );

export default withUiHandlerDataProvider;
