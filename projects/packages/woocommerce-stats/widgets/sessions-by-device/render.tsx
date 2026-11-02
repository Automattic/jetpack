/**
 * External dependencies
 */
import {
	Donut,
	describeError,
	useWidgetRootContext,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@automattic/jetpack-premium-analytics-sdk';
import { __ } from '@wordpress/i18n';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { useReportSessionsByDevice } from '../../src/reports';
import { buildSessionsByDeviceSegments } from './build-sessions-by-device-segments';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * No configurable attributes; the empty record allows host-provided fields, such as the report
 * params.
 */
export type SessionsByDeviceAttributes = Record< never, never >;

type SessionsByDeviceRenderAttributes = SessionsByDeviceAttributes &
	Partial< ReportParamsFieldAttributes >;

/**
 * Sessions of the period by device category, drawn as a half ring with the total under the arc,
 * read under the widget root for its report params.
 *
 * @return {JSX.Element} The breakdown.
 */
function SessionsByDevice() {
	const { reportParams } = useWidgetRootContext();
	const {
		primary,
		comparison,
		hasComparison,
		isLoading,
		isFetching,
		hasData,
		isError,
		error,
		refetch,
	} = useReportSessionsByDevice( reportParams );

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
				// The queries keep the previous range's data on screen, so an error only shows without it.
				isError: isError && ! hasData,
				hasComparison,
				refetch,
			} }
			error={ describeError( error, {
				retryDescription: __(
					"We couldn't load sessions data. Please try again in a moment.",
					'jetpack-woocommerce-stats-pkg'
				),
				onRetry: refetch,
			} ) }
			variant="half-ring"
			chartTitle={ __( 'Sessions by device', 'jetpack-woocommerce-stats-pkg' ) }
			total={ primary.data?.summary.total_sessions }
			previousTotal={ comparison.data?.summary.total_sessions }
		/>
	);
}

/**
 * The Sessions by device widget.
 *
 * @param {WidgetRenderProps< SessionsByDeviceRenderAttributes >} props - The props the host passes.
 * @return {JSX.Element} The widget.
 */
export default function SessionsByDeviceRender( {
	attributes = {},
}: WidgetRenderProps< SessionsByDeviceRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<SessionsByDevice />
		</WidgetRoot>
	);
}
