/**
 * External dependencies
 */
import { SelectField, type SelectOption } from '@jetpack-premium-analytics/fields';
import {
	useResolvedReportParams,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { enabledTrafficPeriods } from './granularity';
import type { TrafficPeriod } from './use-traffic-chart';
import type { ComponentProps } from 'react';

type SelectFieldProps = ComponentProps< typeof SelectField >;

/**
 * Granularity select that disables the options the dashboard range disallows
 * (per the range's allowed-intervals rule — e.g. hours beyond a ~2-day range,
 * days on a year-long range). Auto is always selectable.
 *
 * @param {SelectFieldProps} props - The DataForm control props.
 * @return The select control.
 */
export default function GranularityField( props: SelectFieldProps ) {
	const reportParams = useResolvedReportParams(
		props.data as Partial< ReportParamsFieldAttributes >
	);
	const enabled = useMemo( () => enabledTrafficPeriods( reportParams ), [ reportParams ] );

	const field = useMemo(
		() => ( {
			...props.field,
			elements: props.field.elements?.map( ( element: SelectOption ) =>
				element.value === 'auto'
					? element
					: { ...element, disabled: ! enabled.has( element.value as TrafficPeriod ) }
			),
		} ),
		[ props.field, enabled ]
	);

	return <SelectField { ...props } field={ field } />;
}
