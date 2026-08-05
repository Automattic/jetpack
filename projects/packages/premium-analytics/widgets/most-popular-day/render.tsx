/**
 * External dependencies
 */
import { useStatsSite } from '@jetpack-premium-analytics/data';
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { formatDate, formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { calendar } from '@jetpack-premium-analytics/icons';
import {
	summaryCount,
	WidgetRoot,
	WidgetState,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { MostPopularDayAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven — WidgetRoot resolves them from the date
// picker — but this highlight is site-wide and ignores them. The host (and
// Storybook) may still inject them via `attributes`, so accept them here.
type MostPopularDayRenderAttributes = MostPopularDayAttributes &
	Partial< ReportParamsFieldAttributes >;
type MostPopularDayWidgetProps = WidgetRenderProps< MostPopularDayRenderAttributes >;

type MostPopularDayHighlightProps = {
	/**
	 * The all-time best day for views.
	 */
	date: Date;
	/**
	 * The number of views recorded on `date`.
	 */
	views: number;
	/**
	 * The share of all-time views that fall on `date`, as a fraction (0–1).
	 */
	share?: number;
};

type MostPopularDayFieldProps = {
	label: string;
	value: string;
	caption: string;
};

/**
 * A single labelled highlight: a small label, the prominent value, and a muted
 * caption beneath it (e.g. "Day" / "August 18" / "2020").
 *
 * @param {MostPopularDayFieldProps} props - The field content.
 * @return The rendered field.
 */
const MostPopularDayField = ( { label, value, caption }: MostPopularDayFieldProps ) => (
	<Stack direction="column" gap="xs">
		<Text variant="body-md">{ label }</Text>
		<Text variant="heading-2xl">{ value }</Text>
		<Text variant="body-md" className={ styles.caption }>
			{ caption }
		</Text>
	</Stack>
);

/**
 * Presentational body for the "Most popular day" widget: the all-time best day
 * for views and how many views it drew. Loading / error / empty are handled by
 * `<WidgetState>` in the report component, so this only renders the populated
 * highlight.
 *
 * @param {MostPopularDayHighlightProps} props - The component props.
 * @return The rendered highlight.
 */
export const MostPopularDayHighlight = ( {
	date,
	views,
	share = 0,
}: MostPopularDayHighlightProps ) => (
	<Stack className={ styles.highlight } direction="column" gap="xl" justify="center">
		<MostPopularDayField
			label={ __( 'Day', 'jetpack-premium-analytics-pkg' ) }
			value={ formatDate( date, 'short' ) }
			caption={ formatDate( date, 'year' ) }
		/>
		<MostPopularDayField
			label={ __( 'Views', 'jetpack-premium-analytics-pkg' ) }
			value={ formatMetricValue( views, 'number', { useMultipliers: true, decimals: 1 } ) }
			caption={ sprintf(
				/* translators: %s is a percentage, e.g. "0.32%". */
				__( '%s of views', 'jetpack-premium-analytics-pkg' ),
				formatMetricValue( share, 'percentage', { decimals: 2, signDisplay: 'never' } )
			) }
		/>
	</Stack>
);

function readBestDay( summary: Record< string, unknown > | undefined ) {
	return parseSiteDateTime( summary?.views_best_day );
}

/**
 * Fetches the site stats summary through `useStatsSite` and hands the all-time
 * "best day" fields to the presentational `MostPopularDayHighlight`. The
 * summary is site-wide, so it does not read the dashboard date range.
 *
 * @return The widget content.
 */
function MostPopularDayReport() {
	const { data, isLoading, isFetching, isError, refetch } = useStatsSite();

	const summary = data?.stats;
	const date = readBestDay( summary );
	const views = summaryCount( summary, 'views_best_day_total' );
	const totalViews = summaryCount( summary, 'views' );
	const isEmpty = date === undefined || views === undefined;

	return (
		<Stack className={ styles.root } direction="column">
			<div className={ styles.content }>
				<WidgetState
					isLoading={ isLoading }
					isFetching={ isFetching }
					// The query keeps the previous response via `placeholderData`, so only
					// surface the error when there is nothing to show.
					isError={ isError && isEmpty }
					isEmpty={ isEmpty }
					error={ {
						description: __(
							"We couldn't load your most popular day. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						actions: [
							{
								label: __( 'Retry', 'jetpack-premium-analytics-pkg' ),
								onClick: () => void refetch(),
							},
						],
					} }
					empty={ {
						icon: calendar,
						description: __(
							'Not enough views yet to pick a most popular day.',
							'jetpack-premium-analytics-pkg'
						),
					} }
				>
					{ date !== undefined && views !== undefined && (
						<MostPopularDayHighlight
							date={ date }
							views={ views }
							share={ totalViews ? views / totalViews : 0 }
						/>
					) }
				</WidgetState>
			</div>
		</Stack>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme. Host
 * attributes are passed through for the widget contract even though this
 * highlight ignores report params.
 *
 * @param {MostPopularDayWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function MostPopularDay( { attributes = {} }: MostPopularDayWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<MostPopularDayReport />
		</WidgetRoot>
	);
}
