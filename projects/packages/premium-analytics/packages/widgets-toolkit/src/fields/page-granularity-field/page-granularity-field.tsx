/**
 * External dependencies
 */
import {
	getDefaultPreset,
	normalizeReportParams,
	type StatsPeriod,
} from '@jetpack-premium-analytics/data';
import { SelectField } from '@jetpack-premium-analytics/fields';
import { useSearch } from '@wordpress/route';
import { useMemo } from 'react';
/**
 * Internal dependencies
 */
import { defaultPeriodForInterval } from '../../helpers/default-period-for-interval';
import { getStoreInfo } from '../../helpers/store-info';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';

/**
 * The bucket the page's interval control currently implies, clamped to the ones
 * this field offers.
 *
 * @param elements - The field's options, ordered finest to coarsest.
 * @return The page's bucket.
 */
function usePagePeriod( elements: { value: unknown }[] ): StatsPeriod | undefined {
	// `useSearch` throws outside a matched route, which is how Storybook and
	// Post-Launch render these controls, so the call is guarded rather than
	// assumed — as `useAttributesWithSearchFallback` does for the same reason.
	let search: Record< string, unknown > = {};

	try {
		// eslint-disable-next-line react-hooks/rules-of-hooks
		search = useSearch( { strict: false } );
	} catch {
		// Do nothing
	}

	// The field's options are the buckets the chart offers, ordered finest to
	// coarsest — which is the order `defaultPeriodForInterval` clamps against.
	const allowed = elements.map( element => String( element.value ) ) as StatsPeriod[];

	if ( ! allowed.length ) {
		return undefined;
	}

	const { launchedDate } = getStoreInfo();
	const { interval } = normalizeReportParams( search, getDefaultPreset( launchedDate ) );

	return defaultPeriodForInterval( interval, allowed as [ StatsPeriod, ...StatsPeriod[] ] );
}

/**
 * The "Group by" control for a chart whose bucket follows the page until a
 * reader overrides it.
 *
 * An unset attribute means "whatever the page says", so the control resolves it
 * the same way the chart does rather than falling back to the first bucket on
 * the list. Deriving it here — rather than having the widget write the page's
 * bucket into its attributes to be displayed — keeps a widget nobody has touched
 * from dirtying the saved dashboard layout on every load.
 *
 * @param props - The control props supplied by the widget host.
 * @return The rendered control.
 */
export default function PageGranularityField< Item >( props: DataFormControlProps< Item > ) {
	const { field, data } = props;
	const pagePeriod = usePagePeriod( field.elements ?? [] );

	const pageSeededField = useMemo(
		() => ( {
			...field,
			getValue: ( { item }: { item: Item } ) => field.getValue( { item } ) ?? pagePeriod,
		} ),
		[ field, pagePeriod ]
	);

	return <SelectField { ...props } field={ pageSeededField } data={ data } />;
}
