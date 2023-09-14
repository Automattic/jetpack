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

type OptionsProps = {
	/**
	 * Array of block names to apply the data provider to.
	 */
	blocks: string[] | string;
};

/**
 * Function that returns a High Order Component that provides the
 * AI Assistant Data context to the wrapped component.
 *
 * Ideally though to use with the `editor.BlockListBlock` filter.
 *
 * @see https://developer.wordpress.org/block-editor/reference-guides/filters/block-filters/#editor-blocklistblock
 * @param {OptionsProps} options - Options
 * @param {string[]} options.blocks - Array of block names to apply the data provider to.
 * @returns {ReactNode}          	  Wrapped component, populated with the AI Assistant Data context.
 */
export const blockListBlockWithAiDataProvider = ( options: OptionsProps = { blocks: [ '' ] } ) => {
	return createHigherOrderComponent( ( WrappedComponent: ReactNode ) => {
		return props => {
			const blockName = props?.block?.name;
			if ( ! blockName ) {
				return <WrappedComponent { ...props } />;
			}

			/*
			 * Extend only blocks that are specified in the blocks option.
			 * `blocks` option accepts a string or an array of strings.
			 */
			const blockTypesToExtend = Array.isArray( options.blocks )
				? options.blocks
				: [ options.blocks ];

			if ( ! blockTypesToExtend.includes( blockName ) ) {
				return <WrappedComponent { ...props } />;
			}

			// Connect with the AI Assistant communication layer.
			// @todo: this is a copy of the code above, we should refactor this.
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
	}, 'blockListBlockWithAiDataProvider' );
};
