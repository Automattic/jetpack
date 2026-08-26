import { AnalyticsQueryClientProvider, useRefreshFailure } from '@jetpack-premium-analytics/data';
import { StaleDataNotice } from '@jetpack-premium-analytics/ui';

type RefreshFailureNoticeProps = {
	className?: string;
};

/**
 * Reads the shared query cache and renders the notice while a refresh is failing.
 *
 * @param {RefreshFailureNoticeProps} props           - Component props.
 * @param {string}                    props.className - Optional class for layout tweaks.
 * @return The notice, or `null`.
 */
function ConnectedNotice( { className }: RefreshFailureNoticeProps ) {
	const failure = useRefreshFailure();

	if ( ! failure.hasStaleData ) {
		return null;
	}

	return (
		<StaleDataNotice
			className={ className }
			updatedAt={ failure.dataUpdatedAt }
			onRetry={ failure.canRetry ? failure.retry : undefined }
			isRetrying={ failure.isRetrying }
		/>
	);
}

/**
 * Speaks for the whole grid: a failed refresh usually takes every widget with
 * it, and one message with one Retry beats a dozen widgets each saying so.
 *
 * Brings its own provider around the shared client, the way `WidgetRoot` does
 * for each widget — the dashboard stage itself sits above them all and has none.
 *
 * @param {RefreshFailureNoticeProps} props           - Component props.
 * @param {string}                    props.className - Optional class for layout tweaks.
 * @return The notice, or `null` while every widget is showing what it fetched.
 */
export function RefreshFailureNotice( { className }: RefreshFailureNoticeProps ) {
	return (
		<AnalyticsQueryClientProvider>
			<ConnectedNotice className={ className } />
		</AnalyticsQueryClientProvider>
	);
}
