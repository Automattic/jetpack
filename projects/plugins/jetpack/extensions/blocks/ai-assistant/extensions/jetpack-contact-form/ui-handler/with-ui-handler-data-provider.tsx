/**
 * External dependencies
 */
import { KeyboardShortcuts } from '@wordpress/components';
import { createHigherOrderComponent } from '@wordpress/compose';
import { useState, useMemo, useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { isPossibleToExtendJetpackFormBlock } from '..';
import { AiAssistantPopover } from '../components/ai-assistant-popover';
import { AiAssistantUiContextProps, AiAssistantUiContextProvider } from './context';

const withUiHandlerDataProvider = createHigherOrderComponent( BlockListBlock => {
	return props => {
		// AI Assistant component visibility
		const [ isVisible, setAssistantVisibility ] = useState( false );
		const [ popoverProps, setPopoverProps ] = useState<
			AiAssistantUiContextProps[ 'popoverProps' ]
		>( {
			anchor: null,
			placement: 'bottom',
		} );

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
				isVisible,
				popoverProps,

				show,
				hide,
				toggle,

				setPopoverProps,
			} ),
			[ isVisible, popoverProps, show, hide, toggle ]
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
					<AiAssistantPopover />
					<BlockListBlock { ...props } />
				</KeyboardShortcuts>
			</AiAssistantUiContextProvider>
		);
	};
}, 'withUiHandlerDataProvider' );

export default withUiHandlerDataProvider;
