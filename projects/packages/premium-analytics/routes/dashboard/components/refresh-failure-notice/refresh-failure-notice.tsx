import { AnalyticsQueryClientProvider, useRefreshFailure } from '@jetpack-premium-analytics/data';
import { StaleDataNotice } from '@jetpack-premium-analytics/ui';

/**
 * Reads the shared query cache and renders the notice while a refresh is failing.
 *
 * @return The notice, or `null`.
 */
function ConnectedNotice() {
	const failure = useRefreshFailure();

	if ( ! failure.hasStaleData ) {
		return null;
	}

	return (
		<StaleDataNotice
			updatedAt={ failure.dataUpdatedAt }
			onRetry={ failure.canRetry ? failure.retry : undefined }
			isRetrying={ failure.isRetrying }
		/>
	);
}

/**
 * Speaks for the whole grid: a failed refresh usually takes every widget with it.
 *
 * Brings its own provider around the shared client, the way `WidgetRoot` does
 * for each widget — the dashboard stage itself sits above them all and has none.
 *
 * @return The notice, or `null`.
 */
export function RefreshFailureNotice() {
	return (
		<AnalyticsQueryClientProvider>
			<ConnectedNotice />
		</AnalyticsQueryClientProvider>
	);
}
