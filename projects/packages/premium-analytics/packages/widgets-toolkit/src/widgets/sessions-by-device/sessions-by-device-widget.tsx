/**
 * External dependencies
 */
import { useReportSessionsByDevice } from '@jetpack-premium-analytics/data';
import { device } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { Donut } from '../../components/donut';
import { useWidgetRootContext } from '../../components/widget-root';
import { buildSessionsByDeviceSegments } from './build-sessions-by-device-segments';

/**
 * Semi-circle chart of sessions by device category (Mobile, Desktop, Tablet),
 * with the period total under the arc and per-device counts in the legend.
 *
 * Must render within a WidgetRoot, which provides reportParams via context.
 */
export function SessionsByDeviceWidget() {
	const { reportParams } = useWidgetRootContext();

	const { primary, comparison, hasComparison, isLoading, isFetching, hasData, isError, refetch } =
		useReportSessionsByDevice( reportParams );

	const segments = useMemo(
		() => buildSessionsByDeviceSegments( primary.data, comparison.data ),
		[ primary.data, comparison.data ]
	);

	return (
		<Donut
			segments={ segments }
			status={ {
				isLoading,
				isFetching,
				// The report queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ {
				description: __(
					"We couldn't load sessions data. Please try again in a moment.",
					'jetpack-premium-analytics-pkg'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch } ],
			} }
			empty={ {
				icon: device,
				description: __( 'No session data in this period.', 'jetpack-premium-analytics-pkg' ),
			} }
			variant="half-ring"
		/>
	);
}
