/**
 * External dependencies
 */
import { useStatsInsights } from '@jetpack-premium-analytics/data';
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
import styles from './most-popular-day.module.css';
import type { MostPopularDayAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but this insight is site-wide and ignores them. The host (and
// Storybook) may still inject them via `attributes`, so accept them here.
type MostPopularDayRenderAttributes = MostPopularDayAttributes &
	Partial< ReportParamsFieldAttributes >;

type MostPopularDayHighlightProps = {
	/**
	 * The most popular day of the week (already localized), e.g. "Thursday".
	 * When absent, the empty state is shown (unless `isLoading` is set).
	 */
	day?: string;
	/**
	 * The share of views that fall on `day`, as a whole-number percentage
	 * (0–100).
	 */
	percent?: number;
	/**
	 * When `true` and there is no data yet, the loading overlay is shown.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, an error message is rendered in place of the highlight.
	 */
	isError?: boolean;
};

/**
 * Presentational body for the "Most popular day" widget. Shows the busiest day
 * of the week and the share of views it draws. Owns the loading, error, empty,
 * and populated states so Storybook can exercise them with fixtures.
 *
 * @param {MostPopularDayHighlightProps} props - The component props.
 * @return The rendered highlight.
 */
export const MostPopularDayHighlight = ( {
	day,
	percent = 0,
	isLoading = false,
	isError = false,
}: MostPopularDayHighlightProps ) => {
	let body;
	if ( isError ) {
		body = (
			<Text className={ styles.placeholder }>
				{ __( 'Unable to load insights.', 'jetpack-premium-analytics' ) }
			</Text>
		);
	} else if ( isLoading && ! day ) {
		body = <WidgetLoadingOverlay />;
	} else if ( ! day ) {
		body = (
			<Text className={ styles.placeholder }>
				{ __( 'Not enough views yet to pick a most popular day.', 'jetpack-premium-analytics' ) }
			</Text>
		);
	} else {
		body = (
			<>
				<Text variant="heading-lg">{ day }</Text>
				<Stack direction="row" align="baseline" gap="xs">
					<MetricWithComparison
						value={ percent / 100 }
						dataFormat={ {
							type: 'percentage',
							options: { decimals: 0, signDisplay: 'never' },
						} }
					/>
					<Text variant="body-sm" className={ styles.caption }>
						{ __( 'of views', 'jetpack-premium-analytics' ) }
					</Text>
				</Stack>
			</>
		);
	}

	return (
		<Stack className={ styles.root } gap="xs">
			{ body }
		</Stack>
	);
};

/**
 * Fetches the Stats Insights report through `useStatsInsights` and hands the
 * "most popular day" fields to the presentational `MostPopularDayHighlight`.
 * The insight is site-wide, so it does not read the dashboard date range.
 *
 * @return The widget content.
 */
function MostPopularDayReport() {
	const { data, isLoading, isError } = useStatsInsights();

	return (
		<MostPopularDayHighlight
			day={ data?.day }
			percent={ data?.percent }
			isLoading={ isLoading }
			isError={ isError }
		/>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme. Host
 * attributes are passed through for the widget contract even though this
 * insight ignores report params.
 *
 * @param {WidgetRenderProps< MostPopularDayRenderAttributes >} props - The render props supplied by the widget host.
 * @return The rendered widget.
 */
export default function MostPopularDay( {
	attributes = {},
}: WidgetRenderProps< MostPopularDayRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MostPopularDayReport />
		</WidgetRoot>
	);
}
