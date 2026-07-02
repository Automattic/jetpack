/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import {
	MetricWithComparison,
	WidgetLoadingOverlay,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { AllTimeViewsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The widget has no attributes and ignores report params, but WidgetRoot still
// forwards host attributes, so the render-only shape composes them in.
type AllTimeViewsRenderAttributes = AllTimeViewsAttributes & Partial< ReportParamsFieldAttributes >;

const VIEWS_FORMAT = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
} as const;

/**
 * Fetches the site stats summary and renders the site's lifetime view total.
 *
 * The summary is not scoped to a date range and has no comparison period, so the
 * metric is rendered as a bare formatted number with a caption.
 *
 * @return The widget content.
 */
function AllTimeViewsMetric() {
	const { data, isLoading, isError } = useStatsSite();

	if ( isError ) {
		return (
			<Stack className={ styles.root }>
				<Text className={ styles.caption }>
					{ __( 'Unable to load view stats.', 'jetpack-premium-analytics' ) }
				</Text>
			</Stack>
		);
	}

	if ( isLoading && ! data ) {
		return (
			<Stack className={ styles.root }>
				<WidgetLoadingOverlay />
			</Stack>
		);
	}

	const views = Number( data?.stats.views ?? 0 );

	return (
		<Stack className={ styles.root } gap="xs">
			<MetricWithComparison value={ views } dataFormat={ VIEWS_FORMAT } />
			<Text className={ styles.caption }>
				{ __( 'Views since your site started', 'jetpack-premium-analytics' ) }
			</Text>
		</Stack>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme. The all-time
 * total comes from the site stats summary, which has no date range or comparison
 * period, so the inner component does not read report params.
 *
 * @param {WidgetRenderProps< AllTimeViewsRenderAttributes >} props - The render props supplied by the widget host.
 * @return The rendered widget.
 */
export default function AllTimeViews( {
	attributes = {},
}: WidgetRenderProps< AllTimeViewsRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<AllTimeViewsMetric />
		</WidgetRoot>
	);
}
