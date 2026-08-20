/**
 * External dependencies
 */
import {
	getDefaultPreset,
	normalizeReportParams,
	type ReportParams,
	type StatsPeriod,
} from '@jetpack-premium-analytics/data';
import { SelectField } from '@jetpack-premium-analytics/fields';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { defaultPeriodForInterval } from '../../helpers/default-period-for-interval';
import {
	followedGranularity,
	GRANULARITY_ATTRIBUTE,
	GRANULARITY_PICKED_FOR_ATTRIBUTE,
} from '../../helpers/followed-granularity';
import { granularitiesForRange } from '../../helpers/granularities-for-range';
import { getStoreInfo } from '../../helpers/store-info';
import { useAttributesWithSearchFallback } from '../../hooks/use-attributes-with-search-fallback';
import type { ReportParamsFieldAttributes } from '../date-report-params-field';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';

/**
 * The page's report params, resolved exactly as the widget body resolves them: a
 * host that injects them through attributes (Storybook, the dashboard previews)
 * must not leave this control reading one range while the chart reads another.
 *
 * @param attributes - The widget's attributes, which may carry report params.
 * @return The page's normalized report params.
 */
function usePageReportParams( attributes: Partial< ReportParamsFieldAttributes > ): ReportParams {
	const { reportParams } = useAttributesWithSearchFallback( attributes );
	const { launchedDate } = getStoreInfo();

	// Memoized because the resolved params key the field memo below, and
	// `normalizeReportParams` returns a fresh object every call.
	return useMemo(
		() => normalizeReportParams( reportParams, getDefaultPreset( launchedDate ) ),
		[ reportParams, launchedDate ]
	);
}

/**
 * The "Group by" control for a chart whose bucket follows the page until a
 * reader overrides it.
 *
 * An unset — or no longer applicable — pick means "whatever the page says", so
 * the control resolves it the same way the chart does rather than falling back
 * to the first bucket on the list. Deriving it here, rather than having the
 * widget write the page's bucket into its attributes to be displayed, keeps a
 * widget nobody has touched from dirtying the saved dashboard layout on load.
 *
 * @param props - The control props supplied by the widget host.
 * @return The rendered control.
 */
export default function PageGranularityField< Item >( props: DataFormControlProps< Item > ) {
	const { field, data } = props;
	const params = usePageReportParams( data as Partial< ReportParamsFieldAttributes > );
	const interval = params.interval;

	const followingField = useMemo( () => {
		const declared = ( field.elements ?? [] ).map( element =>
			String( element.value )
		) as unknown as [ StatsPeriod, ...StatsPeriod[] ];
		// Offer only what the range can fill. The chart narrows its own set the
		// same way, so the two never name different buckets.
		const allowed = granularitiesForRange( declared, params );
		const elements = ( field.elements ?? [] ).filter( element =>
			( allowed as readonly string[] ).includes( String( element.value ) )
		);

		return {
			...field,
			elements,
			getValue: ( { item }: { item: Item } ) =>
				followedGranularity( {
					picked: field.getValue( { item } ) as string | undefined,
					pickedFor: ( item as Record< string, unknown > )[ GRANULARITY_PICKED_FOR_ATTRIBUTE ] as
						| string
						| undefined,
					interval,
					allowed,
				} ),
			// Recording what the pick was made against is what lets both the chart
			// and this control decide, from the stored values alone, whether it
			// still applies.
			setValue: ( { value }: { item: Item; value: unknown } ) =>
				( {
					[ GRANULARITY_ATTRIBUTE ]: value,
					[ GRANULARITY_PICKED_FOR_ATTRIBUTE ]: defaultPeriodForInterval( interval, allowed ),
				} ) as unknown as Partial< Item >,
		};
	}, [ field, interval, params ] );

	return <SelectField { ...props } field={ followingField } data={ data } />;
}
