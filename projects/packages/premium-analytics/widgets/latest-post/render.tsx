/**
 * External dependencies
 */
import { useStatsLatestPost, type StatsLatestPostWithViews } from '@jetpack-premium-analytics/data';
import {
	MetricWithComparison,
	WidgetLoadingOverlay,
	WidgetRoot,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Link, Stack, Text } from '@wordpress/ui';
import { format, parseISO } from 'date-fns';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { LatestPostAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven, but this widget reports lifetime totals
// and ignores the date range; the host (and Storybook) may still inject them.
type LatestPostRenderAttributes = LatestPostAttributes & Partial< ReportParamsFieldAttributes >;

const METRIC_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

type LatestPostCardProps = {
	/**
	 * The resolved latest post, or null to render the empty state.
	 */
	post?: StatsLatestPostWithViews | null;
	/**
	 * When `true` and there is no post yet, the full loading overlay is shown.
	 */
	isLoading?: boolean;
	/**
	 * When `true`, an error message is rendered in place of the post.
	 */
	isError?: boolean;
};

/**
 * Formats an ISO date string as a human-readable publish date, falling back to
 * the raw string when the date cannot be parsed.
 *
 * @param date - The post's ISO date string.
 * @return The formatted date, or an empty string when absent.
 */
function formatPublishDate( date: string ): string {
	if ( ! date ) {
		return '';
	}

	const parsed = parseISO( date );

	return Number.isNaN( parsed.getTime() ) ? date : format( parsed, 'PPP' );
}

type MetricTileProps = {
	label: string;
	value: number;
};

/**
 * A single labelled metric value. Uses `MetricWithComparison` in its value-only
 * mode (no `previousValue`), so no delta is shown — this module has no
 * comparison period.
 *
 * @param {MetricTileProps} props - The tile props.
 * @return The rendered metric tile.
 */
function MetricTile( { label, value }: MetricTileProps ) {
	return (
		<Stack className={ styles.metric } gap="xs">
			<Text className={ styles.metricLabel }>{ label }</Text>
			<MetricWithComparison value={ value } dataFormat={ METRIC_FORMAT } />
		</Stack>
	);
}

/**
 * Presentational card for the "Latest post" widget: the post title (linking to
 * the published post), its publish date, and three lifetime metric tiles
 * (views, likes, comments).
 *
 * Takes the already-fetched post via props and owns only the loading, error,
 * empty, and populated states. Exported so Storybook can exercise those states
 * with fixtures.
 *
 * @param {LatestPostCardProps} props - The component props.
 * @return The rendered card.
 */
export const LatestPostCard = ( {
	post = null,
	isLoading = false,
	isError = false,
}: LatestPostCardProps ) => {
	let body;
	if ( isError ) {
		body = (
			<Text className={ styles.placeholder }>
				{ __( 'Unable to load your latest post.', 'jetpack-premium-analytics' ) }
			</Text>
		);
	} else if ( isLoading && ! post ) {
		body = <WidgetLoadingOverlay />;
	} else if ( ! post ) {
		body = (
			<Text className={ styles.placeholder }>
				{ __( 'Publish a post to see its stats here.', 'jetpack-premium-analytics' ) }
			</Text>
		);
	} else {
		const publishDate = formatPublishDate( post.date );

		body = (
			<Stack className={ styles.content } gap="md">
				<Stack gap="xs">
					<Link
						className={ styles.title }
						href={ post.url }
						variant="unstyled"
						openInNewTab
						title={ post.title }
					>
						{ post.title }
					</Link>
					{ publishDate && <Text className={ styles.date }>{ publishDate }</Text> }
				</Stack>
				<Stack className={ styles.metrics } direction="row" gap="lg">
					<MetricTile label={ __( 'Views', 'jetpack-premium-analytics' ) } value={ post.views } />
					<MetricTile
						label={ __( 'Likes', 'jetpack-premium-analytics' ) }
						value={ post.likeCount }
					/>
					<MetricTile
						label={ __( 'Comments', 'jetpack-premium-analytics' ) }
						value={ post.commentCount }
					/>
				</Stack>
			</Stack>
		);
	}

	return <Stack className={ styles.root }>{ body }</Stack>;
};

/**
 * Fetches the site's latest post (and its views) through `useStatsLatestPost`
 * and hands it to the presentational `LatestPostCard`.
 *
 * @return The widget content.
 */
function LatestPostReport() {
	const { post, isLoading, isError } = useStatsLatestPost();

	return <LatestPostCard post={ post } isLoading={ isLoading } isError={ isError } />;
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme the inner card
 * relies on. This widget has no own attributes and ignores the dashboard date
 * range, but host attributes are still passed through for the widget contract.
 *
 * @param {WidgetRenderProps< LatestPostRenderAttributes >} props - The render props supplied by the widget host.
 * @return The rendered widget.
 */
export default function LatestPost( {
	attributes = {},
}: WidgetRenderProps< LatestPostRenderAttributes > ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<LatestPostReport />
		</WidgetRoot>
	);
}
