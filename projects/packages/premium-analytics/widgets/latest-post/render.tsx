/**
 * External dependencies
 */
import {
	MetricValue,
	WidgetRoot,
	WidgetState,
	type DataFormat,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __, sprintf } from '@wordpress/i18n';
import { postList } from '@wordpress/icons';
import { Link, Text } from '@wordpress/ui';
import { format, parseISO } from 'date-fns';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { useLatestPost, type LatestPostWithMetrics } from './use-latest-post';
import type { LatestPostAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// Report params are dashboard-driven, but this widget reports lifetime totals
// and ignores the date range; the host (and Storybook) may still inject them.
type LatestPostRenderAttributes = LatestPostAttributes & Partial< ReportParamsFieldAttributes >;
type LatestPostWidgetProps = WidgetRenderProps< LatestPostRenderAttributes >;

const METRIC_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

type LatestPostCardProps = {
	/**
	 * The resolved latest post.
	 */
	post: LatestPostWithMetrics;
};

/**
 * Formats an ISO date string as a "Published <date>" line, falling back to the
 * raw string when the date cannot be parsed.
 *
 * @param date - The post's ISO date string.
 * @return The formatted publish line, or an empty string when absent.
 */
function formatPublishDate( date: string ): string {
	if ( ! date ) {
		return '';
	}

	const parsed = parseISO( date );
	const formatted = Number.isNaN( parsed.getTime() ) ? date : format( parsed, 'PP' );

	return sprintf(
		/* translators: %s: the post's publish date, e.g. "Jun 5, 2026". */
		__( 'Published %s', 'jetpack-premium-analytics' ),
		formatted
	);
}

type MetricTileProps = {
	label: string;
	value: number;
};

/**
 * A single labelled metric value. This module reports lifetime totals with no
 * comparison period, so it renders the value directly with `MetricValue`.
 *
 * @param {MetricTileProps} props - The tile props.
 * @return The rendered metric tile.
 */
function MetricTile( { label, value }: MetricTileProps ) {
	return (
		<div className={ styles.metric }>
			<Text className={ styles.metricLabel } variant="body-md">
				{ label }
			</Text>
			<MetricValue className={ styles.metricValue } value={ value } dataFormat={ METRIC_FORMAT } />
		</div>
	);
}

/**
 * Presentational card for the "Latest post" widget: the post title (linking to
 * the published post), its publish date, three lifetime metric tiles (views,
 * likes, comments), and the post's featured image when present.
 *
 * Renders only the populated state; loading, error, and empty are handled by
 * `<WidgetState>` in `LatestPostReport`. Exported so Storybook can exercise the
 * card with fixtures.
 *
 * @param {LatestPostCardProps} props - The component props.
 * @return The rendered card.
 */
export const LatestPostCard = ( { post }: LatestPostCardProps ) => {
	const publishDate = formatPublishDate( post.date );

	return (
		<div className={ styles.root }>
			<div className={ styles.content }>
				<div className={ styles.header }>
					<Text className={ styles.title } variant="heading-2xl" render={ <h3 /> }>
						<Link
							className={ styles.titleLink }
							href={ post.url }
							variant="unstyled"
							openInNewTab
							title={ post.title }
						>
							{ post.title }
						</Link>
					</Text>
					{ publishDate && (
						<Text className={ styles.date } variant="body-md">
							{ publishDate }
						</Text>
					) }
				</div>
				<div className={ styles.metrics }>
					<MetricTile label={ __( 'Views', 'jetpack-premium-analytics' ) } value={ post.views } />
					<MetricTile
						label={ __( 'Likes', 'jetpack-premium-analytics' ) }
						value={ post.likeCount }
					/>
					<MetricTile
						label={ __( 'Comments', 'jetpack-premium-analytics' ) }
						value={ post.commentCount }
					/>
				</div>
			</div>
			{ post.imageUrl && (
				<div className={ styles.media }>
					<img className={ styles.image } src={ post.imageUrl } alt={ post.imageAlt } />
				</div>
			) }
		</div>
	);
};

/**
 * Fetches the site's latest post (with its metrics) through `useLatestPost`
 * and hands it to the presentational `LatestPostCard`, with loading, error,
 * and empty states handled by `<WidgetState>`.
 *
 * @return The widget content.
 */
function LatestPostReport() {
	const { post, isLoading, isFetching, isError, refetch } = useLatestPost();

	return (
		<WidgetState
			isLoading={ isLoading }
			isFetching={ isFetching }
			isError={ isError }
			isEmpty={ ! post }
			error={ {
				description: __(
					"We couldn't load your latest post. Please try again in a moment.",
					'jetpack-premium-analytics'
				),
				actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
			} }
			empty={ {
				icon: postList,
				description: __( 'Publish a post to see its stats here.', 'jetpack-premium-analytics' ),
			} }
		>
			{ post && <LatestPostCard post={ post } /> }
		</WidgetState>
	);
}

/**
 * Widget render entry point.
 *
 * WidgetRoot provides the analytics query client and chart theme the inner card
 * relies on. This widget has no own attributes and ignores the dashboard date
 * range, but host attributes are still passed through for the widget contract.
 *
 * @param {LatestPostWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function LatestPost( { attributes = {} }: LatestPostWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<LatestPostReport />
		</WidgetRoot>
	);
}
