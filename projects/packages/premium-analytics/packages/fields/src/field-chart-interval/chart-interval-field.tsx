/**
 * External dependencies
 */
import {
	chartInterval,
	getDefaultPreset,
	intervalMenuOptions,
	normalizeReportParams,
	useReportScope,
	useScopeLockedIntervals,
	type IntervalExtension,
	type IntervalRange,
	type StatsPeriod,
} from '@jetpack-premium-analytics/data';
import { INTERVAL_TYPES } from '@jetpack-premium-analytics/datetime';
import { DateIntervalDropdown, getIntervalLabel } from '@jetpack-premium-analytics/ui';
import { __ } from '@wordpress/i18n';
import { useSearch } from '@wordpress/route';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { WIDGET_HEADER_TRIGGER_PROPS } from '../helpers/widget-header-trigger';
import type { ReportParamsFieldAttributes } from '../field-report-params';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type ChartIntervalFieldAttributes< P extends StatsPeriod = StatsPeriod > = {
	chartInterval?: P;
};

/**
 * The `elements` that list the buckets a chart draws, from the same list the chart clamps to.
 *
 * @param periods - The periods the chart draws.
 * @return The field's elements.
 */
export function chartIntervalElements( periods: readonly [ StatsPeriod, ...StatsPeriod[] ] ) {
	return periods.map( period => ( { value: period, label: getIntervalLabel( period ) } ) );
}

/**
 * A widget's own change to the buckets its range allows, read from its saved attributes.
 */
type ExtendIntervals< T > = ( range: IntervalRange, item: T ) => IntervalExtension;

function createChartIntervalControl< T extends ChartIntervalFieldAttributes >(
	extendIntervals?: ExtendIntervals< T >
) {
	return function ChartIntervalControl( {
		data,
		field,
		onChange,
	}: DataFormControlProps< T & Partial< ReportParamsFieldAttributes > > ) {
		// The host renders this outside the widget tree, so it reads the applied range off the route.
		const search = useSearch( { strict: false } ) as Parameters<
			typeof normalizeReportParams
		>[ 0 ];
		const ownRange =
			data.reportParams && Object.keys( data.reportParams ).length > 0 ? data.reportParams : null;
		const elements = field.elements;
		const lockedIntervals = useScopeLockedIntervals();
		const intervalUpsell = useReportScope().dateLimits?.intervalUpsell;

		// Clamp, don't rewrite: the saved bucket shows again once the range allows it.
		const { options, lockedOptions, unavailableOptions, unavailableHint, value } = useMemo( () => {
			const periods = (
				elements?.length ? elements.map( ( { value: period } ) => period ) : INTERVAL_TYPES
			) as [ StatsPeriod, ...StatsPeriod[] ];
			// Like the chart: a widget that owns its range reads it before the page's.
			const params = normalizeReportParams( ownRange ?? search, getDefaultPreset() );
			const extension = extendIntervals?.( params, data );

			return {
				...intervalMenuOptions( params, lockedIntervals, periods, extension ),
				value: chartInterval(
					{ ...params, interval: data.chartInterval },
					periods,
					lockedIntervals,
					extension
				),
			};
		}, [ elements, ownRange, search, data, lockedIntervals ] );

		return (
			<DateIntervalDropdown
				options={ options }
				lockedOptions={ lockedOptions }
				lockUpsell={ intervalUpsell }
				unavailableOptions={ unavailableOptions }
				unavailableHint={ unavailableHint }
				value={ value }
				triggerProps={ WIDGET_HEADER_TRIGGER_PROPS }
				onChange={ next =>
					onChange( { chartInterval: next as StatsPeriod } as Parameters< typeof onChange >[ 0 ] )
				}
			/>
		);
	};
}

/**
 * The "Chart interval" attribute a chart widget declares to save its own bucket size. Pair it
 * with `with_header_interval_control: false` on the section, so the header offers no second one.
 *
 * @param extendIntervals - The widget's own change to the buckets its range allows.
 * @return The field.
 */
export function chartIntervalAttributeField<
	T extends ChartIntervalFieldAttributes = ChartIntervalFieldAttributes,
>( extendIntervals?: ExtendIntervals< T > ): WidgetAttributeField< T > {
	return {
		id: 'chartInterval',
		// A getter: this module loads before the translations do.
		get label() {
			return __( 'Chart interval', 'jetpack-premium-analytics-pkg' );
		},
		relevance: 'high',
		Edit: createChartIntervalControl( extendIntervals ) as WidgetAttributeField< T >[ 'Edit' ],
	};
}
