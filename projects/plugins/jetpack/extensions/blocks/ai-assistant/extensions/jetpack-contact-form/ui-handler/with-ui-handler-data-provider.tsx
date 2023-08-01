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
import { AiAssistantUiContextProvider } from './context';

const withAiAssistantExtension = createHigherOrderComponent( BlockListBlock => {
	return props => {
		// AI Assistant component visibility
		const [ isAssistantShown, setAssistantVisibility ] = useState( false );
		const [ isAssistantMenuShown, setAssistantMenuVisibility ] = useState( true );

		/**
		 * Show the AI Assistant
		 *
		 * @returns {void}
		 */
		const showAssistant = useCallback( () => {
			setAssistantVisibility( true );
		}, [] );

		/**
		 * Hide the AI Assistant
		 *
		 * @returns {void}
		 */
		const hideAssistant = useCallback( () => {
			setAssistantVisibility( false );
		}, [] );

		/**
		 * Toggle the AI Assistant visibility
		 *
		 * @returns {void}
		 */
		const toggleAssistant = useCallback( () => {
			setAssistantVisibility( ! isAssistantShown );
		}, [ isAssistantShown ] );

		/**
		 * Show the AI Assistant menu
		 *
		 * @returns {void}
		 */
		const showAssistantMenu = useCallback( () => {
			setAssistantMenuVisibility( true );
		}, [] );

		/**
		 * Hide the AI Assistant menu
		 *
		 * @returns {void}
		 */
		const hideAssistantMenu = useCallback( () => {
			setAssistantMenuVisibility( false );
		}, [] );
		// Build the context value to pass to the provider.
		const contextValue = useMemo(
			() => ( {
				isAssistantShown,
				showAssistant,
				hideAssistant,
				toggleAssistant,

				isAssistantMenuShown,
				showAssistantMenu,
				hideAssistantMenu,
			} ),
			[
				isAssistantShown,
				showAssistant,
				hideAssistant,
				toggleAssistant,
				isAssistantMenuShown,
				showAssistantMenu,
				hideAssistantMenu,
			]
		);

		if ( ! isPossibleToExtendJetpackFormBlock( props.name ) ) {
			return <BlockListBlock { ...props } />;
		}

		return (
			<AiAssistantUiContextProvider value={ contextValue }>
				<KeyboardShortcuts
					shortcuts={ {
						'mod+/': () => {
							toggleAssistant();
						},
					} }
				>
					<BlockListBlock { ...props } />
				</KeyboardShortcuts>
			</AiAssistantUiContextProvider>
		);
	};
}, 'withAiAssistantExtension' );

export default withAiAssistantExtension;
