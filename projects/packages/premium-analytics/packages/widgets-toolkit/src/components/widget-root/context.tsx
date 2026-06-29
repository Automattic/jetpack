/**
 * External dependencies
 */
import { createContext, useContext } from 'react';
import type { WidgetErrorConfig } from '../../types';
import type { ReportParams } from '@jetpack-premium-analytics/data';

export type WidgetRootContextValue = {
	/**
	 * Normalized report parameters resolved from widget attributes or URL.
	 */
	reportParams: ReportParams;

	/**
	 * Function to report an error state in the widget.
	 * Pass `true` for default error, a config object for custom error, or `null` to clear.
	 *
	 * @example
	 * ```tsx
	 * // Show error with retry action
	 * setError( {
	 *   message: 'Failed to load data',
	 *   action: { label: 'Retry', onClick: handleRetry }
	 * } );
	 *
	 * // Clear error state
	 * setError( null );
	 * ```
	 */
	setError?: ( error: WidgetErrorConfig | true | null ) => void;
};

const WidgetRootContext = createContext< WidgetRootContextValue | null >( null );

/**
 * Hook to access the WidgetRoot context.
 *
 * Must be used within a WidgetRoot component.
 *
 * @throws {Error} If used outside of WidgetRoot
 * @return {WidgetRootContextValue} The widget root context value
 *
 * @example
 * ```tsx
 * function MyWidget() {
 *     const { reportParams } = useWidgetRootContext();
 *     // Use reportParams for data fetching
 * }
 * ```
 */
export function useWidgetRootContext(): WidgetRootContextValue {
	const context = useContext( WidgetRootContext );

	if ( ! context ) {
		throw new Error( 'useWidgetRootContext must be used within a WidgetRoot component' );
	}

	return context;
}

export { WidgetRootContext };
