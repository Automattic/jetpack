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
import { SemiCircle, type SemiCircleSegmentInput } from '../../components/semi-circle';
import { useWidgetRootContext } from '../../components/widget-root';

const DEVICE_LABELS: Record< string, string > = {
	mobile: __( 'Mobile', 'jetpack-premium-analytics-pkg' ),
	desktop: __( 'Desktop', 'jetpack-premium-analytics-pkg' ),
	tablet: __( 'Tablet', 'jetpack-premium-analytics-pkg' ),
};

function getDeviceLabel( deviceType: string ): string {
	return DEVICE_LABELS[ deviceType.toLowerCase() ] || deviceType;
}

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

	const segments = useMemo< SemiCircleSegmentInput[] >( () => {
		const previous = new Map(
			( comparison.data?.data ?? [] ).map( item => [
				item.device_type.toLowerCase(),
				item.active_sessions,
			] )
		);

		return ( primary.data?.data ?? [] ).map( item => ( {
			label: getDeviceLabel( item.device_type ),
			value: item.active_sessions,
			// The report lists every device it saw, so one missing from the comparison had no sessions then.
			previousValue: comparison.data
				? ( previous.get( item.device_type.toLowerCase() ) ?? 0 )
				: undefined,
		} ) );
	}, [ primary.data, comparison.data ] );

	return (
		<SemiCircle
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
		/>
	);
}
