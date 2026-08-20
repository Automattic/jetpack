/**
 * External dependencies
 */
import {
	getDefaultPreset,
	normalizeReportParams,
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
import { getStoreInfo } from '../../helpers/store-info';
import { useAttributesWithSearchFallback } from '../../hooks/use-attributes-with-search-fallback';
import type { ReportParamsFieldAttributes } from '../date-report-params-field';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';

/**
 * The page's interval, resolved exactly as the widget body resolves it: a host
 * that injects report params through attributes (Storybook, the dashboard
 * previews) must not leave this control reading one interval while the chart
 * reads another.
 *
 * @param attributes - The widget's attributes, which may carry report params.
 * @return The page's interval.
 */
function usePageInterval( attributes: Partial< ReportParamsFieldAttributes > ): string | undefined {
	const { reportParams } = useAttributesWithSearchFallback( attributes );
	const { launchedDate } = getStoreInfo();

	return normalizeReportParams( reportParams, getDefaultPreset( launchedDate ) ).interval;
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
	const interval = usePageInterval( data as Partial< ReportParamsFieldAttributes > );

	const followingField = useMemo( () => {
		const allowed = ( field.elements ?? [] ).map( element =>
			String( element.value )
		) as unknown as [ StatsPeriod, ...StatsPeriod[] ];

		return {
			...field,
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
	}, [ field, interval ] );

	return <SelectField { ...props } field={ followingField } data={ data } />;
}
