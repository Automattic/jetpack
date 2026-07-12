/**
 * External dependencies
 */
import {
	TopPerformingProductsWidget,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
/**
 * Internal dependencies
 */
import type { TopPerformingProductsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { ComponentProps } from 'react';

// Report params are usually URL-driven (WidgetRoot's fallback), but callers may
// also pass them via `attributes`. Compose the render-only shape to cover both.
type TopPerformingProductsRenderAttributes = TopPerformingProductsAttributes &
	Partial< ReportParamsFieldAttributes >;

type TopPerformingProductsWidgetProps =
	WidgetRenderProps< TopPerformingProductsRenderAttributes > & {
		setError?: ComponentProps< typeof WidgetRoot >[ 'setError' ];
	};

/**
 * Top performing products widget.
 *
 * Thin composition over the widgets-toolkit: WidgetRoot provides the query
 * client, chart theme, and resolved report params; TopPerformingProductsWidget
 * fetches physical product data and renders a revenue leaderboard.
 *
 * @param {TopPerformingProductsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function TopPerformingProductsRender( {
	attributes = {},
	setError,
}: TopPerformingProductsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes } setError={ setError } options={ { from: '/' } }>
			<TopPerformingProductsWidget limit={ 5 } />
		</WidgetRoot>
	);
}
