/**
 * External dependencies
 */
import { useStatsInsights, type StatsInsightsResponse } from '@jetpack-premium-analytics/data';
import {
	WidgetLoadingOverlay,
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { MostPopularTimeAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven and injected via `attributes`; the insights
// endpoint ignores them (it reports across the whole site lifetime with no
// comparison period), but WidgetRoot still expects them on `attributes`.
type MostPopularTimeRenderAttributes = MostPopularTimeAttributes &
	Partial< ReportParamsFieldAttributes >;
type MostPopularTimeWidgetProps = WidgetRenderProps< MostPopularTimeRenderAttributes >;

type HighlightProps = {
	/**
	 * The highlight label (e.g. "Best day").
	 */
	label: string;
	/**
	 * The peak value (e.g. "Tuesday" or "3:00 PM").
	 */
	value: string;
	/**
	 * The value's share of total views, as a whole percent.
	 */
	percent: number;
};

/**
 * A single "best day" / "best hour" highlight: a label, the peak value rendered
 * as a large display figure, and its share of total views.
 *
 * @param {HighlightProps} props - The component props.
 * @return The highlight block.
 */
function Highlight( { label, value, percent }: HighlightProps ) {
	return (
		<Stack direction="column" gap="xs">
			<Text variant="heading-md" render={ <h4 /> } className={ styles.label }>
				{ label }
			</Text>
			<Text variant="heading-2xl" className={ styles.value }>
				{ value }
			</Text>
			<Text variant="body-md" className={ styles.caption }>
				{ sprintf(
					/* translators: %d: share of total views as a whole percent. */
					__( '%d%% of views', 'jetpack-premium-analytics' ),
					percent
				) }
			</Text>
		</Stack>
	);
}

/**
 * Fetches the insights report through the `useStatsInsights` Stats hook and
 * renders the most-popular-time highlights — the peak day and hour, each with
 * its share of views.
 *
 * @return The widget content.
 */
function MostPopularTimeReport() {
	const { data, isLoading, isError } = useStatsInsights();
	const report = data as StatsInsightsResponse | undefined;

	if ( isError ) {
		return (
			<Text className={ styles.placeholder }>
				{ __( 'Unable to load insights.', 'jetpack-premium-analytics' ) }
			</Text>
		);
	}

	if ( isLoading && ! report?.hour ) {
		return <WidgetLoadingOverlay />;
	}

	if ( ! report?.day || ! report?.hour ) {
		return (
			<Text className={ styles.placeholder }>
				{ __(
					'Not enough data to determine your most popular time yet.',
					'jetpack-premium-analytics'
				) }
			</Text>
		);
	}

	return (
		<Stack className={ styles.root } direction="column" gap="lg">
			<Highlight
				label={ __( 'Best day', 'jetpack-premium-analytics' ) }
				value={ report.day }
				percent={ report.percent ?? 0 }
			/>
			<Highlight
				label={ __( 'Best hour', 'jetpack-premium-analytics' ) }
				value={ report.hour }
				percent={ report.hourPercent ?? 0 }
			/>
		</Stack>
	);
}

/**
 * Widget render entry point.
 *
 * Passes host attributes into `WidgetRoot` for the widget contract. The insights
 * report takes no parameters, so the inner component reads nothing from
 * `attributes`.
 *
 * @param {MostPopularTimeWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function MostPopularTime( { attributes = {} }: MostPopularTimeWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MostPopularTimeReport />
		</WidgetRoot>
	);
}
