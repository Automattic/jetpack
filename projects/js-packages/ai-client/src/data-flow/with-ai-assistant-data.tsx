/**
 * External Dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import React from 'react';
/**
 * Internal Dependencies
 */
import useAiSuggestions from '../hooks/use-ai-suggestions/index.js';
import { AiDataContextProvider } from './index.js';

/**
 * High Order Component that provides the
 * AI Assistant Data context to the wrapped component.
 *
 * @param {React.ReactElement} WrappedComponent - component to wrap.
 * @returns {React.ReactElement}          		  Wrapped component, with the AI Assistant Data context.
 */
const withAiDataProvider = createHigherOrderComponent(
	( WrappedComponent: React.ComponentType ) => {
		return props => {
			// Connect with the AI Assistant communication layer.
			const {
				suggestion,
				error: requestingError,
				requestingState,
				request: requestSuggestion,
				stopSuggestion,
				eventSource,
			} = useAiSuggestions();

			// Build the context value to pass to the ai assistant data provider.
			const dataContextValue = useMemo(
				() => ( {
					suggestion,
					requestingError,
					requestingState,
					eventSource,

					requestSuggestion,
					stopSuggestion,
				} ),
				[
					suggestion,
					requestingError,
					requestingState,
					eventSource,
					requestSuggestion,
					stopSuggestion,
				]
			);

			return (
				<AiDataContextProvider value={ dataContextValue }>
					<WrappedComponent { ...props } />
				</AiDataContextProvider>
			);
		};
	},
	'withAiDataProvider'
);

export default withAiDataProvider;
