/**
 * External Dependencies
 */
import { useMemo } from '@wordpress/element';
import React, { ReactNode } from 'react';
/**
 * Internal Dependencies
 */
import { useAiSuggestions } from '../../';
import { AiAssistantDataContextProvider } from '.';

/**
 * High Order Component that provides the
 * AI Assistant Data context to the wrapped component.
 *
 * @param {ReactNode} WrappedComponent - component to wrap.
 * @returns {ReactNode}          		 Wrapped component, with the AI Assistant Data context.
 */
const withAiDataProvider = ( WrappedComponent: ReactNode ): ReactNode => {
	return props => {
		// Connect with the AI Assistant communication layer.
		const {
			suggestion,
			error: requestingError,
			requestingState,
			request: requestSuggestion,
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
			} ),
			[ suggestion, requestingError, requestingState, eventSource, requestSuggestion ]
		);

		return (
			<AiAssistantDataContextProvider value={ dataContextValue }>
				<WrappedComponent { ...props } />
			</AiAssistantDataContextProvider>
		);
	};
};

export default withAiDataProvider;
