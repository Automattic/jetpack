/**
 * External Dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';
import React, { ReactNode } from 'react';
/**
 * Internal Dependencies
 */
import { useAiSuggestions } from '../../';
import { AiDataContextProvider } from '.';

/**
 * High Order Component that provides the
 * AI Assistant Data context to the wrapped component.
 *
 * @param {ReactNode} WrappedComponent - component to wrap.
 * @returns {ReactNode}          		 Wrapped component, with the AI Assistant Data context.
 */
const withAiDataProvider = createHigherOrderComponent( ( WrappedComponent: ReactNode ) => {
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
}, 'withAiDataProvider' );

export default withAiDataProvider;
