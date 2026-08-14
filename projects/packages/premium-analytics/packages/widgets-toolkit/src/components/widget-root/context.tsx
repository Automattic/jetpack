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
	 */
	setError?: ( error: WidgetErrorConfig | true | null ) => void;
};

const WidgetRootContext = createContext< WidgetRootContextValue | null >( null );

/**
 * @throws {Error} If used outside of WidgetRoot
 * @return {WidgetRootContextValue} The widget root context value
 */
export function useWidgetRootContext(): WidgetRootContextValue {
	const context = useContext( WidgetRootContext );

	if ( ! context ) {
		throw new Error( 'useWidgetRootContext must be used within a WidgetRoot component' );
	}

	return context;
}

export { WidgetRootContext };
