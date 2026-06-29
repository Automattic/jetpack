/**
 * External dependencies
 */
import { useGlobalError } from '@jetpack-premium-analytics/data';
import { __ } from '@wordpress/i18n';
import { useEffect } from 'react';
/**
 * Internal dependencies
 */
import { useWidgetRootContext } from '../components/widget-root';

/**
 * Hook to report widget errors to the dashboard's error boundary.
 *
 * This hook manages the error lifecycle:
 * - When an error occurs, it logs the error and reports to the dashboard via setError
 * - When the error clears, it clears the error state
 * - Provides a retry action that clears the error and refetches data
 * - Cleans up error state when the widget unmounts
 *
 * @param isError - Whether the widget is in an error state
 * @param error   - The error object (used for logging)
 * @param refetch - Function to refetch the data (for retry action)
 *
 * @return true if widget is in error state, false otherwise
 *
 * @example
 * ```tsx
 * function MyWidget() {
 *   const { isError, error, refetch } = useMyData();
 *   const hasError = useWidgetError( isError, error, refetch );
 *
 *   if ( hasError ) {
 *     return null; // Dashboard shows error UI via WidgetErrorBoundary
 *   }
 *
 *   return <div>Widget content</div>;
 * }
 * ```
 */
export function useWidgetError(
	isError: boolean,
	error: Error | null | undefined,
	refetch?: () => void
): boolean {
	const { setError } = useWidgetRootContext();
	const { isGlobalError } = useGlobalError();

	useEffect( () => {
		if ( ! isError ) {
			setError?.( null );
			return;
		}

		if ( ! setError ) {
			// Fallback: Log when setError is unavailable (widget outside dashboard context)
			// eslint-disable-next-line no-console
			console.warn( '[useWidgetError] setError is undefined - error UI cannot be displayed' );
			return;
		}

		if ( isGlobalError ) {
			// Global error: show illustration only
			setError( {
				message: '',
			} );
			return;
		}

		// Log error for debugging - captures API errors, network failures, etc.
		if ( error ) {
			// eslint-disable-next-line no-console
			console.error( '[Widget Error]', error.message, error );
		}

		// Widget-specific error: show message + retry
		setError( {
			message: __(
				"We couldn't load this data. Please try again in a moment.",
				'jetpack-premium-analytics'
			),
			action: {
				label: __( 'Retry', 'jetpack-premium-analytics' ),
				onClick: () => {
					setError?.( null );
					refetch?.();
				},
			},
		} );

		// No cleanup function needed: error UI is shown by WidgetErrorBoundary, which unmounts this widget.
		// Calling setError(null) in a cleanup would wrongly clear the error.
		// Error state is handled and cleared by SingleDashboardWidget as needed.
	}, [ isError, error, isGlobalError, setError, refetch ] );

	return isError;
}
