/**
 * External dependencies
 */
import { createContext, useContext } from 'react';
import type { WidgetErrorConfig } from '../../types';
import type { ReportParams } from '@jetpack-premium-analytics/data';

export type WidgetRootContextValue = {
	/**
	 * Normalized report parameters used to fetch and render widget data.
	 */
	reportParams: ReportParams;

	/**
	 * The normalized report window before surface-specific fields are removed.
	 * Link builders use this to preserve state across route transitions.
	 *
	 * Optional for backward compatibility with direct context providers.
	 */
	navigationParams?: ReportParams;

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
