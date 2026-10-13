/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import { summaryCount } from '@jetpack-premium-analytics/widgets-toolkit';

export function useNoViewsRecorded( enabled: boolean ): {
	noViewsRecorded: boolean;
	isChecking: boolean;
} {
	const result = useStatsSite( undefined, { enabled } );

	return {
		noViewsRecorded:
			enabled && ! result.isError && summaryCount( result.data?.stats, 'views' ) === 0,
		isChecking: enabled && result.isLoading,
	};
}
